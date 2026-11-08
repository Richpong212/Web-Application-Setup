import { CookieOptions, NextFunction, Request, Response } from "express";

import { appConfig } from "../config/index.config";
import { Session, User } from "../models";
import * as authService from "../services/auth.service";
import { HttpError } from "../utils/httpError";

const refreshCookieName = `${appConfig.app.cookieName}_refresh`;

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure:
    appConfig.app.mode === "production" ||
    appConfig.app.cookieSameSite === "none",
  sameSite: appConfig.app.cookieSameSite,
  path: "/api/v1",
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.loginUser(
      req.body.email,
      req.body.password,
    );

    res.cookie(refreshCookieName, result.refreshToken, {
      ...refreshCookieOptions,
      expires: result.expiresAt,
    });

    res.json({
      message: "Logged in successfully",
      data: { user: result.user, accessToken: result.accessToken },
    });
  } catch (error) {
    return next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies[refreshCookieName];

    if (typeof token !== "string") {
      throw new HttpError("SIGN_IN_REQUIRED");
    }

    const result = await authService.refreshSession(token);

    res.cookie(refreshCookieName, result.refreshToken, {
      ...refreshCookieOptions,
      expires: result.expiresAt,
    });

    res.json({ data: { accessToken: result.accessToken } });
  } catch (error) {
    res.clearCookie(refreshCookieName, refreshCookieOptions);
    return next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies[refreshCookieName];

    if (typeof token === "string") {
      await authService.revokeSession(token);
    }

    res.clearCookie(refreshCookieName, refreshCookieOptions);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
};

export const logoutAll = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = res.locals.user as User;

    await Session.update(
      { revokedAt: new Date() },
      { where: { userId: user.id, revokedAt: null } },
    );

    res.clearCookie(refreshCookieName, refreshCookieOptions);
    res.json({ message: "All sessions revoked" });
  } catch (error) {
    return next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await authService.verifyEmail(req.body.token);

    res.json({
      message:
        "Email verified. Your account has been created. You can now log in.",
    });
  } catch (error) {
    return next(error);
  }
};

export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await authService.resendVerification(req.body.email);

    res.json({
      message: "If a signup is pending, an approval email has been sent.",
    });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await authService.requestPasswordReset(req.body.email);

    res.json({
      message: "If the account exists, a password reset email has been sent.",
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);

    res.clearCookie(refreshCookieName, refreshCookieOptions);
    res.json({ message: "Password reset. Log in again on all devices." });
  } catch (error) {
    return next(error);
  }
};
