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
exports.listAudit = exports.getWorkspace = void 0;
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const access_service_1 = require("./access.service");
const flock_service_1 = require("./flock.service");
const record_service_1 = require("./record.service");
const getWorkspace = (userId, farmId) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const access = yield (0, access_service_1.farmAccess)(userId, farmId, undefined, transaction);
        const can = (permission) => access.permissions.includes(permission);
        const memberships = can("tasks.read")
            ? yield models_1.FarmMember.findAll({ where: { farmId }, transaction })
            : [];
        const people = memberships.length
            ? yield models_1.User.findAll({
                where: {
                    id: { [sequelize_1.Op.in]: memberships.map((member) => member.userId) },
                },
                attributes: ["id", "name"],
                transaction,
            })
            : [];
        const flocks = can("flocks.read")
            ? yield models_1.Flock.findAll({
                where: { farmId },
                order: [["dateReceived", "DESC"]],
                transaction,
            })
            : [];
        const records = can("records.read")
            ? yield models_1.DailyRecord.findAll({
                where: { farmId },
                order: [["date", "DESC"]],
                transaction,
            })
            : [];
        const feedRows = can("feed.read") || can("flocks.read")
            ? yield models_1.DailyRecord.findAll({
                where: { farmId },
                attributes: ["flockId", "date", "feedKg", "mortality"],
                transaction,
            })
            : [];
        const treatments = can("health.read")
            ? yield models_1.DailyRecord.findAll({
                where: { farmId, medication: { [sequelize_1.Op.ne]: "" } },
                attributes: ["id", "date", "flockId", "medication", "recordedBy"],
                transaction,
            })
            : [];
        const feedSchedule = can("feed.read")
            ? yield models_1.FeedStage.findAll({
                where: { farmId },
                order: [["fromWeek", "ASC"]],
                transaction,
            })
            : [];
        const vaccineSchedule = can("health.read")
            ? yield models_1.VaccinationSchedule.findAll({
                where: { farmId },
                order: [["day", "ASC"]],
                transaction,
            })
            : [];
        const completions = can("health.read")
            ? yield models_1.VaccinationRecord.findAll({
                where: { farmId },
                order: [["date", "DESC"]],
                transaction,
            })
            : [];
        const tasks = can("tasks.read")
            ? yield models_1.FarmTask.findAll({
                where: { farmId },
                order: [["due", "ASC"]],
                transaction,
            })
            : [];
        return {
            permissions: access.permissions,
            isOwner: access.isOwner,
            treatments,
            feedSummary: can("feed.read")
                ? {
                    totalKg: feedRows.reduce((sum, row) => sum + Math.round(Number(row.feedKg) * 1000), 0) / 1000,
                    recordedDays: new Set(feedRows.map((row) => row.date)).size,
                    byFlock: flocks.map((flock) => {
                        var _a;
                        const rows = feedRows
                            .filter((row) => row.flockId === flock.id)
                            .sort((a, b) => b.date.localeCompare(a.date));
                        return {
                            flockId: flock.id,
                            totalKg: rows.reduce((sum, row) => sum + Math.round(Number(row.feedKg) * 1000), 0) / 1000,
                            lastKg: Number(((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.feedKg) || 0),
                        };
                    }),
                }
                : null,
            flocks: flocks.map((flock) => (Object.assign(Object.assign({}, (0, flock_service_1.publicFlock)(flock)), { currentBirds: flock.initialBirds -
                    feedRows
                        .filter((row) => row.flockId === flock.id)
                        .reduce((sum, row) => sum + row.mortality, 0), mortality: feedRows
                    .filter((row) => row.flockId === flock.id)
                    .reduce((sum, row) => sum + row.mortality, 0) }))),
            records: records.map(record_service_1.publicRecord),
            feedSchedule,
            vaccineSchedule,
            completions: completions.map((record) => ({
                id: record.id,
                flockId: record.flockId,
                scheduleId: record.scheduleId,
                day: record.day,
                name: record.name,
                by: record.recordedBy,
                at: record.date,
                notes: record.notes,
            })),
            activities: tasks.map((task) => {
                var _a;
                return ({
                    id: task.id,
                    farmId,
                    title: task.title,
                    due: task.due,
                    done: task.done,
                    assigneeId: task.assigneeId,
                    assignee: ((_a = people.find((person) => person.id === task.assigneeId)) === null || _a === void 0 ? void 0 : _a.name) || "",
                });
            }),
            members: memberships.map((member) => {
                var _a;
                return ({
                    id: member.id,
                    userId: member.userId,
                    name: ((_a = people.find((person) => person.id === member.userId)) === null || _a === void 0 ? void 0 : _a.name) ||
                        "Former member",
                    email: "",
                    role: member.role,
                    permissions: member.permissions,
                    farmIds: [farmId],
                    status: "Active",
                });
            }),
        };
    }));
});
exports.getWorkspace = getWorkspace;
const listAudit = (userId, farmId) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, access_service_1.ownerAccess)(userId, farmId);
    return models_1.AuditLog.findAll({
        where: { farmId },
        limit: 100,
        order: [["createdAt", "DESC"]],
    });
});
exports.listAudit = listAudit;
