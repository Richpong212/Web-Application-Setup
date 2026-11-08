import { Router } from "express";
import rateLimit from "express-rate-limit";

import { sendError } from "../utils/errorResponse";
import { appConfig } from "../config/index.config";
import { createUser } from "../controllers/user.controller";
import * as authController from "../controllers/auth.controller";
import { authenticate, checkAuthOrigin } from "../middleware/auth.middleware";
import {
  registrationValidation,
  loginValidation,
  emailValidation,
  tokenValidation,
  resetPasswordValidation,
} from "../validations/user.validation";
import { validate } from "../validations/index.validation";

// Each sensitive action has its own budget; successful login is never penalized.
const sensitiveActionLimiter = (skipSuccessfulRequests = false) => rateLimit({
  windowMs: appConfig.app.authRateLimitWindowMs,
  limit: appConfig.app.authRateLimitMax,
  skipSuccessfulRequests,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, "RATE_LIMITED"),
});

// Share registration protection with the legacy signup alias.
export const authLimiter = sensitiveActionLimiter();
export const loginLimiter = sensitiveActionLimiter(true);

const authRouter = Router();

authRouter.use(checkAuthOrigin);
authRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Account registration and verification
authRouter.post("/register", authLimiter, registrationValidation, validate, createUser);
authRouter.post(
  "/verify-email",
  sensitiveActionLimiter(),
  tokenValidation,
  validate,
  authController.verifyEmail,
);
authRouter.post(
  "/resend-verification",
  sensitiveActionLimiter(),
  emailValidation,
  validate,
  authController.resendVerification,
);

// Sessions
authRouter.post("/login", loginLimiter, loginValidation, validate, authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post("/logout-all", authenticate, authController.logoutAll);

// Password recovery
authRouter.post(
  "/forgot-password",
  sensitiveActionLimiter(),
  emailValidation,
  validate,
  authController.forgotPassword,
);
authRouter.post(
  "/reset-password",
  sensitiveActionLimiter(),
  resetPasswordValidation,
  validate,
  authController.resetPassword,
);

export default authRouter;
