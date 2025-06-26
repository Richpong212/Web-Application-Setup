import { Sequelize } from "sequelize";
import { appConfig } from "./index.config";
import { logger } from "../utils/logger.utils";
import path from "path";
import fs from "fs";

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
  }
);

export const connectDb = async () => {
  try {
    await db.authenticate();
    logger.info("Database connection has been established successfully.");

    // Dynamically load models from the appropriate directory
    const modelPath = path.join(__dirname, "../models");
    // eslint-disable-next-line no-sync
    const modelFiles = fs.readdirSync(modelPath);

    modelFiles.forEach((file) => {
      if (file.endsWith(".js") || file.endsWith(".ts")) {
        const filePath = path.join(modelPath, file);

        // For TypeScript, handle files dynamically using require
        if (file.endsWith(".ts")) {
          const model = require(filePath).default;
          if (model) {
            db.models[model.name] = model;
          } else {
            logger.error(`Unable to load TypeScript model from file: ${file}`);
          }
        }

        // For JavaScript, load normally
        if (file.endsWith(".js")) {
          const model = require(filePath).default;
          if (model) {
            db.models[model.name] = model;
          } else {
            logger.error(`Unable to load JavaScript model from file: ${file}`);
          }
        }
      }
    });

    // Sync all models
    await db.sync({ alter: true, force: false });
    logger.info("All models have been synchronized successfully.");
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
  }
};
