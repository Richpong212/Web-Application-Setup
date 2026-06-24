import winston from "winston";
import chalk from "chalk";

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  let coloredLevel = level;

  switch (level) {
    case "error":
      coloredLevel = chalk.red.bold(level.toUpperCase());
      break;
    case "warn":
      coloredLevel = chalk.yellow.bold(level.toUpperCase());
      break;
    case "info":
      coloredLevel = chalk.green.bold(level.toUpperCase());
      break;
    case "debug":
      coloredLevel = chalk.blue.bold(level.toUpperCase());
      break;
    default:
      coloredLevel = chalk.white(level.toUpperCase());
  }

  return `${chalk.gray(timestamp)} ${coloredLevel} ${message}`;
});

export const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        customFormat,
      ),
    }),
    new winston.transports.File({
      filename: "logs/app.log",
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
