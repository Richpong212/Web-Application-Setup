import { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import * as farmService from "../services/farm.service";

// Ignore whole-body validator metadata; only these fields may reach the model.
const farmInput = (req: Request) => {
  const data = matchedData(req, { locations: ["body"] });
  const allowed = [
    "name",
    "country",
    "location",
    "type",
    "description",
    "houses",
  ];
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => allowed.includes(key)),
  );
};

export const createFarm = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = farmInput(req) as farmService.FarmInput;
    const data = await farmService.createFarm(res.locals.user.id, input);
    res.status(201).json({ message: "Farm created", data });
  } catch (error) {
    return next(error);
  }
};

export const listFarms = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = 1, limit = 20 } = matchedData(req, { locations: ["query"] });
    res.json(await farmService.listFarms(res.locals.user.id, page, limit));
  } catch (error) {
    return next(error);
  }
};

export const getFarm = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    res.json({ data: await farmService.getFarm(res.locals.user.id, farmId) });
  } catch (error) {
    return next(error);
  }
};

export const updateFarm = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = farmInput(req);
    res.json({
      message: "Farm updated",
      data: await farmService.updateFarm(res.locals.user.id, farmId, input),
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteFarm = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    await farmService.deleteFarm(res.locals.user.id, farmId);
    res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

export const addHouse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const { name } = matchedData(req, { locations: ["body"] });
    res.json({
      data: await farmService.addHouse(res.locals.user.id, farmId, name),
    });
  } catch (error) {
    return next(error);
  }
};
