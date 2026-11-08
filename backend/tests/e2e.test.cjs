const { serve } = require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../build/app");
const { connectDb, db } = require("../build/config/connectDb");
const { connectRedis, redis } = require("../build/config/redis");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");

test(
  "HTTP with real PostgreSQL and authenticated Redis: cache miss/hit/TTL and outages",
  { timeout: 20000 },
  async () => {
    try {
      await Promise.all([connectDb(), connectRedis()]);
      await serve(createApp(), async (url) => {
        assert.equal((await fetch(`${url}/health/ready`)).status, 200);
        await redis.del("greeting");
        const first = await (await fetch(url)).json();
        assert.deepEqual(first, {
          cached: false,
          message: "Hello from the backend!",
        });
        assert.deepEqual(await (await fetch(url)).json(), {
          ...first,
          cached: true,
        });
        assert.ok((await redis.ttl("greeting")) > 0);
        await delay(1100);
        assert.equal((await (await fetch(url)).json()).cached, false);
        redis.disconnect();
        assert.equal((await fetch(`${url}/health/ready`)).status, 503);
        assert.equal((await fetch(url)).status, 503);
        assert.equal((await fetch(`${url}/health/live`)).status, 200);
        await connectRedis();
        assert.equal((await fetch(`${url}/health/ready`)).status, 200);
        await db.close();
        const down = await fetch(`${url}/health/ready`);
        assert.equal(down.status, 503);
        assert.equal((await down.json()).checks.postgres, "down");
        assert.equal((await fetch(`${url}/health/live`)).status, 200);
      });
    } finally {
      if (redis.status === "ready") {
        await redis.del("greeting");
        await redis.quit();
      } else redis.disconnect();
      await db.close();
    }
  },
);

test(
  "server process starts with dependencies and exits cleanly on SIGTERM",
  { timeout: 15000 },
  async () => {
    const child = spawn(process.execPath, ["build/index.js"], {
      env: { ...process.env, APP_PORT: "15019", APP_HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (data) => {
      output += data;
    });
    child.stderr.on("data", (data) => {
      output += data;
    });
    const exited = new Promise((resolve) =>
      child.once("exit", (code) => resolve(code)),
    );
    try {
      let ready = false;
      for (let i = 0; i < 50; i++) {
        try {
          ready =
            (await fetch("http://127.0.0.1:15019/health/ready")).status === 200;
        } catch {
          /* starting */
        }
        if (ready || child.exitCode !== null) break;
        await delay(100);
      }
      assert.ok(ready, output);
      child.kill("SIGTERM");
      assert.equal(await exited, 0, output);
    } finally {
      if (child.exitCode === null) child.kill("SIGKILL");
    }
  },
);
