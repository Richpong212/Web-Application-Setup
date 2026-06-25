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
    jwt_secret: process.env.JWT_SECRET!,
    secretKey: process.env.SECRET_KEY!,
    clientUrl: process.env.CLIENT_URL!,
  },
  db: {
    db_name: process.env.POSTGRES_DB,
    db_user: process.env.POSTGRES_USER,
    db_password: process.env.POSTGRES_PASSWORD,
    db_host: process.env.POSTGRES_HOST,
    db_port: Number(process.env.POSTGRES_PORT),
  },
  smtp: {
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_EMAIL!,
    password: process.env.SMTP_PASSWORD!,
    fromName: process.env.SMTP_FROM_NAME!,
  },
};
