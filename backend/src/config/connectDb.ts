import { Sequelize } from "sequelize";
import { appConfig } from "./index.config";
import { logger } from "../utils/logger.utils";

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

// Models register themselves when imported by the application routes.
export const connectDb = async () => {
  logger.info(
    `[DATABASE] Connecting to PostgreSQL at ${appConfig.db.db_host}:${appConfig.db.db_port}`,
  );
  await db.authenticate();
  logger.info("[DATABASE] Connected to PostgreSQL");
  const models = Object.keys(db.models);
  for (const model of models)
    logger.info(`[MODELS] Registered model: ${model}`);
  logger.info(`[MODELS] Total registered models: ${models.length}`);
  logger.info("[DATABASE] Schema managed by migrations (yarn db:migrate)");
};
