"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAuthToken = exports.createRefreshToken = exports.createAccessToken = exports.createEmailToken = exports.hashToken = void 0;
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_config_1 = require("../config/index.config");
const token_1 = require("./token");
const httpError_1 = require("./httpError");
const hashToken = (token) => {
    return (0, crypto_1.createHash)("sha256").update(token).digest("hex");
};
exports.hashToken = hashToken;
const createEmailToken = () => (0, crypto_1.randomBytes)(32).toString("hex");
exports.createEmailToken = createEmailToken;
const createAccessToken = (userId, sessionId) => {
    return (0, token_1.genToken)({ sub: userId, sessionId, purpose: "access" }, index_config_1.appConfig.app.loginTokenTtl);
};
exports.createAccessToken = createAccessToken;
const createRefreshToken = (userId, sessionId, expiresAt) => {
    return (0, token_1.genToken)({
        sub: userId,
        sessionId,
        purpose: "refresh",
        jti: (0, crypto_1.randomBytes)(16).toString("hex"),
        exp: Math.floor(expiresAt.getTime() / 1000),
    });
};
exports.createRefreshToken = createRefreshToken;
const readAuthToken = (token, purpose) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, index_config_1.appConfig.app.jwt_secret, {
            algorithms: ["HS256"],
        });
        if (payload.purpose !== purpose ||
            typeof payload.sub !== "string" ||
            typeof payload.sessionId !== "string" ||
            !/^[0-9a-f-]{36}$/i.test(payload.sessionId) ||
            !/^[0-9a-f-]{36}$/i.test(payload.sub)) {
            throw new Error("Invalid token claims");
        }
        return { userId: payload.sub, sessionId: payload.sessionId };
    }
    catch (_a) {
        throw new httpError_1.HttpError("SESSION_EXPIRED");
    }
};
exports.readAuthToken = readAuthToken;
