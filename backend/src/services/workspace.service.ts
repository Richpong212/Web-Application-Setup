import { Op } from "sequelize";
import { db } from "../config/connectDb";
import {
  Flock,
  DailyRecord,
  FeedStage,
  VaccinationSchedule,
  VaccinationRecord,
  FarmTask,
  FarmMember,
  User,
  AuditLog,
} from "../models";
import { farmAccess, ownerAccess } from "./access.service";
import { publicFlock } from "./flock.service";
import { publicRecord } from "./record.service";

export const getWorkspace = async (userId: string, farmId: string) => {
  return db.transaction(async (transaction) => {
    const access = await farmAccess(userId, farmId, undefined, transaction);
    const can = (permission: (typeof access.permissions)[number]) =>
      access.permissions.includes(permission);
    const memberships = can("tasks.read")
      ? await FarmMember.findAll({ where: { farmId }, transaction })
      : [];
    const people = memberships.length
      ? await User.findAll({
          where: {
            id: { [Op.in]: memberships.map((member) => member.userId) },
          },
          attributes: ["id", "name"],
          transaction,
        })
      : [];
    const flocks = can("flocks.read")
      ? await Flock.findAll({
          where: { farmId },
          order: [["dateReceived", "DESC"]],
          transaction,
        })
      : [];
    const records = can("records.read")
      ? await DailyRecord.findAll({
          where: { farmId },
          order: [["date", "DESC"]],
          transaction,
        })
      : [];
    const feedRows =
      can("feed.read") || can("flocks.read")
        ? await DailyRecord.findAll({
            where: { farmId },
            attributes: ["flockId", "date", "feedKg", "mortality"],
            transaction,
          })
        : [];
    const treatments = can("health.read")
      ? await DailyRecord.findAll({
          where: { farmId, medication: { [Op.ne]: "" } },
          attributes: ["id", "date", "flockId", "medication", "recordedBy"],
          transaction,
        })
      : [];
    const feedSchedule = can("feed.read")
      ? await FeedStage.findAll({
          where: { farmId },
          order: [["fromWeek", "ASC"]],
          transaction,
        })
      : [];
    const vaccineSchedule = can("health.read")
      ? await VaccinationSchedule.findAll({
          where: { farmId },
          order: [["day", "ASC"]],
          transaction,
        })
      : [];
    const completions = can("health.read")
      ? await VaccinationRecord.findAll({
          where: { farmId },
          order: [["date", "DESC"]],
          transaction,
        })
      : [];
    const tasks = can("tasks.read")
      ? await FarmTask.findAll({
          where: { farmId },
          order: [["due", "ASC"]],
          transaction,
        })
      : [];
    return {
      permissions: access.permissions,
      isOwner: access.isOwner,
      treatments,
      feedSummary: can("feed.read")
        ? {
            totalKg:
              feedRows.reduce(
                (sum, row) => sum + Math.round(Number(row.feedKg) * 1000),
                0,
              ) / 1000,
            recordedDays: new Set(feedRows.map((row) => row.date)).size,
            byFlock: flocks.map((flock) => {
              const rows = feedRows
                .filter((row) => row.flockId === flock.id)
                .sort((a, b) => b.date.localeCompare(a.date));
              return {
                flockId: flock.id,
                totalKg:
                  rows.reduce(
                    (sum, row) => sum + Math.round(Number(row.feedKg) * 1000),
                    0,
                  ) / 1000,
                lastKg: Number(rows[0]?.feedKg || 0),
              };
            }),
          }
        : null,
      flocks: flocks.map((flock) => ({
        ...publicFlock(flock),
        currentBirds:
          flock.initialBirds -
          feedRows
            .filter((row) => row.flockId === flock.id)
            .reduce((sum, row) => sum + row.mortality, 0),
        mortality: feedRows
          .filter((row) => row.flockId === flock.id)
          .reduce((sum, row) => sum + row.mortality, 0),
      })),
      records: records.map(publicRecord),
      feedSchedule,
      vaccineSchedule,
      completions: completions.map((record) => ({
        id: record.id,
        flockId: record.flockId,
        scheduleId: record.scheduleId,
        day: record.day,
        name: record.name,
        by: record.recordedBy,
        at: record.date,
        notes: record.notes,
      })),
      activities: tasks.map((task) => ({
        id: task.id,
        farmId,
        title: task.title,
        due: task.due,
        done: task.done,
        assigneeId: task.assigneeId,
        assignee:
          people.find((person) => person.id === task.assigneeId)?.name || "",
      })),
      members: memberships.map((member) => ({
        id: member.id,
        userId: member.userId,
        name:
          people.find((person) => person.id === member.userId)?.name ||
          "Former member",
        email: "",
        role: member.role,
        permissions: member.permissions,
        farmIds: [farmId],
        status: "Active",
      })),
    };
  });
};

export const listAudit = async (userId: string, farmId: string) => {
  await ownerAccess(userId, farmId);
  return AuditLog.findAll({
    where: { farmId },
    limit: 100,
    order: [["createdAt", "DESC"]],
  });
};
