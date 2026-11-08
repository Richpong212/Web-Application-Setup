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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHouse = exports.deleteFarm = exports.updateFarm = exports.getFarm = exports.listFarms = exports.createFarm = void 0;
const express_validator_1 = require("express-validator");
const farmService = __importStar(require("../services/farm.service"));
// Ignore whole-body validator metadata; only these fields may reach the model.
const farmInput = (req) => {
    const data = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
    const allowed = [
        "name",
        "country",
        "location",
        "type",
        "description",
        "houses",
    ];
    return Object.fromEntries(Object.entries(data).filter(([key]) => allowed.includes(key)));
};
const createFarm = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const input = farmInput(req);
        const data = yield farmService.createFarm(res.locals.user.id, input);
        res.status(201).json({ message: "Farm created", data });
    }
    catch (error) {
        return next(error);
    }
});
exports.createFarm = createFarm;
const listFarms = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 20 } = (0, express_validator_1.matchedData)(req, { locations: ["query"] });
        res.json(yield farmService.listFarms(res.locals.user.id, page, limit));
    }
    catch (error) {
        return next(error);
    }
});
exports.listFarms = listFarms;
const getFarm = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        res.json({ data: yield farmService.getFarm(res.locals.user.id, farmId) });
    }
    catch (error) {
        return next(error);
    }
});
exports.getFarm = getFarm;
const updateFarm = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = farmInput(req);
        res.json({
            message: "Farm updated",
            data: yield farmService.updateFarm(res.locals.user.id, farmId, input),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.updateFarm = updateFarm;
const deleteFarm = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        yield farmService.deleteFarm(res.locals.user.id, farmId);
        res.status(204).end();
    }
    catch (error) {
        return next(error);
    }
});
exports.deleteFarm = deleteFarm;
const addHouse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const { name } = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        res.json({
            data: yield farmService.addHouse(res.locals.user.id, farmId, name),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.addHouse = addHouse;
