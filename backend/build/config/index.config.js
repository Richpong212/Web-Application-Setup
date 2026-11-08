"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const fs_1 = require("fs");
const dotenv_1 = require("dotenv");
// APP mode
const mode = process.env.NODE_ENV || "local";
const envFileCandidates = mode === "local" ? [`.${mode}.env`, `${mode}.env`] : [`.${mode}.env`];
const envFilePath = (_a = envFileCandidates.find((candidatePath) => (0, fs_1.existsSync)(candidatePath))) !== null && _a !== void 0 ? _a : `.${mode}.env`;
if (mode !== "test")
    (0, dotenv_1.config)({ path: envFilePath });
const requiredFromEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};
const numberFromEnv = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const csvFromEnv = (value) => {
    var _a;
    return (_a = value === null || value === void 0 ? void 0 : value.split(",").map((item) => item.trim()).filter(Boolean)) !== null && _a !== void 0 ? _a : [];
};
exports.appConfig = {
    app: {
        mode,
        port: numberFromEnv(process.env.APP_PORT, 5010),
        app_host: process.env.APP_HOST,
        jwt_secret: requiredFromEnv("JWT_SECRET"),
        secretKey: requiredFromEnv("SECRET_KEY"),
        clientUrl: requiredFromEnv("CLIENT_URL"),
        allowedOrigins: csvFromEnv(process.env.ALLOWED_ORIGINS),
        trustedProxies: csvFromEnv(process.env.TRUSTED_PROXIES),
        bodyLimit: process.env.REQUEST_BODY_LIMIT || "100kb",
        cookieName: process.env.AUTH_COOKIE_NAME || "rentaa_session",
        cookieSameSite: process.env.AUTH_COOKIE_SAME_SITE || "strict",
        loginTokenTtl: process.env.LOGIN_TOKEN_TTL || "15m",
        refreshTokenTtlDays: numberFromEnv(process.env.REFRESH_TOKEN_TTL_DAYS, 7),
        authCookieMaxAgeMs: numberFromEnv(process.env.AUTH_COOKIE_MAX_AGE_MS, 60 * 60 * 1000),
        authRateLimitWindowMs: numberFromEnv(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
        authRateLimitMax: numberFromEnv(process.env.AUTH_RATE_LIMIT_MAX, 30),
        adminRateLimitWindowMs: numberFromEnv(process.env.ADMIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
        adminRateLimitMax: numberFromEnv(process.env.ADMIN_RATE_LIMIT_MAX, 60),
        globalRateLimitWindowMs: numberFromEnv(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS, 60 * 1000),
        globalRateLimitMax: numberFromEnv(process.env.GLOBAL_RATE_LIMIT_MAX, 3000),
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
        publicPropertyTtlSeconds: numberFromEnv(process.env.REDIS_PUBLIC_PROPERTY_TTL_SECONDS, 120),
        privateResourceTtlSeconds: numberFromEnv(process.env.REDIS_PRIVATE_RESOURCE_TTL_SECONDS, 30),
    },
    db: {
        db_name: process.env.POSTGRES_DB,
        db_user: process.env.POSTGRES_USER,
        db_password: process.env.POSTGRES_PASSWORD,
        db_host: process.env.POSTGRES_HOST,
        db_port: numberFromEnv(process.env.POSTGRES_PORT, 5432),
    },
    smtp: {
        secure: process.env.SMTP_SECURE === "true",
        requireTls: process.env.SMTP_REQUIRE_TLS === "true",
        authEnabled: process.env.SMTP_AUTH_ENABLED !== "false",
        host: requiredFromEnv("SMTP_HOST"),
        port: Number(process.env.SMTP_PORT),
        user: requiredFromEnv("SMTP_EMAIL"),
        password: requiredFromEnv("SMTP_PASSWORD"),
        fromName: requiredFromEnv("SMTP_FROM_NAME"),
    },
};
