import { Op } from "sequelize";
import { db } from "../config/connectDb";
import { appConfig } from "../config/index.config";
import {
  resolvePermissions,
  TeamRole,
  permissionNames,
  defaultPermissions,
} from "../config/permissions";
import { Farm, FarmMember, FarmInvitation, FarmTask, User } from "../models";
import { createEmailToken, hashToken } from "../utils/authToken";
import { sendEmail } from "../utils/sendEmail";
import { HttpError } from "../utils/httpError";
import { ownerAccess, audit } from "./access.service";

export const listTeam = async (actorId: string, farmId: string) => {
  await ownerAccess(actorId, farmId);
  const memberships = await FarmMember.findAll({
    where: { farmId },
    order: [["createdAt", "ASC"]],
  });
  const users = await User.findAll({
    where: { id: { [Op.in]: memberships.map((member) => member.userId) } },
  });
  const members = memberships.map((member) => {
    const user = users.find((item) => item.id === member.userId)!;
    return {
      id: member.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: member.role,
      permissions:
        member.role === "Owner"
          ? []
          : resolvePermissions(member.role, member.permissions),
    };
  });
  const invitations = await FarmInvitation.findAll({
    where: { farmId, status: "Pending" },
    attributes: ["id", "email", "role", "permissions", "expiresAt"],
    order: [["createdAt", "DESC"]],
  });
  return {
    members,
    invitations,
    availablePermissions: permissionNames,
    roleDefaults: defaultPermissions,
  };
};

const deliverInvitation = async (
  email: string,
  farmName: string,
  token: string,
) => {
  await sendEmail({
    email,
    subject: "Your farm team invitation",
    text: `You have been invited to join ${farmName}.\n\nOpen this link, log in with this email address and accept the invitation:\n${appConfig.app.clientUrl}/invite?token=${token}\n\nIf you do not have an account, create one and approve your signup first. This invitation expires in seven days.`,
  });
};

export const inviteMember = async (
  actorId: string,
  farmId: string,
  input: { email: string; role: TeamRole; permissions?: string[] },
) => {
  const token = createEmailToken();
  const result = await db.transaction(async (transaction) => {
    const { farm } = await ownerAccess(actorId, farmId, transaction);
    const user = await User.findOne({
      where: { email: input.email },
      transaction,
    });
    if (
      user &&
      (await FarmMember.findOne({
        where: { farmId, userId: user.id },
        transaction,
      }))
    )
      throw new HttpError("CONFLICT");
    const existing = await FarmInvitation.findOne({
      where: { farmId, email: input.email, status: "Pending" },
      transaction,
    });
    const values = {
      ...input,
      farmId,
      permissions: input.permissions ?? null,
      tokenHash: hashToken(token),
      status: "Pending",
      invitedBy: actorId,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    };
    const invitation = existing
      ? await existing.update(values, { transaction })
      : await FarmInvitation.create(values, { transaction });
    await audit(
      farmId,
      actorId,
      "team.invited",
      "invitation",
      invitation.id,
      null,
      {
        email: input.email,
        role: input.role,
        permissions: input.permissions ?? null,
      },
      transaction,
    );
    return { farmName: farm.name, invitationId: invitation.id };
  });
  // Delivery failure preserves the invitation so the owner can resend it.
  try {
    await deliverInvitation(input.email, result.farmName, token);
  } catch {
    throw new HttpError("SERVICE_UNAVAILABLE");
  }
  return { id: result.invitationId };
};

export const cancelInvitation = async (
  actorId: string,
  farmId: string,
  invitationId: string,
) => {
  await db.transaction(async (transaction) => {
    await ownerAccess(actorId, farmId, transaction);
    const invitation = await FarmInvitation.findOne({
      where: { id: invitationId, farmId, status: "Pending" },
      transaction,
    });
    if (!invitation) throw new HttpError("NOT_FOUND");
    await invitation.update({ status: "Revoked" }, { transaction });
    await audit(
      farmId,
      actorId,
      "team.invitation-revoked",
      "invitation",
      invitation.id,
      null,
      null,
      transaction,
    );
  });
};

export const previewInvitation = async (token: string) => {
  const invitation = await FarmInvitation.findOne({
    where: {
      tokenHash: hashToken(token),
      status: "Pending",
      expiresAt: { [Op.gt]: new Date() },
    },
  });
  const farm = invitation ? await Farm.findByPk(invitation.farmId) : null;
  if (!invitation || !farm) throw new HttpError("INVITATION_INVALID");
  return {
    email: invitation.email,
    farmName: farm.name,
    role: invitation.role,
  };
};

export const acceptInvitation = async (user: User, token: string) => {
  return db.transaction(async (transaction) => {
    const lookup = await FarmInvitation.findOne({
      where: { tokenHash: hashToken(token) },
      transaction,
    });
    if (!lookup) throw new HttpError("INVITATION_INVALID");
    const farm = await Farm.findByPk(lookup.farmId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const invitation = await FarmInvitation.findOne({
      where: {
        id: lookup.id,
        status: "Pending",
        expiresAt: { [Op.gt]: new Date() },
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!farm || !invitation) throw new HttpError("INVITATION_INVALID");
    if (!user.isEmailVerified || user.email !== invitation.email)
      throw new HttpError("INVITATION_ACCOUNT");
    const existing = await FarmMember.findOne({
      where: { farmId: farm.id, userId: user.id },
      transaction,
    });
    if (!existing)
      await FarmMember.create(
        {
          farmId: farm.id,
          userId: user.id,
          role: invitation.role,
          permissions: invitation.permissions,
        },
        { transaction },
      );
    await invitation.update(
      { status: "Accepted", acceptedBy: user.id },
      { transaction },
    );
    await audit(
      farm.id,
      user.id,
      "team.accepted",
      "invitation",
      invitation.id,
      null,
      { userId: user.id },
      transaction,
    );
    return { farmId: farm.id };
  });
};

export const updateMember = async (
  actorId: string,
  farmId: string,
  memberId: string,
  input: { role: TeamRole; permissions?: string[] },
) => {
  await db.transaction(async (transaction) => {
    const { farm } = await ownerAccess(actorId, farmId, transaction);
    const member = await FarmMember.findOne({
      where: { id: memberId, farmId },
      transaction,
    });
    if (!member) throw new HttpError("NOT_FOUND");
    if (member.userId === farm.ownerId)
      throw new HttpError("PERMISSION_DENIED");
    const before = { role: member.role, permissions: member.permissions };
    await member.update(
      { role: input.role, permissions: input.permissions ?? null },
      { transaction },
    );
    await audit(
      farmId,
      actorId,
      "team.permissions-updated",
      "member",
      member.id,
      before,
      input,
      transaction,
    );
  });
};

export const removeMember = async (
  actorId: string,
  farmId: string,
  memberId: string,
) => {
  await db.transaction(async (transaction) => {
    const { farm } = await ownerAccess(actorId, farmId, transaction);
    const member = await FarmMember.findOne({
      where: { id: memberId, farmId },
      transaction,
    });
    if (!member) throw new HttpError("NOT_FOUND");
    if (member.userId === farm.ownerId)
      throw new HttpError("PERMISSION_DENIED");
    await FarmTask.update(
      { assigneeId: null },
      {
        where: { farmId, assigneeId: member.userId, done: false },
        transaction,
      },
    );
    await member.destroy({ transaction });
    await audit(
      farmId,
      actorId,
      "team.removed",
      "member",
      member.id,
      { userId: member.userId },
      null,
      transaction,
    );
  });
};
