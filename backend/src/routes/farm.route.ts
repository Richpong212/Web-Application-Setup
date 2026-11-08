import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as farmController from "../controllers/farm.controller";
import {
  addHouseValidation,
  createFarmValidation,
  updateFarmValidation,
  farmIdValidation,
  listFarmsValidation,
} from "../validations/farm.validation";
import { validate } from "../validations/index.validation";

const farmRouter = Router();

farmRouter.use(authenticate);
farmRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

farmRouter.get("/", listFarmsValidation, validate, farmController.listFarms);
farmRouter.post("/", createFarmValidation, validate, farmController.createFarm);
farmRouter.post(
  "/:farmId/houses",
  farmIdValidation,
  addHouseValidation,
  validate,
  farmController.addHouse,
);
farmRouter.get("/:farmId", farmIdValidation, validate, farmController.getFarm);
farmRouter.patch(
  "/:farmId",
  farmIdValidation,
  updateFarmValidation,
  validate,
  farmController.updateFarm,
);
farmRouter.delete(
  "/:farmId",
  farmIdValidation,
  validate,
  farmController.deleteFarm,
);

export default farmRouter;
