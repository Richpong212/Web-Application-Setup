import { validationResult } from "express-validator";
import { RequestHandler } from "express";

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return only the first error message
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }
  next();
};
