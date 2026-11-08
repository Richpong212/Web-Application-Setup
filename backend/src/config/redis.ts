import Redis from "ioredis";
import { appConfig } from "./index.config";
import { logger } from "../utils/logger.utils";

export const redis = new Redis({
  host: appConfig.cache.host,
  port: appConfig.cache.port,
  username: appConfig.cache.username,
  password: appConfig.cache.password,
  db: appConfig.cache.database,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: appConfig.cache.connectTimeoutMs,
  commandTimeout: appConfig.cache.connectTimeoutMs,
  maxRetriesPerRequest: 1,
  keyPrefix: `${appConfig.cache.keyPrefix}:`,
});
redis.on("connect", () => logger.info("[REDIS] TCP connection established"));
redis.on("ready", () => logger.info("[REDIS] Connection ready"));
redis.on("error", (error) => logger.warn(`[REDIS] Connection error: ${error.message}`));
redis.on("close", () => logger.warn("[REDIS] Connection closed"));
redis.on("reconnecting", (delay: number) => logger.warn(`[REDIS] Reconnecting in ${delay}ms`));
redis.on("end", () => logger.info("[REDIS] Connection ended"));

export const connectRedis = async () => {
  if (!appConfig.cache.enabled) {
    logger.info("[REDIS] Cache disabled (REDIS_CACHE_ENABLED=false)");
    return;
  }

  logger.info(`[REDIS] Connecting to ${appConfig.cache.host}:${appConfig.cache.port}, database ${appConfig.cache.database}`);

  await redis.connect();
  await redis.ping();

  logger.info("[REDIS] PING successful; cache initialized");
};
