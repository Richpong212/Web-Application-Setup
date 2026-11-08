import { Response } from "express";
import { errors, ErrorCode, FieldError } from "./errors";

// Keep client responses small. Diagnostics belong in server logs.
export const sendError = (
  res: Response,
  code: ErrorCode,
  fields: FieldError[] = [],
) => {
  const error = errors[code];
  const message =
    code === "VALIDATION_ERROR" && fields[0]
      ? fields[0].message
      : error.message;

  res.setHeader("Cache-Control", "no-store");
  res.status(error.status).json({ message });
};
