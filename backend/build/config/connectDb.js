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
exports.connectDb = exports.db = void 0;
const sequelize_1 = require("sequelize");
const index_config_1 = require("./index.config");
const logger_utils_1 = require("../utils/logger.utils");
exports.db = new sequelize_1.Sequelize(index_config_1.appConfig.db.db_name, index_config_1.appConfig.db.db_user, index_config_1.appConfig.db.db_password, {
    host: index_config_1.appConfig.db.db_host,
    port: index_config_1.appConfig.db.db_port,
    dialect: "postgres",
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
// Models register themselves when imported by the application routes.
const connectDb = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_utils_1.logger.info(`[DATABASE] Connecting to PostgreSQL at ${index_config_1.appConfig.db.db_host}:${index_config_1.appConfig.db.db_port}`);
    yield exports.db.authenticate();
    logger_utils_1.logger.info("[DATABASE] Connected to PostgreSQL");
    const models = Object.keys(exports.db.models);
    for (const model of models)
        logger_utils_1.logger.info(`[MODELS] Registered model: ${model}`);
    logger_utils_1.logger.info(`[MODELS] Total registered models: ${models.length}`);
    logger_utils_1.logger.info("[DATABASE] Schema managed by migrations (yarn db:migrate)");
});
exports.connectDb = connectDb;
