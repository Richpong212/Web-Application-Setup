import { config } from "dotenv";

// APP mode
const mode = process.env.NODE_ENV || "development";

config({ path: `.${mode}.env` });

export const appConfig = {
  app: {
    mode,
    port: process.env.APP_PORT,
    app_host: process.env.APP_HOST,
    memcached_host: process.env.MEMCACHED_HOST,
    memcached_port: process.env.MEMCACHED_PORT,
  },
};
