import { Sequelize } from "sequelize";
import { appConfig } from "./index.config";
import { logger } from "../utils/logger.utils";
import path from "path";
import fs from "fs";
import chalk from "chalk";

export const db = new Sequelize(
  appConfig.db.db_name!,
  appConfig.db.db_user!,
  appConfig.db.db_password!,
  {
    host: appConfig.db.db_host,
    port: appConfig.db.db_port,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

export const connectDb = async () => {
  try {
    logger.info(chalk.cyan("🔌 Connecting to PostgreSQL..."));

    await db.authenticate();

    logger.info(
      chalk.green(
        `✅ Connected to PostgreSQL (${appConfig.db.db_host}:${appConfig.db.db_port})`,
      ),
    );

    logger.info(chalk.yellow("📦 Loading Sequelize models..."));

    const modelPath = path.join(__dirname, "../models");

    // Use the async fs API to avoid synchronous filesystem calls which can
    // trigger linter errors about unexpected sync methods.
    const allFiles = await fs.promises.readdir(modelPath);
    const modelFiles = allFiles.filter(
      (file) => file.endsWith(".js") || file.endsWith(".ts"),
    );

    let loadedModels = 0;

    modelFiles.forEach((file) => {
      try {
        const filePath = path.join(modelPath, file);

        const model = require(filePath).default;

        if (model) {
          db.models[model.name] = model;
          loadedModels++;

          logger.info(chalk.green(`   ✓ Loaded model: ${model.name}`));
        } else {
          logger.warn(chalk.yellow(`   ⚠️ No default export found in ${file}`));
        }
      } catch (err) {
        logger.error(chalk.red(`   ❌ Failed loading model: ${file}`));

        logger.error(err);
      }
    });

    logger.info(chalk.blue(`📊 Total models loaded: ${loadedModels}`));

    logger.info(chalk.magenta("🔄 Synchronizing database schema..."));

    await db.sync({
      alter: true,
      force: false,
    });

    logger.info(chalk.green.bold("🚀 Database synchronized successfully"));
  } catch (error) {
    logger.error(chalk.red.bold("❌ Unable to connect to the database"));

    logger.error(error);
  }
};
