import { validationResult } from "express-validator";
import { RequestHandler } from "express";
import { HttpError } from "../utils/httpError";

export const validate: RequestHandler = (req, _res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    // Return field names and our validation rules, never submitted values.
    const fields = result
      .array({ onlyFirstError: true })
      .filter((error) => error.type === "field")
      .map((error) => ({
        field: error.path,
        message:
          typeof error.msg === "string" ? error.msg : "Check this field.",
      }));
    throw new HttpError("VALIDATION_ERROR", fields);
  }

  next();
};
