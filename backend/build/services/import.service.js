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
exports.importHistory = exports.previewHistory = void 0;
const crypto_1 = require("crypto");
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const access_service_1 = require("./access.service");
const httpError_1 = require("../utils/httpError");
const fields = [
    "mortality",
    "feedKg",
    "eggs",
    "cause",
    "medication",
    "activity",
    "notes",
];
const review = (userId, farmId, input, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, access_service_1.farmAccess)(userId, farmId, "records.import", transaction);
    const flock = yield models_1.Flock.findOne({
        where: { id: input.flockId, farmId },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });
    if (!flock)
        throw new httpError_1.HttpError("NOT_FOUND");
    const existing = yield models_1.DailyRecord.findAll({
        where: {
            farmId,
            flockId: flock.id,
            date: { [sequelize_1.Op.in]: input.rows.map((row) => row.date) },
        },
        transaction,
    });
    const seen = new Set();
    const rows = input.rows.map((row) => {
        let status = "ready";
        let message = "Ready to import";
        const saved = existing.find((record) => record.date === row.date);
        if (row.date < flock.dateReceived) {
            status = "error";
            message = "Date is before this flock arrived.";
        }
        else if (seen.has(row.date)) {
            status = "error";
            message = "This date appears more than once in the workbook.";
        }
        else if (saved) {
            const same = fields.every((field) => typeof row[field] === "number"
                ? Number(saved[field]) === row[field]
                : (saved[field] || "") === row[field]);
            status = same ? "duplicate" : "error";
            message = same
                ? "Already imported; will be skipped."
                : "A different record exists for this date. Existing records will not be overwritten.";
        }
        seen.add(row.date);
        return Object.assign(Object.assign({}, row), { status, message });
    });
    const ready = rows.filter((row) => row.status === "ready");
    const recordedMortality = Number(yield models_1.DailyRecord.sum("mortality", {
        where: { farmId, flockId: flock.id },
        transaction,
    })) || 0;
    if (recordedMortality + ready.reduce((sum, row) => sum + row.mortality, 0) >
        flock.initialBirds) {
        for (const row of ready) {
            row.status = "error";
            row.message =
                "Imported mortality would exceed this flock's initial bird count.";
        }
    }
    return {
        rows,
        ready: rows.filter((row) => row.status === "ready").length,
        duplicates: rows.filter((row) => row.status === "duplicate").length,
        errors: rows.filter((row) => row.status === "error").length,
    };
});
const previewHistory = (userId, farmId, input) => connectDb_1.db.transaction((transaction) => review(userId, farmId, input, transaction));
exports.previewHistory = previewHistory;
const importHistory = (user, farmId, input) => connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
    // Recheck membership, dates and duplicates under the same lock as the write.
    const result = yield review(user.id, farmId, input, transaction);
    if (result.errors)
        throw new httpError_1.HttpError("VALIDATION_ERROR", [
            {
                field: "rows",
                message: "Review the import again and resolve the highlighted records before saving.",
            },
        ]);
    const ready = result.rows.filter((row) => row.status === "ready");
    const records = yield models_1.DailyRecord.bulkCreate(ready.map((_a) => {
        var { source, status, message } = _a, row = __rest(_a, ["source", "status", "message"]);
        void source;
        void status;
        void message;
        return Object.assign(Object.assign({}, row), { farmId, flockId: input.flockId, recordedBy: user.name, createdBy: user.id });
    }), { transaction, validate: true });
    const batchId = (0, crypto_1.randomUUID)();
    if (records.length)
        yield (0, access_service_1.audit)(farmId, user.id, "records.imported", "historyImport", batchId, null, {
            fileName: input.fileName,
            flockId: input.flockId,
            imported: records.length,
            skipped: result.duplicates,
            records: records.map((record, index) => ({
                id: record.id,
                date: record.date,
                source: ready[index].source,
            })),
        }, transaction);
    return { batchId, imported: records.length, skipped: result.duplicates };
}));
exports.importHistory = importHistory;
