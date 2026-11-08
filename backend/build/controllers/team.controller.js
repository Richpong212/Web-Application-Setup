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
exports.acceptInvitation = exports.previewInvitation = exports.cancelInvitation = exports.removeMember = exports.updateMember = exports.inviteMember = exports.listTeam = void 0;
const express_validator_1 = require("express-validator");
const teamService = __importStar(require("../services/team.service"));
const listTeam = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        res.json({ data: yield teamService.listTeam(res.locals.user.id, farmId) });
    }
    catch (error) {
        return next(error);
    }
});
exports.listTeam = listTeam;
const inviteMember = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        res.status(201).json({
            message: "Invitation sent",
            data: yield teamService.inviteMember(res.locals.user.id, farmId, input),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.inviteMember = inviteMember;
const updateMember = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId, id } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        yield teamService.updateMember(res.locals.user.id, farmId, id, input);
        res.json({ message: "Member permissions updated" });
    }
    catch (error) {
        return next(error);
    }
});
exports.updateMember = updateMember;
const removeMember = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId, id } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        yield teamService.removeMember(res.locals.user.id, farmId, id);
        res.status(204).end();
    }
    catch (error) {
        return next(error);
    }
});
exports.removeMember = removeMember;
const cancelInvitation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { farmId, id } = (0, express_validator_1.matchedData)(req, { locations: ["params"] });
        yield teamService.cancelInvitation(res.locals.user.id, farmId, id);
        res.status(204).end();
    }
    catch (error) {
        return next(error);
    }
});
exports.cancelInvitation = cancelInvitation;
const previewInvitation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json({
            data: yield teamService.previewInvitation(String((0, express_validator_1.matchedData)(req, { locations: ["query"] }).token)),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.previewInvitation = previewInvitation;
const acceptInvitation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const input = (0, express_validator_1.matchedData)(req, { locations: ["body"] });
        delete input[""];
        res.json({
            message: "Invitation accepted",
            data: yield teamService.acceptInvitation(res.locals.user, input.token),
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.acceptInvitation = acceptInvitation;
