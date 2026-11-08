import { QueryTypes } from "sequelize";

import { db } from "../config/connectDb";
import { logger } from "../utils/logger.utils";
import * as createAuthentication from "../migrations/002-create-authentication";
import * as pendingSignups from "../migrations/003-pending-signups";
import * as createFarms from "../migrations/004-create-farms";
import * as teamAndOperations from "../migrations/005-team-and-operations";
import * as createUsers from "../migrations/001-create-users";

// Add migrations here in order. Applied migrations must never be edited.
const migrations = [
  { name: "001-create-users", ...createUsers },
  { name: "002-create-authentication", ...createAuthentication },
  { name: "003-pending-signups", ...pendingSignups },
  { name: "004-create-farms", ...createFarms },
  { name: "005-team-and-operations", ...teamAndOperations },
];

export const runMigrations = async (direction: "up" | "down" = "up") => {
  await db.transaction(async (transaction) => {
    // Only one deployment may change the schema at a time.
    await db.query("SELECT pg_advisory_xact_lock(73519001)", { transaction });

    await db.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())',
      { transaction },
    );

    const appliedMigrations = await db.query<{ name: string }>(
      "SELECT name FROM schema_migrations ORDER BY name",
      { type: QueryTypes.SELECT, transaction },
    );

    const appliedNames = appliedMigrations.map((migration) => migration.name);
    const unknownMigration = appliedNames.find((name) => {
      return !migrations.some((migration) => migration.name === name);
    });

    if (unknownMigration) {
      throw new Error(`Unknown applied migration: ${unknownMigration}`);
    }

    const queryInterface = db.getQueryInterface();

    if (direction === "down") {
      const lastMigrationName = appliedNames[appliedNames.length - 1];
      const migration = migrations.find(
        (item) => item.name === lastMigrationName,
      );

      if (!lastMigrationName) {
        logger.info("[MIGRATIONS] Nothing to roll back");
        return;
      }

      if (!migration) {
        throw new Error(`Unknown applied migration: ${lastMigrationName}`);
      }

      await migration.down(queryInterface, transaction);
      await db.query("DELETE FROM schema_migrations WHERE name = :name", {
        replacements: { name: migration.name },
        transaction,
      });

      logger.info(`[MIGRATIONS] Rolling back ${migration.name}`);
      return;
    }

    for (const migration of migrations) {
      if (appliedNames.includes(migration.name)) {
        continue;
      }

      logger.info(`[MIGRATIONS] Applying ${migration.name}`);
      await migration.up(queryInterface, transaction);
      await db.query("INSERT INTO schema_migrations (name) VALUES (:name)", {
        replacements: { name: migration.name },
        transaction,
      });
    }
  });

  logger.info("[MIGRATIONS] Transaction committed; schema is up to date");
};

// Importing the runner from tests does not execute migrations or close their pool.
if (require.main === module) {
  const direction = process.argv[2];

  const migrate = async () => {
    try {
      if (direction && direction !== "up" && direction !== "down") {
        throw new Error("Migration direction must be up or down");
      }

      await runMigrations(direction === "down" ? "down" : "up");
    } catch (error) {
      logger.error("[MIGRATIONS] Failed; schema changes rolled back", error);
      process.exitCode = 1;
    } finally {
      await db.close();
    }
  };

  void migrate();
}
