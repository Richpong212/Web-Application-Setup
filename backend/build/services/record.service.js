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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.correctRecord = exports.createRecord = exports.publicRecord = void 0;
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const access_service_1 = require("./access.service");
const httpError_1 = require("../utils/httpError");
const publicRecord = (record) => {
    const _a = record.get({ plain: true }), { createdBy } = _a, data = __rest(_a, ["createdBy"]);
    void createdBy;
    return Object.assign(Object.assign({}, data), { feedKg: Number(record.feedKg) });
};
exports.publicRecord = publicRecord;
const createRecord = (user, farmId, input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, access_service_1.farmAccess)(user.id, farmId, "records.write", transaction);
            const flock = yield models_1.Flock.findOne({
                where: { id: input.flockId, farmId },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!flock)
                throw new httpError_1.HttpError("NOT_FOUND");
            if (flock.status !== "Active" || input.date < flock.dateReceived)
                throw new httpError_1.HttpError("VALIDATION_ERROR", [
                    {
                        field: "date",
                        message: "Choose a valid date for an active flock.",
                    },
                ]);
            const total = Number(yield models_1.DailyRecord.sum("mortality", {
                where: { flockId: flock.id, farmId },
                transaction,
            })) || 0;
            if (total + input.mortality > flock.initialBirds)
                throw new httpError_1.HttpError("VALIDATION_ERROR", [
                    {
                        field: "mortality",
                        message: "Mortality exceeds the flock's remaining birds.",
                    },
                ]);
            const record = yield models_1.DailyRecord.create(Object.assign(Object.assign({}, input), { farmId, recordedBy: user.name, createdBy: user.id }), { transaction });
            yield (0, access_service_1.audit)(farmId, user.id, "record.created", "dailyRecord", record.id, null, (0, exports.publicRecord)(record), transaction);
            return (0, exports.publicRecord)(record);
        }));
    }
    catch (error) {
        if (error instanceof sequelize_1.UniqueConstraintError)
            throw new httpError_1.HttpError("CONFLICT");
        throw error;
    }
});
exports.createRecord = createRecord;
const correctRecord = (userId, farmId, recordId, input) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        yield (0, access_service_1.farmAccess)(userId, farmId, "records.correct", transaction);
        const record = yield models_1.DailyRecord.findOne({
            where: { id: recordId, farmId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!record)
            throw new httpError_1.HttpError("NOT_FOUND");
        const flock = yield models_1.Flock.findOne({
            where: { id: record.flockId, farmId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!flock)
            throw new httpError_1.HttpError("NOT_FOUND");
        const otherDeaths = Number(yield models_1.DailyRecord.sum("mortality", {
            where: { farmId, flockId: flock.id, id: { [sequelize_1.Op.ne]: record.id } },
            transaction,
        })) || 0;
        if (otherDeaths + ((_a = input.mortality) !== null && _a !== void 0 ? _a : record.mortality) >
            flock.initialBirds)
            throw new httpError_1.HttpError("VALIDATION_ERROR", [
                {
                    field: "mortality",
                    message: "Mortality exceeds the flock's remaining birds.",
                },
            ]);
        const before = (0, exports.publicRecord)(record);
        const { reason } = input, values = __rest(input, ["reason"]);
        yield record.update(values, { transaction });
        yield (0, access_service_1.audit)(farmId, userId, "record.corrected", "dailyRecord", record.id, before, (0, exports.publicRecord)(record), transaction, reason);
        return (0, exports.publicRecord)(record);
    }));
});
exports.correctRecord = correctRecord;
