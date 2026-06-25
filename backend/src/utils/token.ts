import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { appConfig } from "../config/index.config";
import { logger } from "./logger.utils";

const jwtSecret = appConfig.app.jwt_secret as Secret;

export const genToken = (
  payload: string | object | Buffer<ArrayBufferLike>,
  expiresIn?: string,
): string => {
  const options: SignOptions = {};

  if (expiresIn && expiresIn !== "0") {
    options.expiresIn = expiresIn as any;
  }

  return jwt.sign(payload, jwtSecret, options);
};

export const decodeToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch (error) {
    logger.error(error);
    return null;
  }
};
export const verifyToken = (token: string): boolean => {
  try {
    jwt.verify(token, jwtSecret);
    return true;
  } catch (error) {
    logger.error("Token verification failed:", error);
    return false;
  }
};
