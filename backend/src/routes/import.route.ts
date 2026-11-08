import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { farmReference } from "../validations/operations.validation";
import { historyValidation } from "../validations/import.validation";
import { validate } from "../validations/index.validation";
import { preview, commit } from "../controllers/import.controller";

const router = Router({ mergeParams: true });
router.use(authenticate, farmReference, validate);
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.post("/preview", historyValidation, validate, preview);
router.post("/commit", historyValidation, validate, commit);
export default router;
