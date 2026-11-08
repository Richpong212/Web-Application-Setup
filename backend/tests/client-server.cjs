// Test-only HTTP/SMTP harness. It always uses the disposable test database.
require("./setup.cjs");
process.env.CLIENT_URL = "http://localhost:3104";
process.env.ALLOWED_ORIGINS = "http://localhost:3104";
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.GLOBAL_RATE_LIMIT_MAX = "2000";
const assert = require("node:assert/strict");
const express = require("express");
const { Op } = require("sequelize");
const { createApp } = require("../build/app");
const { db, connectDb } = require("../build/config/connectDb");
const { redis, connectRedis } = require("../build/config/redis");
const { runMigrations } = require("../build/database/migrate");
const { User, PendingSignup } = require("../build/models");
const { createInbox } = require("./smtp.cjs");

const start = async () => {
  assert.equal(process.env.NODE_ENV, "test");
  assert.equal(db.getDatabaseName(), "backend_test");
  await runMigrations();
  await Promise.all([connectDb(), connectRedis()]);
  const inbox = await createInbox();
  const app = express();

  // This endpoint exists only in this test harness, never in the application.
  app.get("/__test/messages", (_req, res) => res.json(inbox.messages));
  app.use(createApp());
  const server = app.listen(15029, "127.0.0.1");

  const shutdown = () => {
    server.close(() => {
      void (async () => {
        await User.destroy({
          where: { email: { [Op.like]: "browser-%@rp-ranch.test" } },
        });
        await PendingSignup.destroy({
          where: { email: { [Op.like]: "browser-%@rp-ranch.test" } },
        });
        await inbox.close();
        await Promise.all([db.close(), redis.quit()]);
      })().catch((error) => {
        process.stderr.write(String(error));
        process.exitCode = 1;
      });
    });
    server.closeAllConnections();
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
};

void start().catch(async (error) => {
  process.stderr.write(String(error));
  redis.disconnect();
  await db.close();
  process.exitCode = 1;
});
