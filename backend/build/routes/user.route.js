"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_validation_1 = require("../validations/user.validation");
const index_validation_1 = require("../validations/index.validation");
const auth_route_1 = require("./auth.route");
const userRouter = (0, express_1.Router)();
// Preserve the original signup URL while supporting /auth/register.
userRouter.post("/signup", auth_route_1.authLimiter, auth_middleware_1.checkAuthOrigin, user_validation_1.registrationValidation, index_validation_1.validate, user_controller_1.createUser);
// Users can only read and update their own profile.
userRouter.use(auth_middleware_1.authenticate);
userRouter.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
userRouter.get("/me", user_controller_1.getCurrentUser);
userRouter.patch("/me", user_validation_1.updateUserValidation, index_validation_1.validate, user_controller_1.updateCurrentUser);
exports.default = userRouter;
