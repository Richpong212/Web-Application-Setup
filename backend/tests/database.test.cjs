require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { Client } = require("pg");
const { compare } = require("bcryptjs");
const run = promisify(execFile);

// Migration rollback and legacy-schema checks use an entirely separate database.
test(
  "migrations apply/rollback atomically and development seeding is repeatable",
  { timeout: 30000 },
  async () => {
    assert.equal(process.env.NODE_ENV, "test");
    assert.equal(process.env.POSTGRES_DB, "backend_test");
    const database = `migration_test_${randomUUID().replace(/-/g, "")}`;
    const connection = {
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    };
    const admin = new Client({ ...connection, database: "backend_test" });
    const client = new Client({ ...connection, database });
    await admin.connect();

    const env = { ...process.env, POSTGRES_DB: database };
    const migrate = (direction = "up") =>
      run(process.execPath, ["build/database/migrate.js", direction], { env });

    try {
      await admin.query(`CREATE DATABASE "${database}"`);
      await client.connect();
      await migrate();
      await migrate();
      assert.equal(
        (await client.query("SELECT COUNT(*) FROM schema_migrations")).rows[0]
          .count,
        "5",
      );

      const seedEnv = {
        ...env,
        SEED_USER_EMAIL: "seed@rp-ranch.test",
        SEED_USER_NAME: "Seed Farmer",
        SEED_USER_PASSWORD: "Seed Password 42!",
      };
      await run(process.execPath, ["build/seeders/user.seed.js"], {
        env: seedEnv,
      });
      await run(process.execPath, ["build/seeders/user.seed.js"], {
        env: seedEnv,
      });
      assert.equal(
        (await client.query("SELECT COUNT(*) FROM users")).rows[0].count,
        "0",
      );
      const pending = await client.query("SELECT * FROM pending_signups");
      assert.equal(pending.rowCount, 1);
      assert.equal(
        await compare(seedEnv.SEED_USER_PASSWORD, pending.rows[0].password),
        true,
      );
      await assert.rejects(
        run(process.execPath, ["build/seeders/user.seed.js"], {
          env: { ...seedEnv, NODE_ENV: "production" },
        }),
      );

      await assert.rejects(
        client.query(
          'INSERT INTO sessions (id, "userId", "refreshTokenHash", "expiresAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW(), NOW())',
          [randomUUID(), randomUUID(), "a".repeat(64)],
        ),
        { code: "23503" },
      );

      await migrate("down");
      await migrate("down");
      assert.equal(
        (await client.query("SELECT to_regclass('farms') AS name")).rows[0]
          .name,
        null,
      );
      await assert.rejects(
        migrate("down"),
        "Rollback must not discard pending signups",
      );
      await client.query("DELETE FROM pending_signups");
      await migrate("down");

      // Upgrade legacy unapproved accounts without losing their approval links.
      const unapprovedId = randomUUID();
      const approvedId = randomUUID();
      await client.query(
        `INSERT INTO users (id, name, email, password, "isAdmin", "isEmailVerified", "createdAt", "updatedAt")
        VALUES ($1, 'Pending', 'pending@rp-ranch.test', 'legacy-hash', false, false, NOW(), NOW()),
               ($2, 'Approved', 'approved@rp-ranch.test', 'verified-hash', false, true, NOW(), NOW())`,
        [unapprovedId, approvedId],
      );
      await client.query(
        `INSERT INTO user_tokens (id, "userId", purpose, "tokenHash", "expiresAt", "createdAt", "updatedAt")
        VALUES ($1, $2, 'verify-email', $3, NOW() + INTERVAL '1 hour', NOW(), NOW())`,
        [randomUUID(), unapprovedId, "b".repeat(64)],
      );
      await migrate();
      assert.equal(
        (
          await client.query("SELECT COUNT(*) FROM users WHERE id = $1", [
            unapprovedId,
          ])
        ).rows[0].count,
        "0",
      );
      assert.equal(
        (
          await client.query("SELECT COUNT(*) FROM users WHERE id = $1", [
            approvedId,
          ])
        ).rows[0].count,
        "1",
      );
      const moved = (
        await client.query("SELECT * FROM pending_signups WHERE id = $1", [
          unapprovedId,
        ])
      ).rows[0];
      assert.equal(moved.password, "legacy-hash");
      assert.equal(moved.tokenHash, "b".repeat(64));
      assert.equal(
        (
          await client.query(
            "SELECT COUNT(*) FROM user_tokens WHERE purpose = 'verify-email'",
          )
        ).rows[0].count,
        "0",
      );
      await client.query("DELETE FROM pending_signups");
      await migrate("down");
      await migrate("down");
      await migrate("down");
      await migrate("down");
      assert.equal(
        (await client.query("SELECT to_regclass('sessions') AS name")).rows[0]
          .name,
        null,
      );
      await migrate("down");
      assert.equal(
        (await client.query("SELECT to_regclass('users') AS name")).rows[0]
          .name,
        null,
      );
      await migrate();
      assert.equal(
        (await client.query("SELECT COUNT(*) FROM schema_migrations")).rows[0]
          .count,
        "5",
      );

      // Existing duplicate data must fail safely; migrations must not delete accounts.
      await migrate("down");
      await migrate("down");
      await migrate("down");
      await migrate("down");
      await migrate("down");
      await client.query(
        'CREATE TABLE users (id UUID PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), password VARCHAR(255), "isAdmin" BOOLEAN, "createdAt" TIMESTAMPTZ, "updatedAt" TIMESTAMPTZ)',
      );
      await client.query(
        "INSERT INTO users (id, email) VALUES ($1, 'DUPLICATE@rp-ranch.test'), ($2, 'duplicate@rp-ranch.test')",
        [randomUUID(), randomUUID()],
      );
      await assert.rejects(migrate());
      assert.equal(
        (await client.query("SELECT COUNT(*) FROM users")).rows[0].count,
        "2",
      );
      assert.equal(
        (await client.query("SELECT COUNT(*) FROM schema_migrations")).rows[0]
          .count,
        "0",
      );
      assert.equal(
        (
          await client.query(
            "SELECT email FROM users WHERE email LIKE 'DUPLICATE%'",
          )
        ).rowCount,
        1,
        "Normalization rolls back on failure",
      );
    } finally {
      await client.end();
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await admin.end();
    }
  },
);
