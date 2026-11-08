import { Router } from "express";
import { createUser } from "../controllers/user.controller";
import { registrationValidation } from "../validations/user.validation";
import { validate } from "../validations/index.validation";

const userRouter = Router();

//POST: create a new user
userRouter.post("/signup", registrationValidation, validate, createUser);

export default userRouter;
