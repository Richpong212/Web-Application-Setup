"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.updateMember = exports.acceptInvitation = exports.previewInvitation = exports.cancelInvitation = exports.inviteMember = exports.listTeam = void 0;
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
const index_config_1 = require("../config/index.config");
const permissions_1 = require("../config/permissions");
const models_1 = require("../models");
const authToken_1 = require("../utils/authToken");
const sendEmail_1 = require("../utils/sendEmail");
const httpError_1 = require("../utils/httpError");
const access_service_1 = require("./access.service");
const listTeam = (actorId, farmId) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, access_service_1.ownerAccess)(actorId, farmId);
    const memberships = yield models_1.FarmMember.findAll({
        where: { farmId },
        order: [["createdAt", "ASC"]],
    });
    const users = yield models_1.User.findAll({
        where: { id: { [sequelize_1.Op.in]: memberships.map((member) => member.userId) } },
    });
    const members = memberships.map((member) => {
        const user = users.find((item) => item.id === member.userId);
        return {
            id: member.id,
            userId: user.id,
            name: user.name,
            email: user.email,
            role: member.role,
            permissions: member.role === "Owner"
                ? []
                : (0, permissions_1.resolvePermissions)(member.role, member.permissions),
        };
    });
    const invitations = yield models_1.FarmInvitation.findAll({
        where: { farmId, status: "Pending" },
        attributes: ["id", "email", "role", "permissions", "expiresAt"],
        order: [["createdAt", "DESC"]],
    });
    return {
        members,
        invitations,
        availablePermissions: permissions_1.permissionNames,
        roleDefaults: permissions_1.defaultPermissions,
    };
});
exports.listTeam = listTeam;
const deliverInvitation = (email, farmName, token) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, sendEmail_1.sendEmail)({
        email,
        subject: "Your farm team invitation",
        text: `You have been invited to join ${farmName}.\n\nOpen this link, log in with this email address and accept the invitation:\n${index_config_1.appConfig.app.clientUrl}/invite?token=${token}\n\nIf you do not have an account, create one and approve your signup first. This invitation expires in seven days.`,
    });
});
const inviteMember = (actorId, farmId, input) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authToken_1.createEmailToken)();
    const result = yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { farm } = yield (0, access_service_1.ownerAccess)(actorId, farmId, transaction);
        const user = yield models_1.User.findOne({
            where: { email: input.email },
            transaction,
        });
        if (user &&
            (yield models_1.FarmMember.findOne({
                where: { farmId, userId: user.id },
                transaction,
            })))
            throw new httpError_1.HttpError("CONFLICT");
        const existing = yield models_1.FarmInvitation.findOne({
            where: { farmId, email: input.email, status: "Pending" },
            transaction,
        });
        const values = Object.assign(Object.assign({}, input), { farmId, permissions: (_a = input.permissions) !== null && _a !== void 0 ? _a : null, tokenHash: (0, authToken_1.hashToken)(token), status: "Pending", invitedBy: actorId, expiresAt: new Date(Date.now() + 7 * 86400000) });
        const invitation = existing
            ? yield existing.update(values, { transaction })
            : yield models_1.FarmInvitation.create(values, { transaction });
        yield (0, access_service_1.audit)(farmId, actorId, "team.invited", "invitation", invitation.id, null, {
            email: input.email,
            role: input.role,
            permissions: (_b = input.permissions) !== null && _b !== void 0 ? _b : null,
        }, transaction);
        return { farmName: farm.name, invitationId: invitation.id };
    }));
    // Delivery failure preserves the invitation so the owner can resend it.
    try {
        yield deliverInvitation(input.email, result.farmName, token);
    }
    catch (_a) {
        throw new httpError_1.HttpError("SERVICE_UNAVAILABLE");
    }
    return { id: result.invitationId };
});
exports.inviteMember = inviteMember;
const cancelInvitation = (actorId, farmId, invitationId) => __awaiter(void 0, void 0, void 0, function* () {
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, access_service_1.ownerAccess)(actorId, farmId, transaction);
        const invitation = yield models_1.FarmInvitation.findOne({
            where: { id: invitationId, farmId, status: "Pending" },
            transaction,
        });
        if (!invitation)
            throw new httpError_1.HttpError("NOT_FOUND");
        yield invitation.update({ status: "Revoked" }, { transaction });
        yield (0, access_service_1.audit)(farmId, actorId, "team.invitation-revoked", "invitation", invitation.id, null, null, transaction);
    }));
});
exports.cancelInvitation = cancelInvitation;
const previewInvitation = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const invitation = yield models_1.FarmInvitation.findOne({
        where: {
            tokenHash: (0, authToken_1.hashToken)(token),
            status: "Pending",
            expiresAt: { [sequelize_1.Op.gt]: new Date() },
        },
    });
    const farm = invitation ? yield models_1.Farm.findByPk(invitation.farmId) : null;
    if (!invitation || !farm)
        throw new httpError_1.HttpError("INVITATION_INVALID");
    return {
        email: invitation.email,
        farmName: farm.name,
        role: invitation.role,
    };
});
exports.previewInvitation = previewInvitation;
const acceptInvitation = (user, token) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const lookup = yield models_1.FarmInvitation.findOne({
            where: { tokenHash: (0, authToken_1.hashToken)(token) },
            transaction,
        });
        if (!lookup)
            throw new httpError_1.HttpError("INVITATION_INVALID");
        const farm = yield models_1.Farm.findByPk(lookup.farmId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        const invitation = yield models_1.FarmInvitation.findOne({
            where: {
                id: lookup.id,
                status: "Pending",
                expiresAt: { [sequelize_1.Op.gt]: new Date() },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!farm || !invitation)
            throw new httpError_1.HttpError("INVITATION_INVALID");
        if (!user.isEmailVerified || user.email !== invitation.email)
            throw new httpError_1.HttpError("INVITATION_ACCOUNT");
        const existing = yield models_1.FarmMember.findOne({
            where: { farmId: farm.id, userId: user.id },
            transaction,
        });
        if (!existing)
            yield models_1.FarmMember.create({
                farmId: farm.id,
                userId: user.id,
                role: invitation.role,
                permissions: invitation.permissions,
            }, { transaction });
        yield invitation.update({ status: "Accepted", acceptedBy: user.id }, { transaction });
        yield (0, access_service_1.audit)(farm.id, user.id, "team.accepted", "invitation", invitation.id, null, { userId: user.id }, transaction);
        return { farmId: farm.id };
    }));
});
exports.acceptInvitation = acceptInvitation;
const updateMember = (actorId, farmId, memberId, input) => __awaiter(void 0, void 0, void 0, function* () {
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { farm } = yield (0, access_service_1.ownerAccess)(actorId, farmId, transaction);
        const member = yield models_1.FarmMember.findOne({
            where: { id: memberId, farmId },
            transaction,
        });
        if (!member)
            throw new httpError_1.HttpError("NOT_FOUND");
        if (member.userId === farm.ownerId)
            throw new httpError_1.HttpError("PERMISSION_DENIED");
        const before = { role: member.role, permissions: member.permissions };
        yield member.update({ role: input.role, permissions: (_a = input.permissions) !== null && _a !== void 0 ? _a : null }, { transaction });
        yield (0, access_service_1.audit)(farmId, actorId, "team.permissions-updated", "member", member.id, before, input, transaction);
    }));
});
exports.updateMember = updateMember;
const removeMember = (actorId, farmId, memberId) => __awaiter(void 0, void 0, void 0, function* () {
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const { farm } = yield (0, access_service_1.ownerAccess)(actorId, farmId, transaction);
        const member = yield models_1.FarmMember.findOne({
            where: { id: memberId, farmId },
            transaction,
        });
        if (!member)
            throw new httpError_1.HttpError("NOT_FOUND");
        if (member.userId === farm.ownerId)
            throw new httpError_1.HttpError("PERMISSION_DENIED");
        yield models_1.FarmTask.update({ assigneeId: null }, {
            where: { farmId, assigneeId: member.userId, done: false },
            transaction,
        });
        yield member.destroy({ transaction });
        yield (0, access_service_1.audit)(farmId, actorId, "team.removed", "member", member.id, { userId: member.userId }, null, transaction);
    }));
});
exports.removeMember = removeMember;
