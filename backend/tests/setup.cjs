// Set these before loading application modules; never read developer credentials.
Object.assign(process.env, {
  NODE_ENV: "test",
  JWT_SECRET: "test-only-jwt-secret",
  SECRET_KEY: "test-only-secret-key",
  CLIENT_URL: "http://localhost:3000",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_AUTH_ENABLED: "false",
  AUTH_RATE_LIMIT_MAX: "100",
  SMTP_EMAIL: "test@localhost",
  SMTP_PASSWORD: "test-only",
  SMTP_FROM_NAME: "Backend tests",
  POSTGRES_HOST: process.env.TEST_POSTGRES_HOST || "127.0.0.1",
  POSTGRES_PORT: process.env.TEST_POSTGRES_PORT || "15432",
  POSTGRES_DB: "backend_test",
  POSTGRES_USER: "backend_test",
  POSTGRES_PASSWORD: "test-only-password",
  REDIS_HOST: process.env.TEST_REDIS_HOST || "127.0.0.1",
  REDIS_PORT: process.env.TEST_REDIS_PORT || "16379",
  REDIS_PASSWORD: "test-only-redis",
  REDIS_CACHE_ENABLED: "true",
  REDIS_CACHE_KEY_PREFIX: `backend:test:${process.pid}`,
  REDIS_DEFAULT_TTL_SECONDS: "1",
});

exports.serve = async (app, run) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
  }
};
