"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.connectSMTPAccount = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const index_config_1 = require("../config/index.config");
const logger_utils_1 = require("./logger.utils");
const connectSMTPAccount = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: index_config_1.appConfig.smtp.host,
            port: Number(index_config_1.appConfig.smtp.port),
            secure: index_config_1.appConfig.smtp.secure,
            requireTLS: index_config_1.appConfig.smtp.requireTls,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            auth: index_config_1.appConfig.smtp.authEnabled
                ? {
                    user: index_config_1.appConfig.smtp.user,
                    pass: index_config_1.appConfig.smtp.password,
                }
                : undefined,
        });
        return transporter;
    }
    catch (error) {
        void error;
        throw new Error("Email transport initialization failed");
    }
});
exports.connectSMTPAccount = connectSMTPAccount;
const sendEmail = (emailData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transporter = yield (0, exports.connectSMTPAccount)();
        const mailOptions = {
            from: index_config_1.appConfig.smtp.user,
            to: emailData.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
        };
        const info = yield transporter.sendMail(mailOptions);
        logger_utils_1.logger.info("[SMTP] Message delivered");
        return { message: "Email sent", info };
    }
    catch (error) {
        const failure = error;
        logger_utils_1.logger.error("[SMTP] Delivery failed", {
            errorName: failure.name,
            errorCode: failure.code,
            responseCode: failure.responseCode,
            command: failure.command,
        });
        throw new Error("Email delivery failed");
    }
});
exports.sendEmail = sendEmail;
