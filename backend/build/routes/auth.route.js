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
exports.loginLimiter = exports.authLimiter = void 0;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorResponse_1 = require("../utils/errorResponse");
const index_config_1 = require("../config/index.config");
const user_controller_1 = require("../controllers/user.controller");
const authController = __importStar(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_validation_1 = require("../validations/user.validation");
const index_validation_1 = require("../validations/index.validation");
// Each sensitive action has its own budget; successful login is never penalized.
const sensitiveActionLimiter = (skipSuccessfulRequests = false) => (0, express_rate_limit_1.default)({
    windowMs: index_config_1.appConfig.app.authRateLimitWindowMs,
    limit: index_config_1.appConfig.app.authRateLimitMax,
    skipSuccessfulRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => (0, errorResponse_1.sendError)(res, "RATE_LIMITED"),
});
// Share registration protection with the legacy signup alias.
exports.authLimiter = sensitiveActionLimiter();
exports.loginLimiter = sensitiveActionLimiter(true);
const authRouter = (0, express_1.Router)();
authRouter.use(auth_middleware_1.checkAuthOrigin);
authRouter.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
// Account registration and verification
authRouter.post("/register", exports.authLimiter, user_validation_1.registrationValidation, index_validation_1.validate, user_controller_1.createUser);
authRouter.post("/verify-email", sensitiveActionLimiter(), user_validation_1.tokenValidation, index_validation_1.validate, authController.verifyEmail);
authRouter.post("/resend-verification", sensitiveActionLimiter(), user_validation_1.emailValidation, index_validation_1.validate, authController.resendVerification);
// Sessions
authRouter.post("/login", exports.loginLimiter, user_validation_1.loginValidation, index_validation_1.validate, authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/logout-all", auth_middleware_1.authenticate, authController.logoutAll);
// Password recovery
authRouter.post("/forgot-password", sensitiveActionLimiter(), user_validation_1.emailValidation, index_validation_1.validate, authController.forgotPassword);
authRouter.post("/reset-password", sensitiveActionLimiter(), user_validation_1.resetPasswordValidation, index_validation_1.validate, authController.resetPassword);
exports.default = authRouter;
