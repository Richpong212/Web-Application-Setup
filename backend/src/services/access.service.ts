import { Transaction } from "sequelize";
import { Farm, FarmMember, AuditLog } from "../models";
import {
  permissionNames,
  resolvePermissions,
  Permission,
} from "../config/permissions";
import { HttpError } from "../utils/httpError";

export const farmAccess = async (
  userId: string,
  farmId: string,
  permission?: Permission,
  transaction?: Transaction,
) => {
  // All farm writes lock the farm first, including membership changes. Permission
  // checks and the operation therefore cannot race an owner revoking access.
  const farm = await Farm.findByPk(farmId, {
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  const member = await FarmMember.findOne({
    where: { farmId, userId },
    transaction,
  });
  if (!farm || !member) throw new HttpError("NOT_FOUND");
  const isOwner = farm.ownerId === userId;
  const permissions = isOwner
    ? [...permissionNames]
    : resolvePermissions(member.role, member.permissions);
  if (permission && !permissions.includes(permission))
    throw new HttpError("PERMISSION_DENIED");
  return { farm, member, isOwner, permissions };
};

export const ownerAccess = async (
  userId: string,
  farmId: string,
  transaction?: Transaction,
) => {
  const access = await farmAccess(userId, farmId, undefined, transaction);
  if (!access.isOwner) throw new HttpError("PERMISSION_DENIED");
  return access;
};

export const audit = async (
  farmId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  transaction: Transaction,
  reason = "",
) => {
  await AuditLog.create(
    { farmId, actorId, action, entityType, entityId, before, after, reason },
    { transaction },
  );
};
