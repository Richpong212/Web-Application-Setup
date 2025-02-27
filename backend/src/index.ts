import express from "express";
import { Request, Response } from "express";
import Memcached from "memcached";
import { appConfig } from "./config/index.config";
import morgan from "morgan";
import cors from "cors";
import { logger } from "./utils/logger.utils";

const app = express();
const port = appConfig.app.port;

//middlewares
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const memcached = new Memcached(
  `${appConfig.app.memcached_host}:${appConfig.app.memcached_port}`
);

app.get("/", (req: Request, res: Response) => {
  const cacheKey = "testkey";
  memcached.get(cacheKey, (err, data) => {
    if (err) {
      logger.error("Error retrieving from cache:", err);
      return res.status(500).json({ error: "Error retrieving from cache" });
    }
    if (data) {
      logger.info("Data retrieved from cache:", data);
      return res.status(200).json({ cached: true, message: "data from cache" });
    } else {
      const message = "Hello from the backend!";
      memcached.set(cacheKey, message, 10, (err) => {
        if (err) {
          logger.error("Error saving to cache:", err);
          return res.status(500).json({ error: "Error saving to cache" });
        }
        return res.status(200).json({ cached: false, message });
      });
    }
  });
});

app.listen(port, () => {
  logger.info(
    `Server is running on http://${appConfig.app.app_host}:${port} in ${appConfig.app.mode} mode`
  );
});

export default app;
