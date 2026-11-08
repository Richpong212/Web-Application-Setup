import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as controller from "../controllers/operations.controller";
import * as validation from "../validations/operations.validation";
import { validate } from "../validations/index.validation";

const router = Router({ mergeParams: true });
router.use(authenticate, validation.farmReference, validate);
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.get("/workspace", controller.workspace);
router.get("/dashboard", controller.dashboard);
router.get(
  "/records/weekly",
  validation.weeklyRecordsValidation,
  validate,
  controller.weeklyRecords,
);
router.post(
  "/flocks",
  validation.createFlockValidation,
  validate,
  controller.createFlock,
);
router.patch(
  "/flocks/:id",
  validation.resourceReference,
  validation.updateFlockValidation,
  validate,
  controller.updateFlock,
);
router.post(
  "/records",
  validation.createRecordValidation,
  validate,
  controller.createRecord,
);
router.patch(
  "/records/:id",
  validation.resourceReference,
  validation.correctRecordValidation,
  validate,
  controller.correctRecord,
);
router.put(
  "/feed-schedule",
  validation.feedValidation,
  validate,
  controller.feedSchedule,
);
router.put(
  "/vaccination-schedule",
  validation.vaccineValidation,
  validate,
  controller.vaccineSchedule,
);
router.post(
  "/vaccinations",
  validation.completeVaccineValidation,
  validate,
  controller.completeVaccination,
);
router.post(
  "/tasks",
  validation.createTaskValidation,
  validate,
  controller.createTask,
);
router.patch(
  "/tasks/:id",
  validation.resourceReference,
  validation.updateTaskValidation,
  validate,
  controller.updateTask,
);
router.delete(
  "/tasks/:id",
  validation.resourceReference,
  validate,
  controller.deleteTask,
);
router.get(
  "/reports",
  validation.reportValidation,
  validate,
  controller.report,
);
router.get(
  "/reports.csv",
  validation.reportValidation,
  validate,
  controller.exportReport,
);
router.get("/audit", controller.auditLog);
export default router;
