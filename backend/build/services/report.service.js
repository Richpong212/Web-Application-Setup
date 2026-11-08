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
exports.reportCsv = exports.getReport = exports.calculateReport = void 0;
const weeklyRecord_service_1 = require("./weeklyRecord.service");
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const access_service_1 = require("./access.service");
const record_service_1 = require("./record.service");
const httpError_1 = require("../utils/httpError");
// Pure calculations are shared by reports and dashboard tests. Amounts are added
// in grams to keep three-decimal feed values stable across report totals.
const calculateReport = (flocks, records, from, to) => {
    const eligible = flocks.filter((flock) => flock.dateReceived <= to);
    const ids = new Set(eligible.map((flock) => flock.id));
    const all = records.filter((record) => ids.has(record.flockId) && record.date <= to);
    const period = all
        .filter((record) => record.date >= from)
        .sort((a, b) => a.date.localeCompare(b.date));
    const initialBirds = eligible.reduce((sum, flock) => sum + flock.initialBirds, 0);
    const mortalityAll = all.reduce((sum, record) => sum + record.mortality, 0);
    const byDay = [];
    let birdDays = 0;
    const start = new Date(`${from}T00:00:00Z`).getTime();
    const end = new Date(`${to}T00:00:00Z`).getTime();
    for (let time = start; time <= end; time += 86400000) {
        const date = new Date(time).toISOString().slice(0, 10);
        const present = eligible.filter((flock) => flock.dateReceived <= date);
        const presentIds = new Set(present.map((flock) => flock.id));
        const birds = present.reduce((sum, flock) => sum + flock.initialBirds, 0) -
            all
                .filter((record) => presentIds.has(record.flockId) && record.date <= date)
                .reduce((sum, record) => sum + record.mortality, 0);
        const rows = period.filter((record) => record.date === date);
        const eggs = rows.reduce((sum, record) => sum + record.eggs, 0);
        birdDays += birds;
        byDay.push({
            date,
            eggs,
            feed: rows.reduce((sum, record) => sum + Math.round(Number(record.feedKg) * 1000), 0) / 1000,
            mort: rows.reduce((sum, record) => sum + record.mortality, 0),
            rate: birds > 0 ? (eggs / birds) * 100 : 0,
        });
    }
    const feedKg = period.reduce((sum, record) => sum + Math.round(Number(record.feedKg) * 1000), 0) / 1000;
    const eggs = period.reduce((sum, record) => sum + record.eggs, 0);
    const currentBirds = initialBirds - mortalityAll;
    const activeBirds = eligible
        .filter((flock) => flock.status === "Active")
        .reduce((sum, flock) => sum +
        flock.initialBirds -
        all
            .filter((record) => record.flockId === flock.id)
            .reduce((deaths, record) => deaths + record.mortality, 0), 0);
    return {
        initialBirds,
        currentBirds,
        activeBirds,
        mortalityAll,
        mortality: period.reduce((sum, record) => sum + record.mortality, 0),
        feedKg,
        eggs,
        averageFeedKg: byDay.length ? feedKg / byDay.length : 0,
        eggRate: birdDays ? (eggs / birdDays) * 100 : 0,
        survivalRate: initialBirds ? (currentBirds / initialBirds) * 100 : 0,
        byDay,
        records: period,
    };
};
exports.calculateReport = calculateReport;
const getReport = (userId_1, farmId_1, from_1, to_1, flockId_1, ...args_1) => __awaiter(void 0, [userId_1, farmId_1, from_1, to_1, flockId_1, ...args_1], void 0, function* (userId, farmId, from, to, flockId, dashboard = false) {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, access_service_1.farmAccess)(userId, farmId, dashboard ? "dashboard.read" : "reports.read", transaction);
        const flocks = yield models_1.Flock.findAll({
            where: Object.assign({ farmId }, (flockId ? { id: flockId } : {})),
            transaction,
        });
        if (flockId && !flocks.length)
            throw new httpError_1.HttpError("NOT_FOUND");
        const records = yield models_1.DailyRecord.findAll({
            where: Object.assign({ farmId }, (flockId ? { flockId } : {})),
            transaction,
        });
        const report = (0, exports.calculateReport)(flocks, records.map(record_service_1.publicRecord), from, to);
        return Object.assign(Object.assign(Object.assign({}, report), (dashboard
            ? {
                flockWeeks: flocks
                    .filter((flock) => flock.dateReceived <= to && flock.status === "Active")
                    .map((flock) => {
                    const _a = (0, weeklyRecord_service_1.calculateWeek)(flock, records.map(record_service_1.publicRecord), Math.max(1, (0, weeklyRecord_service_1.arrivalWeek)(flock.dateReceived, to)), to), { days } = _a, summary = __rest(_a, ["days"]);
                    void days;
                    return summary;
                }),
            }
            : {})), { activeFlockCount: flocks.filter((flock) => flock.status === "Active")
                .length, flocks: flocks.map((flock) => ({ id: flock.id, name: flock.name })) });
    }));
});
exports.getReport = getReport;
const reportCsv = (report) => {
    const cell = (value) => {
        const text = String(value !== null && value !== void 0 ? value : "");
        const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
        return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = report.records.map((record) => {
        var _a;
        return [
            record.date,
            ((_a = report.flocks.find((flock) => flock.id === record.flockId)) === null || _a === void 0 ? void 0 : _a.name) || "",
            record.mortality,
            record.cause,
            record.feedKg,
            record.eggs,
            record.medication,
            record.activity,
            record.notes,
            record.recordedBy,
        ]
            .map(cell)
            .join(",");
    });
    return [
        [
            "Date",
            "Flock",
            "Mortality",
            "Cause",
            "Feed (kg)",
            "Eggs",
            "Medication",
            "Activity",
            "Notes",
            "Recorded by",
        ].join(","),
        ...rows,
    ].join("\r\n");
};
exports.reportCsv = reportCsv;
