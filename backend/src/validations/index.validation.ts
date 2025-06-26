import { validationResult } from "express-validator";
import { Response, NextFunction, Request } from "express";

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return only the first error message
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  return next();
};
