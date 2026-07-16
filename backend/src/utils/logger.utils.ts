import winston from "winston";

const consoleFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} ${level} ${message}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.colorize({
        level: true,
      }),
      consoleFormat,
    ),
  }),
];

// Local development only
if (process.env.NODE_ENV === "local") {
  transports.push(
    new winston.transports.File({
      filename: "logs/app.log",
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
}

export const logger = winston.createLogger({
  level: "info",
  transports,
});
