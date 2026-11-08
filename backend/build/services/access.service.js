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
exports.audit = exports.ownerAccess = exports.farmAccess = void 0;
const models_1 = require("../models");
const permissions_1 = require("../config/permissions");
const httpError_1 = require("../utils/httpError");
const farmAccess = (userId, farmId, permission, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    // All farm writes lock the farm first, including membership changes. Permission
    // checks and the operation therefore cannot race an owner revoking access.
    const farm = yield models_1.Farm.findByPk(farmId, Object.assign({ transaction }, (transaction ? { lock: transaction.LOCK.UPDATE } : {})));
    const member = yield models_1.FarmMember.findOne({
        where: { farmId, userId },
        transaction,
    });
    if (!farm || !member)
        throw new httpError_1.HttpError("NOT_FOUND");
    const isOwner = farm.ownerId === userId;
    const permissions = isOwner
        ? [...permissions_1.permissionNames]
        : (0, permissions_1.resolvePermissions)(member.role, member.permissions);
    if (permission && !permissions.includes(permission))
        throw new httpError_1.HttpError("PERMISSION_DENIED");
    return { farm, member, isOwner, permissions };
});
exports.farmAccess = farmAccess;
const ownerAccess = (userId, farmId, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const access = yield (0, exports.farmAccess)(userId, farmId, undefined, transaction);
    if (!access.isOwner)
        throw new httpError_1.HttpError("PERMISSION_DENIED");
    return access;
});
exports.ownerAccess = ownerAccess;
const audit = (farmId_1, actorId_1, action_1, entityType_1, entityId_1, before_1, after_1, transaction_1, ...args_1) => __awaiter(void 0, [farmId_1, actorId_1, action_1, entityType_1, entityId_1, before_1, after_1, transaction_1, ...args_1], void 0, function* (farmId, actorId, action, entityType, entityId, before, after, transaction, reason = "") {
    yield models_1.AuditLog.create({ farmId, actorId, action, entityType, entityId, before, after, reason }, { transaction });
});
exports.audit = audit;
