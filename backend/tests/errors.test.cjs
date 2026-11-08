const { serve } = require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { createApp } = require("../build/app");
const { handleError } = require("../build/middleware/error.middleware");
const { logger } = require("../build/utils/logger.utils");
const { appConfig } = require("../build/config/index.config");
const { HttpError } = require("../build/utils/httpError");
const { errors } = require("../build/utils/errors");

const dependencies = {
  database: { authenticate: async () => {} },
  cache: {
    ping: async () => "PONG",
    get: async () => null,
    set: async () => "OK",
  },
  cacheEnabled: false,
};

const expectErrorResponse = async (
  response,
  code,
  message = errors[code].message,
) => {
  const body = await response.json();
  assert.equal(response.status, errors[code].status);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-request-id"), null);
  assert.deepEqual(body, { message });
  return body;
};

test("unexpected exceptions and diagnostic logs do not serialize SQL, credentials or tokens", async (context) => {
  const error = Object.assign(
    new Error("SQL failure\nSELECT password=TOP_SECRET FROM users"),
    {
      sql: "INSERT SECRET_SQL",
      parameters: ["TOP_SECRET"],
      original: { code: "42703", password: "TOP_SECRET" },
    },
  );
  const log = context.mock.method(logger, "error", () => {});
  const app = express();
  app.get("/failure", () => {
    throw error;
  });
  app.get("/expected", () => {
    const failure = new HttpError("SESSION_EXPIRED");
    failure.message = "INTERNAL_TOKEN should not be exposed";
    throw failure;
  });
  app.use(handleError);

  await serve(app, async (url) => {
    const problem = await expectErrorResponse(
      await fetch(`${url}/failure`),
      "INTERNAL_ERROR",
    );
    assert.ok(!JSON.stringify(problem).includes("TOP_SECRET"));
    const logs = JSON.stringify(log.mock.calls.map((call) => call.arguments));
    assert.ok(!logs.includes("TOP_SECRET"));
    assert.ok(!logs.includes("SECRET_SQL"));
    assert.ok(logs.includes("42703"));
    const expected = await expectErrorResponse(
      await fetch(`${url}/expected`),
      "SESSION_EXPIRED",
    );
    assert.ok(!JSON.stringify(expected).includes("INTERNAL_TOKEN"));
  });
});

test("validation, parser, payload, forbidden-origin and missing-route errors return only a safe message", async () => {
  await serve(createApp(dependencies), async (url) => {
    const post = (body, headers = {}) =>
      fetch(`${url}/api/v1/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body,
      });
    const validation = await expectErrorResponse(
      await post(
        JSON.stringify({
          name: "",
          email: "PRIVATE_INVALID_EMAIL",
          password: "PRIVATE_PASSWORD",
        }),
      ),
      "VALIDATION_ERROR",
      "Name must contain 1 to 100 characters",
    );
    assert.ok(!JSON.stringify(validation).includes("PRIVATE_"));
    await expectErrorResponse(
      await post('{"password":"PRIVATE_PASSWORD"'),
      "INVALID_REQUEST",
    );
    await expectErrorResponse(
      await post(JSON.stringify({ password: "a".repeat(105000) })),
      "PAYLOAD_TOO_LARGE",
    );
    const forbidden = await expectErrorResponse(
      await post("{}", { origin: "https://untrusted.test" }),
      "REQUEST_NOT_ALLOWED",
    );
    assert.ok(!JSON.stringify(forbidden).includes("origin"));
    assert.ok(!JSON.stringify(forbidden).includes("localhost"));
    await expectErrorResponse(
      await fetch(`${url}/missing?token=PRIVATE_TOKEN`),
      "NOT_FOUND",
    );
  });
});

test("rate limits return a simple message and a Retry-After header", async () => {
  const originalLimit = appConfig.app.globalRateLimitMax;
  appConfig.app.globalRateLimitMax = 1;
  const app = createApp(dependencies);
  appConfig.app.globalRateLimitMax = originalLimit;
  await serve(app, async (url) => {
    await fetch(`${url}/missing`);
    const response = await fetch(`${url}/missing`);
    assert.ok(Number(response.headers.get("retry-after")) > 0);
    await expectErrorResponse(response, "RATE_LIMITED");
    assert.equal((await fetch(`${url}/health/live`)).status, 200);
  });
});

test("successful logins do not consume the failed-login budget", async () => {
  const { loginLimiter } = require("../build/routes/auth.route");
  loginLimiter.resetKey("127.0.0.1");
  const app = express();
  app.post("/login", loginLimiter, (_req, res) => res.sendStatus(200));
  await serve(app, async (url) => {
    for (let index = 0; index < appConfig.app.authRateLimitMax + 2; index++) {
      assert.equal((await fetch(`${url}/login`, { method: "POST" })).status, 200);
    }
  });
});

test("session routes do not spend the sensitive-action budget", async () => {
  const app = createApp(dependencies);
  await serve(app, async (url) => {
    for (let index = 0; index < appConfig.app.authRateLimitMax + 2; index++) {
      const response = await fetch(`${url}/api/v1/auth/refresh`, { method: "POST" });
      assert.notEqual(response.status, 429);
    }
    const response = await fetch(`${url}/api/v1/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    assert.equal(response.status, 400);
  });
});

test("repeated failed logins still receive a temporary limit", async () => {
  const { loginLimiter } = require("../build/routes/auth.route");
  loginLimiter.resetKey("127.0.0.1");
  const app = express();
  app.post("/login", loginLimiter, (_req, res) => res.sendStatus(401));
  await serve(app, async (url) => {
    for (let index = 0; index < appConfig.app.authRateLimitMax; index++) {
      assert.equal((await fetch(`${url}/login`, { method: "POST" })).status, 401);
    }
    const response = await fetch(`${url}/login`, { method: "POST" });
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get("retry-after")) > 0);
  });
});
