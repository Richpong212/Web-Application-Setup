import { getWeeklyRecords } from "../services/weeklyRecord.service";
import { NextFunction, Request, Response } from "express";
import { matchedData } from "express-validator";
import * as workspaceService from "../services/workspace.service";
import * as flockService from "../services/flock.service";
import * as recordService from "../services/record.service";
import * as scheduleService from "../services/schedule.service";
import * as taskService from "../services/task.service";
import * as reportService from "../services/report.service";

export const workspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    res.json({
      data: await workspaceService.getWorkspace(res.locals.user.id, farmId),
    });
  } catch (error) {
    return next(error);
  }
};

export const createFlock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    res.status(201).json({
      data: await flockService.createFlock(
        res.locals.user.id,
        farmId,
        input as any,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateFlock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId, id } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    res.json({
      data: await flockService.updateFlock(
        res.locals.user.id,
        farmId,
        id,
        input,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const createRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    res.status(201).json({
      data: await recordService.createRecord(
        res.locals.user,
        farmId,
        input as any,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const correctRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId, id } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    res.json({
      data: await recordService.correctRecord(
        res.locals.user.id,
        farmId,
        id,
        input as any,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const feedSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    await scheduleService.replaceFeedSchedule(
      res.locals.user.id,
      farmId,
      input.stages,
    );
    res.json({ message: "Feeding schedule saved" });
  } catch (error) {
    return next(error);
  }
};

export const vaccineSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    await scheduleService.replaceVaccinationSchedule(
      res.locals.user.id,
      farmId,
      input.entries,
    );
    res.json({ message: "Vaccination schedule saved" });
  } catch (error) {
    return next(error);
  }
};

export const completeVaccination = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    await scheduleService.completeVaccination(
      res.locals.user,
      farmId,
      input as any,
    );
    res.status(201).json({ message: "Vaccination recorded" });
  } catch (error) {
    return next(error);
  }
};

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    res.status(201).json({
      data: await taskService.createTask(
        res.locals.user.id,
        farmId,
        input as any,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId, id } = matchedData(req, { locations: ["params"] });
    const input = matchedData(req, { locations: ["body"] });
    delete input[""];
    res.json({
      data: await taskService.updateTask(res.locals.user.id, farmId, id, input),
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId, id } = matchedData(req, { locations: ["params"] });
    await taskService.deleteTask(res.locals.user.id, farmId, id);
    res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

export const auditLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    res.json({
      data: await workspaceService.listAudit(res.locals.user.id, farmId),
    });
  } catch (error) {
    return next(error);
  }
};

export const report = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const { from, to, flockId } = matchedData(req, { locations: ["query"] });
    res.json({
      data: await reportService.getReport(
        res.locals.user.id,
        farmId,
        from,
        to,
        flockId,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

export const exportReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const { from, to, flockId } = matchedData(req, { locations: ["query"] });
    const report = await reportService.getReport(
      res.locals.user.id,
      farmId,
      from,
      to,
      flockId,
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="farm-report-${from}-to-${to}.csv"`,
    );
    res.type("text/csv").send(reportService.reportCsv(report));
  } catch (error) {
    return next(error);
  }
};

export const dashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 29 * 86400000)
      .toISOString()
      .slice(0, 10);
    const { records, flocks, ...summary } = await reportService.getReport(
      res.locals.user.id,
      farmId,
      from,
      to,
      undefined,
      true,
    );
    void records;
    void flocks;
    const today = summary.byDay.find((row) => row.date === to);
    res.json({
      data: {
        ...summary,
        eggsToday: today?.eggs || 0,
        feedToday: today?.feed || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const weeklyRecords = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { farmId } = matchedData(req, { locations: ["params"] });
    const { flockId, week } = matchedData(req, { locations: ["query"] });
    res.json({
      data: await getWeeklyRecords(res.locals.user.id, farmId, flockId, week),
    });
  } catch (error) {
    return next(error);
  }
};
