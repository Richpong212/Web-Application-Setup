import { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import * as teamService from "../services/team.service";

export const listTeam = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    res.json({ data: await teamService.listTeam(res.locals.user.id, farmId) });
  } catch (error) {
    return next(error);
  }
};

export const inviteMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    res.status(201).json({
      message: "Invitation sent",
      data: await teamService.inviteMember(
        res.locals.user.id,
        farmId,
        input as any,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId, id } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    await teamService.updateMember(
      res.locals.user.id,
      farmId,
      id,
      input as any,
    );
    res.json({ message: "Member permissions updated" });
  } catch (error) {
    return next(error);
  }
};

export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId, id } = matchedData(req, { locations: ["params"] });
    await teamService.removeMember(res.locals.user.id, farmId, id);
    res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

export const cancelInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId, id } = matchedData(req, { locations: ["params"] });
    await teamService.cancelInvitation(res.locals.user.id, farmId, id);
    res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

export const previewInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({
      data: await teamService.previewInvitation(
        String(matchedData(req, { locations: ["query"] }).token),
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const acceptInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    res.json({
      message: "Invitation accepted",
      data: await teamService.acceptInvitation(res.locals.user, input.token),
    });
  } catch (error) {
    return next(error);
  }
};
