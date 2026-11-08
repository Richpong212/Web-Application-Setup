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
require("./models");
const index_config_1 = require("./config/index.config");
const connectDb_1 = require("./config/connectDb");
const redis_1 = require("./config/redis");
const app_1 = require("./app");
const logger_utils_1 = require("./utils/logger.utils");
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_utils_1.logger.info(`[STARTUP] Initializing backend in ${index_config_1.appConfig.app.mode} mode`);
    // Connect required services before accepting requests.
    yield Promise.all([(0, connectDb_1.connectDb)(), (0, redis_1.connectRedis)()]);
    logger_utils_1.logger.info("[STARTUP] Required service connections initialized");
    logger_utils_1.logger.info("[SMTP] Email module configured; SMTP connections open when sending mail");
    // Initialize the application and start the HTTP listener.
    const app = (0, app_1.createApp)();
    const host = index_config_1.appConfig.app.app_host || "0.0.0.0";
    const port = Number(index_config_1.appConfig.app.port || 5010);
    const server = app.listen(port, host, () => {
        logger_utils_1.logger.info(`[HTTP] Listening at http://${host}:${port}`);
        logger_utils_1.logger.info("[STARTUP] Backend ready; health probes available at /health/live and /health/ready");
    });
    // Drain active requests before closing service connections.
    let shuttingDown = false;
    const shutdown = (signal) => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        logger_utils_1.logger.info(`[SHUTDOWN] ${signal} received; draining HTTP requests`);
        app.locals.shuttingDown = true;
        const deadline = setTimeout(() => {
            logger_utils_1.logger.error("[SHUTDOWN] Drain deadline exceeded; closing remaining connections");
            server.closeAllConnections();
            redis_1.redis.disconnect();
            process.exitCode = 1;
        }, 10000);
        deadline.unref();
        server.close(() => {
            logger_utils_1.logger.info("[SHUTDOWN] HTTP listener closed; closing PostgreSQL and Redis");
            void Promise.allSettled([connectDb_1.db.close(), redis_1.redis.quit()])
                .then((results) => {
                results.forEach((result, index) => {
                    const service = index === 0 ? "PostgreSQL" : "Redis";
                    if (result.status === "fulfilled") {
                        logger_utils_1.logger.info(`[SHUTDOWN] ${service} closed`);
                    }
                    else {
                        logger_utils_1.logger.error(`[SHUTDOWN] ${service} close failed`, result.reason);
                        process.exitCode = 1;
                    }
                });
                logger_utils_1.logger.info("[SHUTDOWN] Backend shutdown completed");
            })
                .finally(() => clearTimeout(deadline));
        });
    };
    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
    server.on("error", (error) => {
        logger_utils_1.logger.error("HTTP server failed", error);
        shutdown("HTTP server error");
        process.exitCode = 1;
    });
});
void start().catch((error) => __awaiter(void 0, void 0, void 0, function* () {
    logger_utils_1.logger.error("Backend startup failed", error);
    redis_1.redis.disconnect();
    yield connectDb_1.db.close();
    process.exitCode = 1;
}));
