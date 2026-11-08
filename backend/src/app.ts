import express, { Request } from "express";
import { randomUUID } from "crypto";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

import { appConfig } from "./config/index.config";
import { db } from "./config/connectDb";
import { redis } from "./config/redis";
import operationsRouter from "./routes/operations.route";
import { teamRouter, invitationRouter } from "./routes/team.route";
import importRouter from "./routes/import.route";
import farmRouter from "./routes/farm.route";
import authRouter from "./routes/auth.route";
import { sendError } from "./utils/errorResponse";
import { handleError } from "./middleware/error.middleware";
import { HttpError } from "./utils/httpError";
import userRouter from "./routes/user.route";
import { logger } from "./utils/logger.utils";

// Tests can supply their own connections without opening real database connections.
export interface Dependencies {
  database: { authenticate(): Promise<unknown> };
  cache: Pick<typeof redis, "ping" | "get" | "set">;
  cacheEnabled: boolean;
}

// Keep health requests responsive when a service stops responding.
const checkServiceHealth = async (
  checkConnection: () => Promise<unknown>,
): Promise<"up" | "down"> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const healthCheckTimeout = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error("Health check timed out"));
      }, 1500);
    });

    await Promise.race([checkConnection(), healthCheckTimeout]);

    return "up";
  } catch {
    return "down";
  } finally {
    clearTimeout(timeout);
  }
};

export const createApp = (
  dependencies: Dependencies = {
    database: db,
    cache: redis,
    cacheEnabled: appConfig.cache.enabled,
  },
) => {
  const app = express();
  const { database, cache, cacheEnabled } = dependencies;

  // Trust only explicitly configured proxy addresses, never arbitrary forwarded headers.
  if (appConfig.app.trustedProxies.length)
    app.set("trust proxy", appConfig.app.trustedProxies);

  // Broad flood protection leaves room for teams sharing a network.
  const limiter = rateLimit({
    windowMs: appConfig.app.globalRateLimitWindowMs,
    limit: appConfig.app.globalRateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => sendError(res, "RATE_LIMITED"),
  });

  // Middleware
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    next();
  });

  // Queries and referers may contain approval/reset tokens. Never log them.
  morgan.token(
    "safe-path",
    (req) => (req as Request).originalUrl?.split("?")[0] || "/",
  );
  app.use(morgan(":method :safe-path :status :response-time ms"));

  app.use(
    cors({
      origin: [appConfig.app.clientUrl, ...appConfig.app.allowedOrigins],
      credentials: true,
      exposedHeaders: ["Retry-After", "RateLimit", "RateLimit-Policy"],
    }),
  );

  app.use(helmet());
  app.use(compression());

  // Health checks run before the limiter so monitoring stays available under load.
  app.get("/health/live", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get(["/health", "/health/ready"], async (_req, res) => {
    const [postgres, redisStatus] = await Promise.all([
      checkServiceHealth(() => database.authenticate()),
      cacheEnabled
        ? checkServiceHealth(() => cache.ping())
        : Promise.resolve("disabled"),
    ]);

    const isReady =
      !app.locals.shuttingDown && postgres === "up" && redisStatus !== "down";

    res.setHeader("Cache-Control", "no-store");

    res.status(isReady ? 200 : 503).json({
      status: isReady ? "ok" : "unavailable",
      checks: {
        postgres,
        redis: redisStatus,
      },
    });
  });

  // Application requests use rate limiting and the configured body size limit.
  app.use(limiter);
  // The bounded history import accepts larger JSON batches than ordinary forms.
  app.use("/api/v1/farms/:farmId/imports", express.json({ limit: "2mb" }));
  app.use(express.json({ limit: appConfig.app.bodyLimit }));
  app.use(
    express.urlencoded({
      extended: false,
      limit: appConfig.app.bodyLimit,
    }),
  );
  app.use(cookieParser());

  logger.info(
    "[MIDDLEWARE] Request logging, CORS, security headers, compression, rate limiting, body parsers and cookies initialized",
  );

  // Cache route: return the stored greeting, or cache a fresh one with an expiry.
  app.get("/", async (_req, res) => {
    const cacheKey = "greeting";
    const message = "Hello from the backend!";

    if (!cacheEnabled) {
      res.json({ cached: false, message });
      return;
    }

    try {
      const cachedMessage = await cache.get(cacheKey);

      if (cachedMessage !== null) {
        res.json({ cached: true, message: cachedMessage });
        return;
      }

      await cache.set(
        cacheKey,
        message,
        "EX",
        appConfig.cache.defaultTtlSeconds,
      );

      res.json({ cached: false, message });
    } catch {
      throw new HttpError("SERVICE_UNAVAILABLE");
    }
  });

  // Authentication and user routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/farms/:farmId/team", teamRouter);
  app.use("/api/v1/farms/:farmId/imports", importRouter);
  app.use("/api/v1/farms/:farmId", operationsRouter);
  app.use("/api/v1/invitations", invitationRouter);
  app.use("/api/v1/farms", farmRouter);
  logger.info("[ROUTES] Farm CRUD registered at /api/v1/farms");

  logger.info(
    "[ROUTES] Registered: GET /, GET /health, GET /health/live, GET /health/ready",
  );
  // Handle invalid routes after all application routes have been registered.
  app.use((_req, res) => {
    sendError(res, "NOT_FOUND");
  });

  app.use(handleError);

  logger.info("[APP] Express application initialized");

  return app;
};
