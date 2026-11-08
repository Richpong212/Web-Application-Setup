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
exports.deleteTask = exports.updateTask = exports.createTask = void 0;
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const access_service_1 = require("./access.service");
const httpError_1 = require("../utils/httpError");
const createTask = (userId, farmId, input) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, access_service_1.farmAccess)(userId, farmId, "tasks.write", transaction);
        if (input.assigneeId &&
            !(yield models_1.FarmMember.findOne({
                where: { farmId, userId: input.assigneeId },
                transaction,
            })))
            throw new httpError_1.HttpError("NOT_FOUND");
        const task = yield models_1.FarmTask.create(Object.assign(Object.assign({}, input), { farmId }), { transaction });
        yield (0, access_service_1.audit)(farmId, userId, "task.created", "task", task.id, null, input, transaction);
        return task;
    }));
});
exports.createTask = createTask;
const updateTask = (userId, farmId, taskId, input) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const access = yield (0, access_service_1.farmAccess)(userId, farmId, undefined, transaction);
        const task = yield models_1.FarmTask.findOne({
            where: { id: taskId, farmId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!task)
            throw new httpError_1.HttpError("NOT_FOUND");
        const manages = access.permissions.includes("tasks.write");
        if (Object.keys(input).some((key) => key !== "done") && !manages)
            throw new httpError_1.HttpError("PERMISSION_DENIED");
        if (input.done !== undefined &&
            (!access.permissions.includes("tasks.complete") ||
                (!manages && (task.assigneeId !== userId || !input.done))))
            throw new httpError_1.HttpError("PERMISSION_DENIED");
        if (input.assigneeId &&
            !(yield models_1.FarmMember.findOne({
                where: { farmId, userId: input.assigneeId },
                transaction,
            })))
            throw new httpError_1.HttpError("NOT_FOUND");
        const before = task.get({ plain: true });
        yield task.update(Object.assign(Object.assign({}, input), (input.done === undefined
            ? {}
            : {
                completedAt: input.done ? new Date() : null,
                completedBy: input.done ? userId : null,
            })), { transaction });
        yield (0, access_service_1.audit)(farmId, userId, "task.updated", "task", task.id, before, task.get({ plain: true }), transaction);
        return task;
    }));
});
exports.updateTask = updateTask;
const deleteTask = (userId, farmId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, access_service_1.farmAccess)(userId, farmId, "tasks.write", transaction);
        const task = yield models_1.FarmTask.findOne({
            where: { id: taskId, farmId },
            transaction,
        });
        if (!task)
            throw new httpError_1.HttpError("NOT_FOUND");
        yield (0, access_service_1.audit)(farmId, userId, "task.deleted", "task", task.id, task.get({ plain: true }), null, transaction);
        yield task.destroy({ transaction });
    }));
});
exports.deleteTask = deleteTask;
