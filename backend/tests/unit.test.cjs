const { serve } = require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../build/app");
const healthy = () => ({
  database: { authenticate: async () => {} },
  cache: {
    ping: async () => "PONG",
    get: async () => null,
    set: async () => "OK",
  },
  cacheEnabled: true,
});

test("health probes report dependencies and bypass traffic limits", async () => {
  await serve(createApp(healthy()), async (url) => {
    for (let i = 0; i < 105; i++)
      assert.equal((await fetch(`${url}/health/live`)).status, 200);
    const ready = await fetch(`${url}/health/ready`);
    assert.equal(ready.status, 200);
    assert.equal(ready.headers.get("cache-control"), "no-store");
    assert.deepEqual((await ready.json()).checks, {
      postgres: "up",
      redis: "up",
    });
  });
});
for (const dependency of ["postgres", "redis"]) {
  test(`${dependency} failure fails readiness but preserves liveness`, async () => {
    const deps = healthy();
    const fail = async () => {
      throw new Error("private connection credentials");
    };
    if (dependency === "postgres") deps.database.authenticate = fail;
    else deps.cache.ping = fail;
    await serve(createApp(deps), async (url) => {
      const response = await fetch(`${url}/health`);
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.checks[dependency], "down");
      assert.ok(!JSON.stringify(body).includes("credentials"));
      assert.equal((await fetch(`${url}/health/live`)).status, 200);
    });
  });
}
test("readiness bounds stalled dependency checks", async () => {
  const deps = healthy();
  deps.database.authenticate = () => new Promise(() => {});
  await serve(createApp(deps), async (url) => {
    const response = await fetch(`${url}/health/ready`, {
      signal: AbortSignal.timeout(2500),
    });
    assert.equal(response.status, 503);
  });
});
test("disabled cache, shutdown, validation, malformed bodies and unknown routes", async () => {
  const deps = healthy();
  deps.cacheEnabled = false;
  deps.cache.ping = async () => {
    throw new Error("must not call");
  };
  const app = createApp(deps);
  await serve(app, async (url) => {
    assert.equal(
      (await (await fetch(`${url}/health`)).json()).checks.redis,
      "disabled",
    );
    assert.equal((await fetch(url)).status, 200);
    app.locals.shuttingDown = true;
    assert.equal((await fetch(`${url}/health/ready`)).status, 503);
    assert.equal((await fetch(`${url}/missing`)).status, 404);
    assert.equal(
      (
        await fetch(`${url}/api/v1/users/signup`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(`${url}/api/v1/users/signup`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        })
      ).status,
      400,
    );
  });
});
test("cache errors produce a controlled service unavailable response", async () => {
  const deps = healthy();
  deps.cache.get = async () => {
    throw new Error("offline");
  };
  await serve(createApp(deps), async (url) =>
    assert.equal((await fetch(url)).status, 503),
  );
});
