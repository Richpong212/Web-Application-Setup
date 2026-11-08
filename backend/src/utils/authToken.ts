import { createHash, randomBytes } from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";

import { appConfig } from "../config/index.config";
import { genToken } from "./token";
import { HttpError } from "./httpError";

export const hashToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

export const createEmailToken = () => randomBytes(32).toString("hex");

export const createAccessToken = (userId: string, sessionId: string) => {
  return genToken(
    { sub: userId, sessionId, purpose: "access" },
    appConfig.app.loginTokenTtl,
  );
};

export const createRefreshToken = (
  userId: string,
  sessionId: string,
  expiresAt: Date,
) => {
  return genToken({
    sub: userId,
    sessionId,
    purpose: "refresh",
    jti: randomBytes(16).toString("hex"),
    exp: Math.floor(expiresAt.getTime() / 1000),
  });
};

export const readAuthToken = (token: string, purpose: "access" | "refresh") => {
  try {
    const payload = jwt.verify(token, appConfig.app.jwt_secret, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (
      payload.purpose !== purpose ||
      typeof payload.sub !== "string" ||
      typeof payload.sessionId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(payload.sessionId) ||
      !/^[0-9a-f-]{36}$/i.test(payload.sub)
    ) {
      throw new Error("Invalid token claims");
    }

    return { userId: payload.sub, sessionId: payload.sessionId };
  } catch {
    throw new HttpError("SESSION_EXPIRED");
  }
};
