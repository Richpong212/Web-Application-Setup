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
exports.resetPassword = exports.forgotPassword = exports.resendVerification = exports.verifyEmail = exports.logoutAll = exports.logout = exports.refresh = exports.login = void 0;
const index_config_1 = require("../config/index.config");
const models_1 = require("../models");
const authService = __importStar(require("../services/auth.service"));
const httpError_1 = require("../utils/httpError");
const refreshCookieName = `${index_config_1.appConfig.app.cookieName}_refresh`;
const refreshCookieOptions = {
    httpOnly: true,
    secure: index_config_1.appConfig.app.mode === "production" ||
        index_config_1.appConfig.app.cookieSameSite === "none",
    sameSite: index_config_1.appConfig.app.cookieSameSite,
    path: "/api/v1",
};
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield authService.loginUser(req.body.email, req.body.password);
        res.cookie(refreshCookieName, result.refreshToken, Object.assign(Object.assign({}, refreshCookieOptions), { expires: result.expiresAt }));
        res.json({
            message: "Logged in successfully",
            data: { user: result.user, accessToken: result.accessToken },
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.login = login;
const refresh = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies[refreshCookieName];
        if (typeof token !== "string") {
            throw new httpError_1.HttpError("SIGN_IN_REQUIRED");
        }
        const result = yield authService.refreshSession(token);
        res.cookie(refreshCookieName, result.refreshToken, Object.assign(Object.assign({}, refreshCookieOptions), { expires: result.expiresAt }));
        res.json({ data: { accessToken: result.accessToken } });
    }
    catch (error) {
        res.clearCookie(refreshCookieName, refreshCookieOptions);
        return next(error);
    }
});
exports.refresh = refresh;
const logout = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies[refreshCookieName];
        if (typeof token === "string") {
            yield authService.revokeSession(token);
        }
        res.clearCookie(refreshCookieName, refreshCookieOptions);
        res.json({ message: "Logged out successfully" });
    }
    catch (error) {
        return next(error);
    }
});
exports.logout = logout;
const logoutAll = (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        yield models_1.Session.update({ revokedAt: new Date() }, { where: { userId: user.id, revokedAt: null } });
        res.clearCookie(refreshCookieName, refreshCookieOptions);
        res.json({ message: "All sessions revoked" });
    }
    catch (error) {
        return next(error);
    }
});
exports.logoutAll = logoutAll;
const verifyEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield authService.verifyEmail(req.body.token);
        res.json({
            message: "Email verified. Your account has been created. You can now log in.",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.verifyEmail = verifyEmail;
const resendVerification = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield authService.resendVerification(req.body.email);
        res.json({
            message: "If a signup is pending, an approval email has been sent.",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.resendVerification = resendVerification;
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield authService.requestPasswordReset(req.body.email);
        res.json({
            message: "If the account exists, a password reset email has been sent.",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield authService.resetPassword(req.body.token, req.body.password);
        res.clearCookie(refreshCookieName, refreshCookieOptions);
        res.json({ message: "Password reset. Log in again on all devices." });
    }
    catch (error) {
        return next(error);
    }
});
exports.resetPassword = resetPassword;
