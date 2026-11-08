"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const memcached_1 = __importDefault(require("memcached"));
const index_config_1 = require("./config/index.config");
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const logger_utils_1 = require("./utils/logger.utils");
const app = (0, express_1.default)();
const port = index_config_1.appConfig.app.port;
//middlewares
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
const memcached = new memcached_1.default(`${index_config_1.appConfig.app.memcached_host}:${index_config_1.appConfig.app.memcached_port}`);
app.get("/", (req, res) => {
    const cacheKey = "testkey";
    memcached.get(cacheKey, (err, data) => {
        if (err) {
            logger_utils_1.logger.error("Error retrieving from cache:", err);
            return res.status(500).json({ error: "Error retrieving from cache" });
        }
        if (data) {
            logger_utils_1.logger.info("Data retrieved from cache:", data);
            return res.status(200).json({ cached: true, message: "data from cache" });
        }
        else {
            const message = "Hello from the backend!";
            memcached.set(cacheKey, message, 10, (err) => {
                if (err) {
                    logger_utils_1.logger.error("Error saving to cache:", err);
                    return res.status(500).json({ error: "Error saving to cache" });
                }
                return res.status(200).json({ cached: false, message });
            });
        }
    });
});
app.listen(port, () => {
    logger_utils_1.logger.info(`Server is running on http://${index_config_1.appConfig.app.app_host}:${port} in ${index_config_1.appConfig.app.mode} mode`);
});
exports.default = app;
