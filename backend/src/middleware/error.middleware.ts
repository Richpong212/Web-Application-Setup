import { randomUUID } from "crypto";
import { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/httpError";
import { sendError } from "../utils/errorResponse";
import { logger } from "../utils/logger.utils";

export const handleError: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  res.locals.requestId ||= randomUUID();

  if (error instanceof HttpError) {
    sendError(res, error.code, error.fields);
    return;
  }

  // Parser exceptions contain the submitted body. Only return a safe code.
  if (error?.type === "entity.parse.failed") {
    sendError(res, "INVALID_REQUEST");
    return;
  }
  if (error?.type === "entity.too.large") {
    sendError(res, "PAYLOAD_TOO_LARGE");
    return;
  }

  // Do not serialize the exception: Sequelize attaches SQL, parameters and
  // credentials. Log diagnostic codes and stack frames with a support reference.
  logger.error(`[HTTP] Unexpected failure; reference ${res.locals.requestId}`, {
    requestId: res.locals.requestId,
    errorName: error?.name,
    errorCode: error?.original?.code || error?.code,
    stack:
      typeof error?.stack === "string"
        ? error.stack
            .split("\n")
            .filter((line: string) => /^\s+at\s/.test(line))
            .join("\n")
        : undefined,
  });
  sendError(res, "INTERNAL_ERROR");
};
