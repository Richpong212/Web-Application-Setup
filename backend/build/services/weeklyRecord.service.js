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
exports.getWeeklyRecords = exports.calculateWeek = exports.arrivalWeek = void 0;
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const access_service_1 = require("./access.service");
const record_service_1 = require("./record.service");
const httpError_1 = require("../utils/httpError");
const dayMilliseconds = 86400000;
const dayNumber = (date) => Date.parse(`${date}T00:00:00Z`) / dayMilliseconds;
const dateAt = (day) => new Date(day * dayMilliseconds).toISOString().slice(0, 10);
// Farm weeks start on arrival, independently of calendar weeks and bird age.
const arrivalWeek = (arrival, date) => Math.floor((dayNumber(date) - dayNumber(arrival)) / 7) + 1;
exports.arrivalWeek = arrivalWeek;
const calculateWeek = (flock, records, week, asOf) => {
    const start = dayNumber(flock.dateReceived) + (week - 1) * 7;
    const from = dateAt(start);
    const to = dateAt(start + 6);
    const history = records.filter((record) => record.flockId === flock.id && record.date <= asOf);
    const before = history
        .filter((record) => record.date < from)
        .reduce((sum, record) => sum + record.mortality, 0);
    let cumulativeMortality = before;
    let grams = 0;
    let eggs = 0;
    let mortality = 0;
    let recordedDays = 0;
    let recordedBirdDays = 0;
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = dateAt(start + index);
        const record = history.find((item) => item.date === date);
        if (record) {
            cumulativeMortality += record.mortality;
            mortality += record.mortality;
            grams += Math.round(Number(record.feedKg) * 1000);
            eggs += record.eggs;
            recordedDays += 1;
            recordedBirdDays += flock.initialBirds - cumulativeMortality;
        }
        return {
            date,
            future: date > asOf,
            // Missing entries are not zero-activity days. Bird count is based on recorded mortality.
            birds: date <= asOf ? flock.initialBirds - cumulativeMortality : null,
            record: record || null,
        };
    });
    const openingBirds = flock.initialBirds - before;
    return {
        flockId: flock.id,
        flockName: flock.name,
        house: flock.house,
        week,
        from,
        to,
        asOf,
        ageAtStartDays: flock.ageAtArrivalDays + (week - 1) * 7,
        openingBirds,
        closingBirds: flock.initialBirds - cumulativeMortality,
        mortality,
        mortalityRate: openingBirds ? (mortality / openingBirds) * 100 : 0,
        cumulativeMortality,
        cumulativeMortalityRate: flock.initialBirds
            ? (cumulativeMortality / flock.initialBirds) * 100
            : 0,
        feedKg: grams / 1000,
        eggs,
        recordedDays,
        eggRate: recordedBirdDays ? (eggs / recordedBirdDays) * 100 : 0,
        days,
    };
};
exports.calculateWeek = calculateWeek;
const getWeeklyRecords = (userId, farmId, flockId, week) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, access_service_1.farmAccess)(userId, farmId, "records.read", transaction);
        const flock = yield models_1.Flock.findOne({
            where: { id: flockId, farmId },
            transaction,
        });
        if (!flock)
            throw new httpError_1.HttpError("NOT_FOUND");
        const asOf = new Date().toISOString().slice(0, 10);
        const currentWeek = Math.max(1, (0, exports.arrivalWeek)(flock.dateReceived, asOf));
        if (week && week > currentWeek)
            throw new httpError_1.HttpError("VALIDATION_ERROR", [
                { field: "week", message: "Choose a week since the flock arrived." },
            ]);
        const records = yield models_1.DailyRecord.findAll({
            where: { farmId, flockId },
            transaction,
        });
        return Object.assign(Object.assign({}, (0, exports.calculateWeek)(flock, records.map(record_service_1.publicRecord), week || currentWeek, asOf)), { currentWeek });
    }));
});
exports.getWeeklyRecords = getWeeklyRecords;
