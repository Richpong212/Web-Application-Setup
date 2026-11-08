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
exports.checkAuthOrigin = exports.authenticate = void 0;
const sequelize_1 = require("sequelize");
const index_config_1 = require("../config/index.config");
const models_1 = require("../models");
const authToken_1 = require("../utils/authToken");
const logger_utils_1 = require("../utils/logger.utils");
const httpError_1 = require("../utils/httpError");
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authorization = req.headers.authorization;
    if (!(authorization === null || authorization === void 0 ? void 0 : authorization.startsWith("Bearer "))) {
        throw new httpError_1.HttpError("SIGN_IN_REQUIRED");
    }
    const { userId, sessionId } = (0, authToken_1.readAuthToken)(authorization.slice(7), "access");
    const session = yield models_1.Session.findOne({
        where: {
            id: sessionId,
            userId,
            revokedAt: null,
            expiresAt: { [sequelize_1.Op.gt]: new Date() },
        },
    });
    const user = yield models_1.User.findByPk(userId);
    if (!session || !user || !user.isEmailVerified) {
        throw new httpError_1.HttpError("SESSION_EXPIRED");
    }
    res.locals.user = user;
    next();
});
exports.authenticate = authenticate;
// Cookies are sent automatically by browsers. Reject untrusted browser origins
// on login, refresh and logout, even if CORS would hide their responses.
const checkAuthOrigin = (req, _res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        index_config_1.appConfig.app.clientUrl,
        ...index_config_1.appConfig.app.allowedOrigins,
    ];
    if (origin && !allowedOrigins.includes(origin)) {
        logger_utils_1.logger.warn(`[AUTH] Rejected browser origin: ${origin}. Allowed origins: ${allowedOrigins.join(", ")}`);
        throw new httpError_1.HttpError("REQUEST_NOT_ALLOWED");
    }
    next();
};
exports.checkAuthOrigin = checkAuthOrigin;
