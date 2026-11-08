import { RequestHandler } from "express";
import { Op } from "sequelize";

import { appConfig } from "../config/index.config";
import { Session, User } from "../models";
import { readAuthToken } from "../utils/authToken";
import { logger } from "../utils/logger.utils";
import { HttpError } from "../utils/httpError";

export const authenticate: RequestHandler = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError("SIGN_IN_REQUIRED");
  }

  const { userId, sessionId } = readAuthToken(authorization.slice(7), "access");
  const session = await Session.findOne({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
  });
  const user = await User.findByPk(userId);

  if (!session || !user || !user.isEmailVerified) {
    throw new HttpError("SESSION_EXPIRED");
  }

  res.locals.user = user;
  next();
};

// Cookies are sent automatically by browsers. Reject untrusted browser origins
// on login, refresh and logout, even if CORS would hide their responses.
export const checkAuthOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    appConfig.app.clientUrl,
    ...appConfig.app.allowedOrigins,
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    logger.warn(
      `[AUTH] Rejected browser origin: ${origin}. Allowed origins: ${allowedOrigins.join(", ")}`,
    );
    throw new HttpError("REQUEST_NOT_ALLOWED");
  }

  next();
};
