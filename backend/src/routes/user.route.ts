import { Router } from "express";

import {
  createUser,
  getCurrentUser,
  updateCurrentUser,
} from "../controllers/user.controller";
import { authenticate, checkAuthOrigin } from "../middleware/auth.middleware";
import {
  registrationValidation,
  updateUserValidation,
} from "../validations/user.validation";
import { validate } from "../validations/index.validation";
import { authLimiter } from "./auth.route";

const userRouter = Router();

// Preserve the original signup URL while supporting /auth/register.
userRouter.post(
  "/signup",
  authLimiter,
  checkAuthOrigin,
  registrationValidation,
  validate,
  createUser,
);

// Users can only read and update their own profile.
userRouter.use(authenticate);
userRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
userRouter.get("/me", getCurrentUser);
userRouter.patch("/me", updateUserValidation, validate, updateCurrentUser);

export default userRouter;
