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
exports.completeVaccination = exports.replaceVaccinationSchedule = exports.replaceFeedSchedule = void 0;
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const access_service_1 = require("./access.service");
const httpError_1 = require("../utils/httpError");
const replaceFeedSchedule = (userId, farmId, stages) => __awaiter(void 0, void 0, void 0, function* () {
    const sorted = [...stages].sort((a, b) => a.fromWeek - b.fromWeek);
    if (sorted.some((stage, index) => stage.toWeek < stage.fromWeek ||
        (index > 0 && stage.fromWeek <= sorted[index - 1].toWeek)))
        throw new httpError_1.HttpError("VALIDATION_ERROR", [
            { field: "stages", message: "Feeding stages must not overlap." },
        ]);
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, access_service_1.farmAccess)(userId, farmId, "feed.write", transaction);
        const before = yield models_1.FeedStage.findAll({
            where: { farmId },
            transaction,
            raw: true,
        });
        yield models_1.FeedStage.destroy({ where: { farmId }, transaction });
        yield models_1.FeedStage.bulkCreate(stages.map((stage) => (Object.assign(Object.assign({}, stage), { farmId }))), { transaction });
        yield (0, access_service_1.audit)(farmId, userId, "feed.schedule-updated", "farm", farmId, before, stages, transaction);
    }));
});
exports.replaceFeedSchedule = replaceFeedSchedule;
const replaceVaccinationSchedule = (userId, farmId, entries) => __awaiter(void 0, void 0, void 0, function* () {
    if (new Set(entries.map((entry) => `${entry.day}:${entry.name.toLowerCase()}`))
        .size !== entries.length)
        throw new httpError_1.HttpError("VALIDATION_ERROR", [
            { field: "entries", message: "Vaccination entries must be unique." },
        ]);
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, access_service_1.farmAccess)(userId, farmId, "health.write", transaction);
        const before = yield models_1.VaccinationSchedule.findAll({
            where: { farmId },
            transaction,
        });
        const previous = before.map((row) => row.get({ plain: true }));
        const retained = [];
        for (const entry of entries) {
            const existing = entry.id
                ? before.find((item) => item.id === entry.id)
                : undefined;
            if (entry.id && !existing)
                throw new httpError_1.HttpError("NOT_FOUND");
            const row = existing
                ? yield existing.update({ day: entry.day, name: entry.name }, { transaction })
                : yield models_1.VaccinationSchedule.create({ farmId, day: entry.day, name: entry.name }, { transaction });
            retained.push(row.id);
        }
        // Completed vaccination records preserve their copied vaccine/day information.
        yield models_1.VaccinationSchedule.destroy({
            where: Object.assign({ farmId }, (retained.length ? { id: { [sequelize_1.Op.notIn]: retained } } : {})),
            transaction,
        });
        yield (0, access_service_1.audit)(farmId, userId, "health.schedule-updated", "farm", farmId, previous, entries, transaction);
    }));
});
exports.replaceVaccinationSchedule = replaceVaccinationSchedule;
const completeVaccination = (user, farmId, input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, access_service_1.farmAccess)(user.id, farmId, "health.complete", transaction);
            const flock = yield models_1.Flock.findOne({
                where: { id: input.flockId, farmId, status: "Active" },
                transaction,
            });
            const schedule = yield models_1.VaccinationSchedule.findOne({
                where: { id: input.scheduleId, farmId },
                transaction,
            });
            if (!flock || !schedule)
                throw new httpError_1.HttpError("NOT_FOUND");
            if (input.date < flock.dateReceived)
                throw new httpError_1.HttpError("VALIDATION_ERROR", [
                    {
                        field: "date",
                        message: "Choose a date on or after the flock arrived.",
                    },
                ]);
            const record = yield models_1.VaccinationRecord.create(Object.assign(Object.assign({}, input), { farmId, name: schedule.name, day: schedule.day, recordedBy: user.name, createdBy: user.id }), { transaction });
            yield (0, access_service_1.audit)(farmId, user.id, "health.vaccination-completed", "vaccinationRecord", record.id, null, { flockId: flock.id, name: schedule.name, date: input.date }, transaction);
        }));
    }
    catch (error) {
        if (error instanceof sequelize_1.UniqueConstraintError)
            throw new httpError_1.HttpError("CONFLICT");
        throw error;
    }
});
exports.completeVaccination = completeVaccination;
