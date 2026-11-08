import { Op, UniqueConstraintError } from "sequelize";
import { db } from "../config/connectDb";
import {
  FeedStage,
  VaccinationSchedule,
  VaccinationRecord,
  Flock,
  User,
} from "../models";
import { farmAccess, audit } from "./access.service";
import { HttpError } from "../utils/httpError";

export const replaceFeedSchedule = async (
  userId: string,
  farmId: string,
  stages: { fromWeek: number; toWeek: number; feed: string }[],
) => {
  const sorted = [...stages].sort((a, b) => a.fromWeek - b.fromWeek);
  if (
    sorted.some(
      (stage, index) =>
        stage.toWeek < stage.fromWeek ||
        (index > 0 && stage.fromWeek <= sorted[index - 1].toWeek),
    )
  )
    throw new HttpError("VALIDATION_ERROR", [
      { field: "stages", message: "Feeding stages must not overlap." },
    ]);
  await db.transaction(async (transaction) => {
    await farmAccess(userId, farmId, "feed.write", transaction);
    const before = await FeedStage.findAll({
      where: { farmId },
      transaction,
      raw: true,
    });
    await FeedStage.destroy({ where: { farmId }, transaction });
    await FeedStage.bulkCreate(
      stages.map((stage) => ({ ...stage, farmId })),
      { transaction },
    );
    await audit(
      farmId,
      userId,
      "feed.schedule-updated",
      "farm",
      farmId,
      before,
      stages,
      transaction,
    );
  });
};

export const replaceVaccinationSchedule = async (
  userId: string,
  farmId: string,
  entries: { id?: string; day: number; name: string }[],
) => {
  if (
    new Set(entries.map((entry) => `${entry.day}:${entry.name.toLowerCase()}`))
      .size !== entries.length
  )
    throw new HttpError("VALIDATION_ERROR", [
      { field: "entries", message: "Vaccination entries must be unique." },
    ]);
  await db.transaction(async (transaction) => {
    await farmAccess(userId, farmId, "health.write", transaction);
    const before = await VaccinationSchedule.findAll({
      where: { farmId },
      transaction,
    });
    const previous = before.map((row) => row.get({ plain: true }));
    const retained: string[] = [];
    for (const entry of entries) {
      const existing = entry.id
        ? before.find((item) => item.id === entry.id)
        : undefined;
      if (entry.id && !existing) throw new HttpError("NOT_FOUND");
      const row = existing
        ? await existing.update(
            { day: entry.day, name: entry.name },
            { transaction },
          )
        : await VaccinationSchedule.create(
            { farmId, day: entry.day, name: entry.name },
            { transaction },
          );
      retained.push(row.id);
    }
    // Completed vaccination records preserve their copied vaccine/day information.
    await VaccinationSchedule.destroy({
      where: {
        farmId,
        ...(retained.length ? { id: { [Op.notIn]: retained } } : {}),
      },
      transaction,
    });
    await audit(
      farmId,
      userId,
      "health.schedule-updated",
      "farm",
      farmId,
      previous,
      entries,
      transaction,
    );
  });
};

export const completeVaccination = async (
  user: User,
  farmId: string,
  input: { flockId: string; scheduleId: string; date: string; notes?: string },
) => {
  try {
    await db.transaction(async (transaction) => {
      await farmAccess(user.id, farmId, "health.complete", transaction);
      const flock = await Flock.findOne({
        where: { id: input.flockId, farmId, status: "Active" },
        transaction,
      });
      const schedule = await VaccinationSchedule.findOne({
        where: { id: input.scheduleId, farmId },
        transaction,
      });
      if (!flock || !schedule) throw new HttpError("NOT_FOUND");
      if (input.date < flock.dateReceived)
        throw new HttpError("VALIDATION_ERROR", [
          {
            field: "date",
            message: "Choose a date on or after the flock arrived.",
          },
        ]);
      const record = await VaccinationRecord.create(
        {
          ...input,
          farmId,
          name: schedule.name,
          day: schedule.day,
          recordedBy: user.name,
          createdBy: user.id,
        },
        { transaction },
      );
      await audit(
        farmId,
        user.id,
        "health.vaccination-completed",
        "vaccinationRecord",
        record.id,
        null,
        { flockId: flock.id, name: schedule.name, date: input.date },
        transaction,
      );
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw new HttpError("CONFLICT");
    throw error;
  }
};
