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
exports.addHouse = exports.deleteFarm = exports.updateFarm = exports.getFarm = exports.listFarms = exports.createFarm = exports.publicFarm = void 0;
const permissions_1 = require("../config/permissions");
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const httpError_1 = require("../utils/httpError");
// Public responses omit ownership IDs and membership records.
const publicFarm = (farm) => {
    var _a, _b, _c, _d, _e, _f;
    return ({
        id: farm.id,
        name: farm.name,
        country: farm.country,
        location: farm.location,
        type: farm.type,
        description: farm.description,
        houses: farm.houses,
        role: ((_b = (_a = farm.memberships) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.role) || "Owner",
        permissions: !farm.memberships || ((_c = farm.memberships[0]) === null || _c === void 0 ? void 0 : _c.userId) === farm.ownerId
            ? [...permissions_1.permissionNames]
            : (0, permissions_1.resolvePermissions)(((_d = farm.memberships[0]) === null || _d === void 0 ? void 0 : _d.role) || "Worker", (_f = (_e = farm.memberships[0]) === null || _e === void 0 ? void 0 : _e.permissions) !== null && _f !== void 0 ? _f : null),
        createdAt: farm.createdAt,
        updatedAt: farm.updatedAt,
    });
};
exports.publicFarm = publicFarm;
const membership = (userId) => ({
    model: models_1.FarmMember,
    as: "memberships",
    where: { userId },
    attributes: ["role", "permissions", "userId"],
    required: true,
});
const createFarm = (userId, input) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const farm = yield models_1.Farm.create(Object.assign(Object.assign({}, input), { ownerId: userId }), { transaction });
        yield models_1.FarmMember.create({ farmId: farm.id, userId, role: "Owner" }, { transaction });
        return (0, exports.publicFarm)(farm);
    }));
});
exports.createFarm = createFarm;
const listFarms = (userId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield models_1.Farm.findAndCountAll({
        include: [membership(userId)],
        distinct: true,
        order: [
            ["createdAt", "DESC"],
            ["id", "DESC"],
        ],
        offset: (page - 1) * limit,
        limit,
    });
    return {
        data: result.rows.map(exports.publicFarm),
        pagination: {
            page,
            limit,
            total: result.count,
            pages: Math.ceil(result.count / limit),
        },
    };
});
exports.listFarms = listFarms;
const getFarm = (userId, farmId) => __awaiter(void 0, void 0, void 0, function* () {
    const farm = yield models_1.Farm.findOne({
        where: { id: farmId },
        include: [membership(userId)],
    });
    if (!farm)
        throw new httpError_1.HttpError("NOT_FOUND");
    return (0, exports.publicFarm)(farm);
});
exports.getFarm = getFarm;
const ownedFarm = (userId, farmId, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    // Use both ownership and membership in the write query. An inaccessible farm
    // returns the same response as a missing one, without revealing its existence.
    const farm = yield models_1.Farm.findOne({
        where: { id: farmId, ownerId: userId },
        include: [membership(userId)],
        transaction,
        lock: { level: transaction.LOCK.UPDATE, of: models_1.Farm },
    });
    if (!farm)
        throw new httpError_1.HttpError("NOT_FOUND");
    return farm;
});
const updateFarm = (userId, farmId, input) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const farm = yield ownedFarm(userId, farmId, transaction);
        yield farm.update(input, { transaction });
        return (0, exports.publicFarm)(farm);
    }));
});
exports.updateFarm = updateFarm;
const deleteFarm = (userId, farmId) => __awaiter(void 0, void 0, void 0, function* () {
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const farm = yield ownedFarm(userId, farmId, transaction);
        yield farm.destroy({ transaction });
    }));
});
exports.deleteFarm = deleteFarm;
// Append under the farm lock so concurrent additions cannot replace each other.
const addHouse = (userId, farmId, name) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const farm = yield ownedFarm(userId, farmId, transaction);
        const existing = farm.houses.find((house) => house.toLowerCase() === name.toLowerCase());
        if (existing)
            return { farm: (0, exports.publicFarm)(farm), house: existing };
        if (farm.houses.length >= 50)
            throw new httpError_1.HttpError("VALIDATION_ERROR", [
                { field: "name", message: "A farm can have up to 50 houses." },
            ]);
        yield farm.update({ houses: [...farm.houses, name] }, { transaction });
        return { farm: (0, exports.publicFarm)(farm), house: name };
    }));
});
exports.addHouse = addHouse;
