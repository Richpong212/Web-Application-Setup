import "./models";
import { appConfig } from "./config/index.config";
import { connectDb, db } from "./config/connectDb";
import { redis, connectRedis } from "./config/redis";
import { createApp } from "./app";
import { logger } from "./utils/logger.utils";

const start = async () => {
  logger.info(`[STARTUP] Initializing backend in ${appConfig.app.mode} mode`);

  // Connect required services before accepting requests.
  await Promise.all([connectDb(), connectRedis()]);
  logger.info("[STARTUP] Required service connections initialized");
  logger.info(
    "[SMTP] Email module configured; SMTP connections open when sending mail",
  );

  // Initialize the application and start the HTTP listener.
  const app = createApp();
  const host = appConfig.app.app_host || "0.0.0.0";
  const port = Number(appConfig.app.port || 5010);
  const server = app.listen(port, host, () => {
    logger.info(`[HTTP] Listening at http://${host}:${port}`);
    logger.info(
      "[STARTUP] Backend ready; health probes available at /health/live and /health/ready",
    );
  });

  // Drain active requests before closing service connections.
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info(`[SHUTDOWN] ${signal} received; draining HTTP requests`);
    app.locals.shuttingDown = true;

    const deadline = setTimeout(() => {
      logger.error(
        "[SHUTDOWN] Drain deadline exceeded; closing remaining connections",
      );
      server.closeAllConnections();
      redis.disconnect();
      process.exitCode = 1;
    }, 10000);
    deadline.unref();

    server.close(() => {
      logger.info(
        "[SHUTDOWN] HTTP listener closed; closing PostgreSQL and Redis",
      );
      void Promise.allSettled([db.close(), redis.quit()])
        .then((results) => {
          results.forEach((result, index) => {
            const service = index === 0 ? "PostgreSQL" : "Redis";

            if (result.status === "fulfilled") {
              logger.info(`[SHUTDOWN] ${service} closed`);
            } else {
              logger.error(`[SHUTDOWN] ${service} close failed`, result.reason);
              process.exitCode = 1;
            }
          });
          logger.info("[SHUTDOWN] Backend shutdown completed");
        })
        .finally(() => clearTimeout(deadline));
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));

  server.on("error", (error) => {
    logger.error("HTTP server failed", error);
    shutdown("HTTP server error");
    process.exitCode = 1;
  });
};

void start().catch(async (error: unknown) => {
  logger.error("Backend startup failed", error);
  redis.disconnect();
  await db.close();
  process.exitCode = 1;
});
