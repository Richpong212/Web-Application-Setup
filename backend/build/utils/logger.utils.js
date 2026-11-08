"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const consoleFormat = winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} ${level} ${message}${stack ? `\n${stack}` : ""}`;
});
const transports = [
    new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }), winston_1.default.format.colorize({
            level: true,
        }), consoleFormat),
    }),
];
// Local development only
if (process.env.NODE_ENV === "local") {
    transports.push(new winston_1.default.transports.File({
        filename: "logs/app.log",
        level: process.env.LOG_LEVEL || "info",
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    }));
}
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston_1.default.format.combine(winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat()),
    transports,
});
