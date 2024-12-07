import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { logger } from "./utils/logger";

const app = express();

//API Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later",
});

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(limiter);
app.use(cors());
app.use(morgan("combined"));

//Base route

//Routes
const port = 3000;

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});

export default app;
