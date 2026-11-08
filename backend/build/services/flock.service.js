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
exports.updateFlock = exports.createFlock = exports.publicFlock = void 0;
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const access_service_1 = require("./access.service");
const httpError_1 = require("../utils/httpError");
const publicFlock = (flock) => (Object.assign(Object.assign({}, flock.get({ plain: true })), { purchaseCost: Number(flock.purchaseCost) }));
exports.publicFlock = publicFlock;
const createFlock = (actorId, farmId, input) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const { farm } = yield (0, access_service_1.farmAccess)(actorId, farmId, "flocks.write", transaction);
        if (input.house && !farm.houses.includes(input.house))
            throw new httpError_1.HttpError("VALIDATION_ERROR", [
                { field: "house", message: "Choose a house from this farm." },
            ]);
        const flock = yield models_1.Flock.create(Object.assign(Object.assign({}, input), { farmId, status: "Active" }), { transaction });
        yield (0, access_service_1.audit)(farmId, actorId, "flock.created", "flock", flock.id, null, input, transaction);
        return (0, exports.publicFlock)(flock);
    }));
});
exports.createFlock = createFlock;
const updateFlock = (actorId, farmId, flockId, input) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const { farm } = yield (0, access_service_1.farmAccess)(actorId, farmId, "flocks.write", transaction);
        const flock = yield models_1.Flock.findOne({
            where: { id: flockId, farmId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!flock)
            throw new httpError_1.HttpError("NOT_FOUND");
        if (input.house && !farm.houses.includes(input.house))
            throw new httpError_1.HttpError("VALIDATION_ERROR", [
                { field: "house", message: "Choose a house from this farm." },
            ]);
        const mortality = Number(yield models_1.DailyRecord.sum("mortality", {
            where: { farmId, flockId },
            transaction,
        })) || 0;
        if (input.initialBirds !== undefined && input.initialBirds < mortality)
            throw new httpError_1.HttpError("VALIDATION_ERROR", [
                {
                    field: "initialBirds",
                    message: "Bird count cannot be lower than recorded mortality.",
                },
            ]);
        const before = (0, exports.publicFlock)(flock);
        yield flock.update(input, { transaction });
        yield (0, access_service_1.audit)(farmId, actorId, "flock.updated", "flock", flock.id, before, (0, exports.publicFlock)(flock), transaction);
        return (0, exports.publicFlock)(flock);
    }));
});
exports.updateFlock = updateFlock;
