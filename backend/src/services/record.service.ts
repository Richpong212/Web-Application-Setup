import { Op, UniqueConstraintError } from "sequelize";
import { db } from "../config/connectDb";
import { Flock, DailyRecord, User } from "../models";
import { farmAccess, audit } from "./access.service";
import { HttpError } from "../utils/httpError";

export interface RecordInput {
  flockId: string;
  date: string;
  mortality: number;
  cause?: string;
  feedKg: number;
  eggs: number;
  medication?: string;
  activity?: string;
  notes?: string;
}
export const publicRecord = (record: DailyRecord) => {
  const { createdBy, ...data } = record.get({ plain: true });
  void createdBy;
  return { ...data, feedKg: Number(record.feedKg) };
};

export const createRecord = async (
  user: User,
  farmId: string,
  input: RecordInput,
) => {
  try {
    return await db.transaction(async (transaction) => {
      await farmAccess(user.id, farmId, "records.write", transaction);
      const flock = await Flock.findOne({
        where: { id: input.flockId, farmId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!flock) throw new HttpError("NOT_FOUND");
      if (flock.status !== "Active" || input.date < flock.dateReceived)
        throw new HttpError("VALIDATION_ERROR", [
          {
            field: "date",
            message: "Choose a valid date for an active flock.",
          },
        ]);
      const total =
        Number(
          await DailyRecord.sum("mortality", {
            where: { flockId: flock.id, farmId },
            transaction,
          }),
        ) || 0;
      if (total + input.mortality > flock.initialBirds)
        throw new HttpError("VALIDATION_ERROR", [
          {
            field: "mortality",
            message: "Mortality exceeds the flock's remaining birds.",
          },
        ]);
      const record = await DailyRecord.create(
        { ...input, farmId, recordedBy: user.name, createdBy: user.id },
        { transaction },
      );
      await audit(
        farmId,
        user.id,
        "record.created",
        "dailyRecord",
        record.id,
        null,
        publicRecord(record),
        transaction,
      );
      return publicRecord(record);
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw new HttpError("CONFLICT");
    throw error;
  }
};

export const correctRecord = async (
  userId: string,
  farmId: string,
  recordId: string,
  input: Partial<Omit<RecordInput, "flockId" | "date">> & { reason: string },
) => {
  return db.transaction(async (transaction) => {
    await farmAccess(userId, farmId, "records.correct", transaction);
    const record = await DailyRecord.findOne({
      where: { id: recordId, farmId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) throw new HttpError("NOT_FOUND");
    const flock = await Flock.findOne({
      where: { id: record.flockId, farmId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!flock) throw new HttpError("NOT_FOUND");
    const otherDeaths =
      Number(
        await DailyRecord.sum("mortality", {
          where: { farmId, flockId: flock.id, id: { [Op.ne]: record.id } },
          transaction,
        }),
      ) || 0;
    if (
      otherDeaths + (input.mortality ?? record.mortality) >
      flock.initialBirds
    )
      throw new HttpError("VALIDATION_ERROR", [
        {
          field: "mortality",
          message: "Mortality exceeds the flock's remaining birds.",
        },
      ]);
    const before = publicRecord(record);
    const { reason, ...values } = input;
    await record.update(values, { transaction });
    await audit(
      farmId,
      userId,
      "record.corrected",
      "dailyRecord",
      record.id,
      before,
      publicRecord(record),
      transaction,
      reason,
    );
    return publicRecord(record);
  });
};
