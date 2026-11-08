"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCurrentUser = exports.getCurrentUser = exports.createUser = void 0;
const auth_service_1 = require("../services/auth.service");
// Request signup approval. A user is created only by the approval endpoint.
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, auth_service_1.registerUser)({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });
        res.status(202).json({
            message: "If this email is eligible, you will receive an approval link. You can also log in or request a new link.",
            data: { email: result.email },
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.createUser = createUser;
const getCurrentUser = (_req, res, next) => {
    try {
        res.json({ data: (0, auth_service_1.publicUser)(res.locals.user) });
    }
    catch (error) {
        return next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
const updateCurrentUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        yield user.update({ name: req.body.name });
        res.json({ message: "Profile updated", data: (0, auth_service_1.publicUser)(user) });
    }
    catch (error) {
        return next(error);
    }
});
exports.updateCurrentUser = updateCurrentUser;
