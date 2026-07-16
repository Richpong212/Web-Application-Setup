import { existsSync } from "fs";
import { config } from "dotenv";

// APP mode
const mode = process.env.NODE_ENV || "local";

const envFileCandidates =
  mode === "local" ? [`.${mode}.env`, `${mode}.env`] : [`.${mode}.env`];
const envFilePath =
  envFileCandidates.find((candidatePath) => existsSync(candidatePath)) ??
  `.${mode}.env`;

config({ path: envFilePath });

const requiredFromEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const csvFromEnv = (value: string | undefined) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export const appConfig = {
  app: {
    mode,
    port: process.env.APP_PORT,
    app_host: process.env.APP_HOST,
    jwt_secret: requiredFromEnv("JWT_SECRET"),
    secretKey: requiredFromEnv("SECRET_KEY"),
    clientUrl: requiredFromEnv("CLIENT_URL"),
    allowedOrigins: csvFromEnv(process.env.ALLOWED_ORIGINS),
    bodyLimit: process.env.REQUEST_BODY_LIMIT || "100kb",
    cookieName: process.env.AUTH_COOKIE_NAME || "rentaa_session",
    cookieSameSite:
      (process.env.AUTH_COOKIE_SAME_SITE as
        | "strict"
        | "lax"
        | "none"
        | undefined) || "strict",
    loginTokenTtl: process.env.LOGIN_TOKEN_TTL || "1h",
    authCookieMaxAgeMs: numberFromEnv(
      process.env.AUTH_COOKIE_MAX_AGE_MS,
      60 * 60 * 1000,
    ),
    authRateLimitWindowMs: numberFromEnv(
      process.env.AUTH_RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000,
    ),
    authRateLimitMax: numberFromEnv(process.env.AUTH_RATE_LIMIT_MAX, 10),
    adminRateLimitWindowMs: numberFromEnv(
      process.env.ADMIN_RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000,
    ),
    adminRateLimitMax: numberFromEnv(process.env.ADMIN_RATE_LIMIT_MAX, 60),
    globalRateLimitWindowMs: numberFromEnv(
      process.env.GLOBAL_RATE_LIMIT_WINDOW_MS,
      15 * 60 * 1000,
    ),
    globalRateLimitMax: numberFromEnv(process.env.GLOBAL_RATE_LIMIT_MAX, 100),
  },
  cache: {
    enabled: process.env.REDIS_CACHE_ENABLED !== "false",
    host: process.env.REDIS_HOST || "localhost",
    port: numberFromEnv(process.env.REDIS_PORT, 6379),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    database: numberFromEnv(process.env.REDIS_DB, 0),
    connectTimeoutMs: numberFromEnv(process.env.REDIS_CONNECT_TIMEOUT_MS, 2000),
    keyPrefix: process.env.REDIS_CACHE_KEY_PREFIX || `rentaa:${mode}`,
    defaultTtlSeconds: numberFromEnv(process.env.REDIS_DEFAULT_TTL_SECONDS, 60),
    publicPropertyTtlSeconds: numberFromEnv(
      process.env.REDIS_PUBLIC_PROPERTY_TTL_SECONDS,
      120,
    ),
    privateResourceTtlSeconds: numberFromEnv(
      process.env.REDIS_PRIVATE_RESOURCE_TTL_SECONDS,
      30,
    ),
  },
  db: {
    db_name: process.env.POSTGRES_DB,
    db_user: process.env.POSTGRES_USER,
    db_password: process.env.POSTGRES_PASSWORD,
    db_host: process.env.POSTGRES_HOST,
    db_port: Number(process.env.POSTGRES_PORT),
  },
  smtp: {
    host: requiredFromEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT),
    user: requiredFromEnv("SMTP_EMAIL"),
    password: requiredFromEnv("SMTP_PASSWORD"),
    fromName: requiredFromEnv("SMTP_FROM_NAME"),
  },
};
