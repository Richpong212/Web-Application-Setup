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
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const index_config_1 = require("./config/index.config");
const connectDb_1 = require("./config/connectDb");
const redis_1 = require("./config/redis");
const operations_route_1 = __importDefault(require("./routes/operations.route"));
const team_route_1 = require("./routes/team.route");
const import_route_1 = __importDefault(require("./routes/import.route"));
const farm_route_1 = __importDefault(require("./routes/farm.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const errorResponse_1 = require("./utils/errorResponse");
const error_middleware_1 = require("./middleware/error.middleware");
const httpError_1 = require("./utils/httpError");
const user_route_1 = __importDefault(require("./routes/user.route"));
const logger_utils_1 = require("./utils/logger.utils");
// Keep health requests responsive when a service stops responding.
const checkServiceHealth = (checkConnection) => __awaiter(void 0, void 0, void 0, function* () {
    let timeout;
    try {
        const healthCheckTimeout = new Promise((_resolve, reject) => {
            timeout = setTimeout(() => {
                reject(new Error("Health check timed out"));
            }, 1500);
        });
        yield Promise.race([checkConnection(), healthCheckTimeout]);
        return "up";
    }
    catch (_a) {
        return "down";
    }
    finally {
        clearTimeout(timeout);
    }
});
const createApp = (dependencies = {
    database: connectDb_1.db,
    cache: redis_1.redis,
    cacheEnabled: index_config_1.appConfig.cache.enabled,
}) => {
    const app = (0, express_1.default)();
    const { database, cache, cacheEnabled } = dependencies;
    // Trust only explicitly configured proxy addresses, never arbitrary forwarded headers.
    if (index_config_1.appConfig.app.trustedProxies.length)
        app.set("trust proxy", index_config_1.appConfig.app.trustedProxies);
    // Broad flood protection leaves room for teams sharing a network.
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: index_config_1.appConfig.app.globalRateLimitWindowMs,
        limit: index_config_1.appConfig.app.globalRateLimitMax,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        handler: (_req, res) => (0, errorResponse_1.sendError)(res, "RATE_LIMITED"),
    });
    // Middleware
    app.use((_req, res, next) => {
        res.locals.requestId = (0, crypto_1.randomUUID)();
        next();
    });
    // Queries and referers may contain approval/reset tokens. Never log them.
    morgan_1.default.token("safe-path", (req) => { var _a; return ((_a = req.originalUrl) === null || _a === void 0 ? void 0 : _a.split("?")[0]) || "/"; });
    app.use((0, morgan_1.default)(":method :safe-path :status :response-time ms"));
    app.use((0, cors_1.default)({
        origin: [index_config_1.appConfig.app.clientUrl, ...index_config_1.appConfig.app.allowedOrigins],
        credentials: true,
        exposedHeaders: ["Retry-After", "RateLimit", "RateLimit-Policy"],
    }));
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    // Health checks run before the limiter so monitoring stays available under load.
    app.get("/health/live", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.get(["/health", "/health/ready"], (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const [postgres, redisStatus] = yield Promise.all([
            checkServiceHealth(() => database.authenticate()),
            cacheEnabled
                ? checkServiceHealth(() => cache.ping())
                : Promise.resolve("disabled"),
        ]);
        const isReady = !app.locals.shuttingDown && postgres === "up" && redisStatus !== "down";
        res.setHeader("Cache-Control", "no-store");
        res.status(isReady ? 200 : 503).json({
            status: isReady ? "ok" : "unavailable",
            checks: {
                postgres,
                redis: redisStatus,
            },
        });
    }));
    // Application requests use rate limiting and the configured body size limit.
    app.use(limiter);
    // The bounded history import accepts larger JSON batches than ordinary forms.
    app.use("/api/v1/farms/:farmId/imports", express_1.default.json({ limit: "2mb" }));
    app.use(express_1.default.json({ limit: index_config_1.appConfig.app.bodyLimit }));
    app.use(express_1.default.urlencoded({
        extended: false,
        limit: index_config_1.appConfig.app.bodyLimit,
    }));
    app.use((0, cookie_parser_1.default)());
    logger_utils_1.logger.info("[MIDDLEWARE] Request logging, CORS, security headers, compression, rate limiting, body parsers and cookies initialized");
    // Cache route: return the stored greeting, or cache a fresh one with an expiry.
    app.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const cacheKey = "greeting";
        const message = "Hello from the backend!";
        if (!cacheEnabled) {
            res.json({ cached: false, message });
            return;
        }
        try {
            const cachedMessage = yield cache.get(cacheKey);
            if (cachedMessage !== null) {
                res.json({ cached: true, message: cachedMessage });
                return;
            }
            yield cache.set(cacheKey, message, "EX", index_config_1.appConfig.cache.defaultTtlSeconds);
            res.json({ cached: false, message });
        }
        catch (_a) {
            throw new httpError_1.HttpError("SERVICE_UNAVAILABLE");
        }
    }));
    // Authentication and user routes
    app.use("/api/v1/auth", auth_route_1.default);
    app.use("/api/v1/users", user_route_1.default);
    app.use("/api/v1/farms/:farmId/team", team_route_1.teamRouter);
    app.use("/api/v1/farms/:farmId/imports", import_route_1.default);
    app.use("/api/v1/farms/:farmId", operations_route_1.default);
    app.use("/api/v1/invitations", team_route_1.invitationRouter);
    app.use("/api/v1/farms", farm_route_1.default);
    logger_utils_1.logger.info("[ROUTES] Farm CRUD registered at /api/v1/farms");
    logger_utils_1.logger.info("[ROUTES] Registered: GET /, GET /health, GET /health/live, GET /health/ready");
    // Handle invalid routes after all application routes have been registered.
    app.use((_req, res) => {
        (0, errorResponse_1.sendError)(res, "NOT_FOUND");
    });
    app.use(error_middleware_1.handleError);
    logger_utils_1.logger.info("[APP] Express application initialized");
    return app;
};
exports.createApp = createApp;
