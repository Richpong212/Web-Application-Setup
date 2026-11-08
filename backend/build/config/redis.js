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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const index_config_1 = require("./index.config");
const logger_utils_1 = require("../utils/logger.utils");
exports.redis = new ioredis_1.default({
    host: index_config_1.appConfig.cache.host,
    port: index_config_1.appConfig.cache.port,
    username: index_config_1.appConfig.cache.username,
    password: index_config_1.appConfig.cache.password,
    db: index_config_1.appConfig.cache.database,
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: index_config_1.appConfig.cache.connectTimeoutMs,
    commandTimeout: index_config_1.appConfig.cache.connectTimeoutMs,
    maxRetriesPerRequest: 1,
    keyPrefix: `${index_config_1.appConfig.cache.keyPrefix}:`,
});
exports.redis.on("connect", () => logger_utils_1.logger.info("[REDIS] TCP connection established"));
exports.redis.on("ready", () => logger_utils_1.logger.info("[REDIS] Connection ready"));
exports.redis.on("error", (error) => logger_utils_1.logger.warn(`[REDIS] Connection error: ${error.message}`));
exports.redis.on("close", () => logger_utils_1.logger.warn("[REDIS] Connection closed"));
exports.redis.on("reconnecting", (delay) => logger_utils_1.logger.warn(`[REDIS] Reconnecting in ${delay}ms`));
exports.redis.on("end", () => logger_utils_1.logger.info("[REDIS] Connection ended"));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!index_config_1.appConfig.cache.enabled) {
        logger_utils_1.logger.info("[REDIS] Cache disabled (REDIS_CACHE_ENABLED=false)");
        return;
    }
    logger_utils_1.logger.info(`[REDIS] Connecting to ${index_config_1.appConfig.cache.host}:${index_config_1.appConfig.cache.port}, database ${index_config_1.appConfig.cache.database}`);
    yield exports.redis.connect();
    yield exports.redis.ping();
    logger_utils_1.logger.info("[REDIS] PING successful; cache initialized");
});
exports.connectRedis = connectRedis;
