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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationRouter = exports.teamRouter = void 0;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const controller = __importStar(require("../controllers/team.controller"));
const validation = __importStar(require("../validations/operations.validation"));
const index_validation_1 = require("../validations/index.validation");
const errorResponse_1 = require("../utils/errorResponse");
exports.teamRouter = (0, express_1.Router)({ mergeParams: true });
exports.teamRouter.use(auth_middleware_1.authenticate, validation.farmReference, index_validation_1.validate);
exports.teamRouter.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
exports.teamRouter.get("/", controller.listTeam);
exports.teamRouter.post("/invitations", validation.inviteValidation, index_validation_1.validate, controller.inviteMember);
exports.teamRouter.delete("/invitations/:id", validation.resourceReference, index_validation_1.validate, controller.cancelInvitation);
exports.teamRouter.patch("/members/:id", validation.resourceReference, validation.memberValidation, index_validation_1.validate, controller.updateMember);
exports.teamRouter.delete("/members/:id", validation.resourceReference, index_validation_1.validate, controller.removeMember);
exports.invitationRouter = (0, express_1.Router)();
exports.invitationRouter.use((0, express_rate_limit_1.default)({
    windowMs: 900000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => (0, errorResponse_1.sendError)(res, "RATE_LIMITED"),
}));
exports.invitationRouter.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
exports.invitationRouter.get("/preview", validation.invitationPreviewValidation, index_validation_1.validate, controller.previewInvitation);
exports.invitationRouter.post("/accept", auth_middleware_1.authenticate, validation.invitationAcceptValidation, index_validation_1.validate, controller.acceptInvitation);
