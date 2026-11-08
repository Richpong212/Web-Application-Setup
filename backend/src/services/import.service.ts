import { randomUUID } from "crypto";
import { Op, Transaction } from "sequelize";
import { db } from "../config/connectDb";
import { DailyRecord, Flock, User } from "../models";
import { farmAccess, audit } from "./access.service";
import { HttpError } from "../utils/httpError";

export interface HistoryRow {
  source: string;
  date: string;
  mortality: number;
  feedKg: number;
  eggs: number;
  cause: string;
  medication: string;
  activity: string;
  notes: string;
}
export interface HistoryInput {
  flockId: string;
  fileName: string;
  rows: HistoryRow[];
}
const fields = [
  "mortality",
  "feedKg",
  "eggs",
  "cause",
  "medication",
  "activity",
  "notes",
] as const;

const review = async (
  userId: string,
  farmId: string,
  input: HistoryInput,
  transaction: Transaction,
) => {
  await farmAccess(userId, farmId, "records.import", transaction);
  const flock = await Flock.findOne({
    where: { id: input.flockId, farmId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!flock) throw new HttpError("NOT_FOUND");
  const existing = await DailyRecord.findAll({
    where: {
      farmId,
      flockId: flock.id,
      date: { [Op.in]: input.rows.map((row) => row.date) },
    },
    transaction,
  });
  const seen = new Set<string>();
  const rows = input.rows.map((row) => {
    let status: "ready" | "duplicate" | "error" = "ready";
    let message = "Ready to import";
    const saved = existing.find((record) => record.date === row.date);
    if (row.date < flock.dateReceived) {
      status = "error";
      message = "Date is before this flock arrived.";
    } else if (seen.has(row.date)) {
      status = "error";
      message = "This date appears more than once in the workbook.";
    } else if (saved) {
      const same = fields.every((field) =>
        typeof row[field] === "number"
          ? Number(saved[field]) === row[field]
          : (saved[field] || "") === row[field],
      );
      status = same ? "duplicate" : "error";
      message = same
        ? "Already imported; will be skipped."
        : "A different record exists for this date. Existing records will not be overwritten.";
    }
    seen.add(row.date);
    return { ...row, status, message };
  });
  const ready = rows.filter((row) => row.status === "ready");
  const recordedMortality =
    Number(
      await DailyRecord.sum("mortality", {
        where: { farmId, flockId: flock.id },
        transaction,
      }),
    ) || 0;
  if (
    recordedMortality + ready.reduce((sum, row) => sum + row.mortality, 0) >
    flock.initialBirds
  ) {
    for (const row of ready) {
      row.status = "error";
      row.message =
        "Imported mortality would exceed this flock's initial bird count.";
    }
  }
  return {
    rows,
    ready: rows.filter((row) => row.status === "ready").length,
    duplicates: rows.filter((row) => row.status === "duplicate").length,
    errors: rows.filter((row) => row.status === "error").length,
  };
};

export const previewHistory = (
  userId: string,
  farmId: string,
  input: HistoryInput,
) =>
  db.transaction((transaction) => review(userId, farmId, input, transaction));

export const importHistory = (
  user: User,
  farmId: string,
  input: HistoryInput,
) =>
  db.transaction(async (transaction) => {
    // Recheck membership, dates and duplicates under the same lock as the write.
    const result = await review(user.id, farmId, input, transaction);
    if (result.errors)
      throw new HttpError("VALIDATION_ERROR", [
        {
          field: "rows",
          message:
            "Review the import again and resolve the highlighted records before saving.",
        },
      ]);
    const ready = result.rows.filter((row) => row.status === "ready");
    const records = await DailyRecord.bulkCreate(
      ready.map(({ source, status, message, ...row }) => {
        void source;
        void status;
        void message;
        return {
          ...row,
          farmId,
          flockId: input.flockId,
          recordedBy: user.name,
          createdBy: user.id,
        };
      }),
      { transaction, validate: true },
    );
    const batchId = randomUUID();
    if (records.length)
      await audit(
        farmId,
        user.id,
        "records.imported",
        "historyImport",
        batchId,
        null,
        {
          fileName: input.fileName,
          flockId: input.flockId,
          imported: records.length,
          skipped: result.duplicates,
          records: records.map((record, index) => ({
            id: record.id,
            date: record.date,
            source: ready[index].source,
          })),
        },
        transaction,
      );
    return { batchId, imported: records.length, skipped: result.duplicates };
  });
