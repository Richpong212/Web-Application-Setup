"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.runMigrations = void 0;
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
const logger_utils_1 = require("../utils/logger.utils");
const createAuthentication = __importStar(require("../migrations/002-create-authentication"));
const pendingSignups = __importStar(require("../migrations/003-pending-signups"));
const createFarms = __importStar(require("../migrations/004-create-farms"));
const teamAndOperations = __importStar(require("../migrations/005-team-and-operations"));
const createUsers = __importStar(require("../migrations/001-create-users"));
// Add migrations here in order. Applied migrations must never be edited.
const migrations = [
    Object.assign({ name: "001-create-users" }, createUsers),
    Object.assign({ name: "002-create-authentication" }, createAuthentication),
    Object.assign({ name: "003-pending-signups" }, pendingSignups),
    Object.assign({ name: "004-create-farms" }, createFarms),
    Object.assign({ name: "005-team-and-operations" }, teamAndOperations),
];
const runMigrations = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (direction = "up") {
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        // Only one deployment may change the schema at a time.
        yield connectDb_1.db.query("SELECT pg_advisory_xact_lock(73519001)", { transaction });
        yield connectDb_1.db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())', { transaction });
        const appliedMigrations = yield connectDb_1.db.query("SELECT name FROM schema_migrations ORDER BY name", { type: sequelize_1.QueryTypes.SELECT, transaction });
        const appliedNames = appliedMigrations.map((migration) => migration.name);
        const unknownMigration = appliedNames.find((name) => {
            return !migrations.some((migration) => migration.name === name);
        });
        if (unknownMigration) {
            throw new Error(`Unknown applied migration: ${unknownMigration}`);
        }
        const queryInterface = connectDb_1.db.getQueryInterface();
        if (direction === "down") {
            const lastMigrationName = appliedNames[appliedNames.length - 1];
            const migration = migrations.find((item) => item.name === lastMigrationName);
            if (!lastMigrationName) {
                logger_utils_1.logger.info("[MIGRATIONS] Nothing to roll back");
                return;
            }
            if (!migration) {
                throw new Error(`Unknown applied migration: ${lastMigrationName}`);
            }
            yield migration.down(queryInterface, transaction);
            yield connectDb_1.db.query("DELETE FROM schema_migrations WHERE name = :name", {
                replacements: { name: migration.name },
                transaction,
            });
            logger_utils_1.logger.info(`[MIGRATIONS] Rolling back ${migration.name}`);
            return;
        }
        for (const migration of migrations) {
            if (appliedNames.includes(migration.name)) {
                continue;
            }
            logger_utils_1.logger.info(`[MIGRATIONS] Applying ${migration.name}`);
            yield migration.up(queryInterface, transaction);
            yield connectDb_1.db.query("INSERT INTO schema_migrations (name) VALUES (:name)", {
                replacements: { name: migration.name },
                transaction,
            });
        }
    }));
    logger_utils_1.logger.info("[MIGRATIONS] Transaction committed; schema is up to date");
});
exports.runMigrations = runMigrations;
// Importing the runner from tests does not execute migrations or close their pool.
if (require.main === module) {
    const direction = process.argv[2];
    const migrate = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (direction && direction !== "up" && direction !== "down") {
                throw new Error("Migration direction must be up or down");
            }
            yield (0, exports.runMigrations)(direction === "down" ? "down" : "up");
        }
        catch (error) {
            logger_utils_1.logger.error("[MIGRATIONS] Failed; schema changes rolled back", error);
            process.exitCode = 1;
        }
        finally {
            yield connectDb_1.db.close();
        }
    });
    void migrate();
}
