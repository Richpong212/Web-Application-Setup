import nodemailer from "nodemailer";
import { appConfig } from "../config/index.config";
import { logger } from "./logger.utils";

interface IEmail {
  email: string;
  subject: string;
  html?: string;
  text?: string;
  name?: string;
}

export const connectSMTPAccount = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: appConfig.smtp.host,
      port: Number(appConfig.smtp.port),
      secure: appConfig.smtp.secure,
      requireTLS: appConfig.smtp.requireTls,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      auth: appConfig.smtp.authEnabled
        ? {
            user: appConfig.smtp.user,
            pass: appConfig.smtp.password,
          }
        : undefined,
    });

    return transporter;
  } catch (error) {
    void error;
    throw new Error("Email transport initialization failed");
  }
};

export const sendEmail = async (emailData: IEmail) => {
  try {
    const transporter = await connectSMTPAccount();
    const mailOptions = {
      from: appConfig.smtp.user,
      to: emailData.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };
    const info = await transporter.sendMail(mailOptions);
    logger.info("[SMTP] Message delivered");

    return { message: "Email sent", info };
  } catch (error) {
    const failure = error as {
      name?: string;
      code?: string;
      responseCode?: number;
      command?: string;
    };
    logger.error("[SMTP] Delivery failed", {
      errorName: failure.name,
      errorCode: failure.code,
      responseCode: failure.responseCode,
      command: failure.command,
    });
    throw new Error("Email delivery failed");
  }
};
