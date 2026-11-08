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
  },
);

export const connectDb = async () => {
  try {
    logger.info("[DATABASE] Connecting to PostgreSQL...");

    await db.authenticate();

    logger.info(
      `[DATABASE] Connected to PostgreSQL (${appConfig.db.db_host}:${appConfig.db.db_port})`,
    );

    logger.info("[MODELS] Loading Sequelize models...");

    const modelPath = path.join(__dirname, "../models");

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

          logger.info(`[MODELS] Loaded model: ${model.name}`);
        } else {
          logger.warn(`[MODELS] No default export found in ${file}`);
        }
      } catch (err) {
        logger.error(`[MODELS] Failed loading model: ${file}`);
        logger.error(err);
      }
    });

    logger.info(`[MODELS] Total models loaded: ${loadedModels}`);

    logger.info("[DATABASE] Synchronizing database schema...");

    await db.sync({
      alter: true,
      force: false,
    });

    logger.info("[DATABASE] Database synchronized successfully");
  } catch (error) {
    logger.error("[DATABASE] Unable to connect to the database");
    logger.error(error);
  }
};
