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
      secure: false,
      auth: {
        user: appConfig.smtp.user,
        pass: appConfig.smtp.password,
      },
    });

    return transporter;
  } catch (error) {
    throw new Error(`Failed to connect to SMTP server: ${error}`);
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
    const info = transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${emailData.email}`);

    return { message: "Email sent", info };
  } catch (error) {
    logger.error(`Error sending email: ${error}`);
    throw new Error(`Failed to send email: ${error}`);
  }
};
