import { appConfig } from "../config/index.config";
import { db } from "../config/connectDb";
import { PendingSignup, User } from "../models";
import { hashPassword } from "../utils/passwordHashing";
import { logger } from "../utils/logger.utils";

// Seed a pending request only. Approval is required before any user is created.
const seedUser = async () => {
  try {
    if (appConfig.app.mode === "production") {
      throw new Error("Development seeders cannot run in production");
    }

    const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_USER_PASSWORD;

    if (
      !email ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72 ||
      password.length < 12
    ) {
      throw new Error(
        "Set SEED_USER_EMAIL and SEED_USER_PASSWORD (12 characters minimum, 72 bytes maximum)",
      );
    }

    if (await User.findOne({ where: { email } })) {
      logger.info("[SEEDERS] Approved user already exists; no changes made");
      return;
    }

    const [, created] = await PendingSignup.findOrCreate({
      where: { email },
      defaults: {
        name: process.env.SEED_USER_NAME || "Development User",
        email,
        password: await hashPassword(password),
        tokenHash: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    logger.info(
      created
        ? "[SEEDERS] Pending signup prepared; request an approval email to create the user"
        : "[SEEDERS] Pending signup already exists",
    );
  } catch (error) {
    logger.error("[SEEDERS] Failed to prepare pending signup", error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
};

void seedUser();
