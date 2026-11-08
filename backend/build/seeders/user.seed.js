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
const index_config_1 = require("../config/index.config");
const connectDb_1 = require("../config/connectDb");
const models_1 = require("../models");
const passwordHashing_1 = require("../utils/passwordHashing");
const logger_utils_1 = require("../utils/logger.utils");
// Seed a pending request only. Approval is required before any user is created.
const seedUser = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (index_config_1.appConfig.app.mode === "production") {
            throw new Error("Development seeders cannot run in production");
        }
        const email = (_a = process.env.SEED_USER_EMAIL) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
        const password = process.env.SEED_USER_PASSWORD;
        if (!email ||
            !password ||
            Buffer.byteLength(password, "utf8") > 72 ||
            password.length < 12) {
            throw new Error("Set SEED_USER_EMAIL and SEED_USER_PASSWORD (12 characters minimum, 72 bytes maximum)");
        }
        if (yield models_1.User.findOne({ where: { email } })) {
            logger_utils_1.logger.info("[SEEDERS] Approved user already exists; no changes made");
            return;
        }
        const [, created] = yield models_1.PendingSignup.findOrCreate({
            where: { email },
            defaults: {
                name: process.env.SEED_USER_NAME || "Development User",
                email,
                password: yield (0, passwordHashing_1.hashPassword)(password),
                tokenHash: null,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        logger_utils_1.logger.info(created
            ? "[SEEDERS] Pending signup prepared; request an approval email to create the user"
            : "[SEEDERS] Pending signup already exists");
    }
    catch (error) {
        logger_utils_1.logger.error("[SEEDERS] Failed to prepare pending signup", error);
        process.exitCode = 1;
    }
    finally {
        yield connectDb_1.db.close();
    }
});
void seedUser();
