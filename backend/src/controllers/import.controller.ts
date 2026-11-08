import { Request, Response, NextFunction } from "express";
import { matchedData } from "express-validator";
import {
  HistoryInput,
  previewHistory,
  importHistory,
} from "../services/import.service";

export const preview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] }) as HistoryInput;
    res.json({ data: await previewHistory(res.locals.user.id, farmId, input) });
  } catch (error) {
    return next(error);
  }
};
export const commit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] }) as HistoryInput;
    res.json({
      message: "Historical records imported",
      data: await importHistory(res.locals.user, farmId, input),
    });
  } catch (error) {
    return next(error);
  }
};
