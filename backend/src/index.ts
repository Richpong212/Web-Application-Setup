import express from "express";
import { Request, Response } from "express";
import Memcached from "memcached";
import { appConfig } from "./config/index.config";
import morgan from "morgan";
import cors from "cors";
import { logger } from "./utils/logger.utils";
import { connectDb } from "./config/connectDb";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import userRouter from "./routes/user.route";

const app = express();
const port = appConfig.app.port;

//rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

//middlewares
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
    },
  }),
);
app.use(limiter);
app.use(compression()); // compress response for speed

const memcached = new Memcached(
  `${appConfig.app.memcached_host}:${appConfig.app.memcached_port}`,
);

//routes
// health check endpoint (keep only one)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Server is healthy" });
});

// cachinng endpoint
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

//User routes
app.use("/api/v1/users", userRouter);

app.listen(port, async () => {
  logger.info(
    `Server is running on http://${appConfig.app.app_host}:${port} in ${appConfig.app.mode} mode`,
  );

  await connectDb();
});

// Handle invalid routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
