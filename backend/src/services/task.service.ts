import { db } from "../config/connectDb";
import { FarmTask, FarmMember } from "../models";
import { farmAccess, audit } from "./access.service";
import { HttpError } from "../utils/httpError";

export const createTask = async (
  userId: string,
  farmId: string,
  input: { title: string; due: string; assigneeId?: string | null },
) => {
  return db.transaction(async (transaction) => {
    await farmAccess(userId, farmId, "tasks.write", transaction);
    if (
      input.assigneeId &&
      !(await FarmMember.findOne({
        where: { farmId, userId: input.assigneeId },
        transaction,
      }))
    )
      throw new HttpError("NOT_FOUND");
    const task = await FarmTask.create({ ...input, farmId }, { transaction });
    await audit(
      farmId,
      userId,
      "task.created",
      "task",
      task.id,
      null,
      input,
      transaction,
    );
    return task;
  });
};

export const updateTask = async (
  userId: string,
  farmId: string,
  taskId: string,
  input: {
    title?: string;
    due?: string;
    assigneeId?: string | null;
    done?: boolean;
  },
) => {
  return db.transaction(async (transaction) => {
    const access = await farmAccess(userId, farmId, undefined, transaction);
    const task = await FarmTask.findOne({
      where: { id: taskId, farmId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!task) throw new HttpError("NOT_FOUND");
    const manages = access.permissions.includes("tasks.write");
    if (Object.keys(input).some((key) => key !== "done") && !manages)
      throw new HttpError("PERMISSION_DENIED");
    if (
      input.done !== undefined &&
      (!access.permissions.includes("tasks.complete") ||
        (!manages && (task.assigneeId !== userId || !input.done)))
    )
      throw new HttpError("PERMISSION_DENIED");
    if (
      input.assigneeId &&
      !(await FarmMember.findOne({
        where: { farmId, userId: input.assigneeId },
        transaction,
      }))
    )
      throw new HttpError("NOT_FOUND");
    const before = task.get({ plain: true });
    await task.update(
      {
        ...input,
        ...(input.done === undefined
          ? {}
          : {
              completedAt: input.done ? new Date() : null,
              completedBy: input.done ? userId : null,
            }),
      },
      { transaction },
    );
    await audit(
      farmId,
      userId,
      "task.updated",
      "task",
      task.id,
      before,
      task.get({ plain: true }),
      transaction,
    );
    return task;
  });
};

export const deleteTask = async (
  userId: string,
  farmId: string,
  taskId: string,
) => {
  await db.transaction(async (transaction) => {
    await farmAccess(userId, farmId, "tasks.write", transaction);
    const task = await FarmTask.findOne({
      where: { id: taskId, farmId },
      transaction,
    });
    if (!task) throw new HttpError("NOT_FOUND");
    await audit(
      farmId,
      userId,
      "task.deleted",
      "task",
      task.id,
      task.get({ plain: true }),
      null,
      transaction,
    );
    await task.destroy({ transaction });
  });
};
