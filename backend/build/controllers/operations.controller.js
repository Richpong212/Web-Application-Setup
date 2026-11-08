"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.weeklyRecords = exports.dashboard = exports.exportReport = exports.report = exports.auditLog = exports.deleteTask = exports.updateTask = exports.createTask = exports.completeVaccination = exports.vaccineSchedule = exports.feedSchedule = exports.correctRecord = exports.createRecord = exports.updateFlock = exports.createFlock = exports.workspace = void 0;
const weeklyRecord_service_1 = require("../services/weeklyRecord.service");
const express_validator_1 = require("express-validator");
const workspaceService = __importStar(require("../services/workspace.service"));
const flockService = __importStar(require("../services/flock.service"));
const recordService = __importStar(require("../services/record.service"));
const scheduleService = __importStar(require("../services/schedule.service"));
const taskService = __importStar(require("../services/task.service"));
const reportService = __importStar(require("../services/report.service"));
const workspace = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        res.json({
            data: yield workspaceService.getWorkspace(res.locals.user.id, farmId),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.workspace = workspace;
const createFlock = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        res.status(201).json({
            data: yield flockService.createFlock(res.locals.user.id, farmId, input),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.createFlock = createFlock;
const updateFlock = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId, id } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        res.json({
            data: yield flockService.updateFlock(res.locals.user.id, farmId, id, input),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.updateFlock = updateFlock;
const createRecord = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        res.status(201).json({
            data: yield recordService.createRecord(res.locals.user, farmId, input),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.createRecord = createRecord;
const correctRecord = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId, id } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        res.json({
            data: yield recordService.correctRecord(res.locals.user.id, farmId, id, input),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.correctRecord = correctRecord;
const feedSchedule = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        yield scheduleService.replaceFeedSchedule(res.locals.user.id, farmId, input.stages);
        res.json({ message: "Feeding schedule saved" });
    }
    catch (error) {
        return next(error);
    }
});
exports.feedSchedule = feedSchedule;
const vaccineSchedule = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        yield scheduleService.replaceVaccinationSchedule(res.locals.user.id, farmId, input.entries);
        res.json({ message: "Vaccination schedule saved" });
    }
    catch (error) {
        return next(error);
    }
});
exports.vaccineSchedule = vaccineSchedule;
const completeVaccination = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        yield scheduleService.completeVaccination(res.locals.user, farmId, input);
        res.status(201).json({ message: "Vaccination recorded" });
    }
    catch (error) {
        return next(error);
    }
});
exports.completeVaccination = completeVaccination;
const createTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        res.status(201).json({
            data: yield taskService.createTask(res.locals.user.id, farmId, input),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.createTask = createTask;
const updateTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId, id } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        res.json({
            data: yield taskService.updateTask(res.locals.user.id, farmId, id, input),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.updateTask = updateTask;
const deleteTask = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId, id } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        yield taskService.deleteTask(res.locals.user.id, farmId, id);
        res.status(204).end();
    }
    catch (error) {
        return next(error);
    }
});
exports.deleteTask = deleteTask;
const auditLog = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        res.json({
            data: yield workspaceService.listAudit(res.locals.user.id, farmId),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.auditLog = auditLog;
const report = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const { from, to, flockId } = (0, express_validator_1.matchedData)(req, { locations: ["query"] });
        res.json({
            data: yield reportService.getReport(res.locals.user.id, farmId, from, to, flockId),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.report = report;
const exportReport = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const { from, to, flockId } = (0, express_validator_1.matchedData)(req, { locations: ["query"] });
        const report = yield reportService.getReport(res.locals.user.id, farmId, from, to, flockId);
        res.setHeader("Content-Disposition", `attachment; filename="farm-report-${from}-to-${to}.csv"`);
        res.type("text/csv").send(reportService.reportCsv(report));
    }
    catch (error) {
        return next(error);
    }
});
exports.exportReport = exportReport;
const dashboard = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const to = new Date().toISOString().slice(0, 10);
        const from = new Date(Date.now() - 29 * 86400000)
            .toISOString()
            .slice(0, 10);
        const _a = yield reportService.getReport(res.locals.user.id, farmId, from, to, undefined, true), { records, flocks } = _a, summary = __rest(_a, ["records", "flocks"]);
        void records;
        void flocks;
        const today = summary.byDay.find((row) => row.date === to);
        res.json({
            data: Object.assign(Object.assign({}, summary), { eggsToday: (today === null || today === void 0 ? void 0 : today.eggs) || 0, feedToday: (today === null || today === void 0 ? void 0 : today.feed) || 0 }),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.dashboard = dashboard;
const weeklyRecords = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const { flockId, week } = (0, express_validator_1.matchedData)(req, { locations: ["query"] });
        res.json({
            data: yield (0, weeklyRecord_service_1.getWeeklyRecords)(res.locals.user.id, farmId, flockId, week),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.weeklyRecords = weeklyRecords;
