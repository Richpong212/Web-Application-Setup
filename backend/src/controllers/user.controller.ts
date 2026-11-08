import { Request, Response } from "express";
import { logger } from "../utils/logger.utils";
import { hashPassword } from "../utils/passwordHashing";
import User from "../models/user.model";
import { genToken } from "../utils/token";
import { clientVerificationEmail } from "../services/VerificationEmail.template";
import { sendEmail } from "../utils/sendEmail";

// Create a new user
export const createUser: any = async (req: Request, res: Response) => {
  try {
    // Extract user data from request body
    const userData = req.body;

    //hash the password
    const hashedPassword = await hashPassword(userData.password);

    //check if the user already exists
    const existingUser = await User.findOne({
      where: {
        email: userData.email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    //data to be saved
    const newUser = {
      ...userData,
      password: hashedPassword,
    };

    // generate token
    const token = genToken({ newUser }, "1h");

    //prepare email data
    const emailData = {
      email: newUser.email,
      subject: "Verify your account",
      html: clientVerificationEmail(newUser.name, token).html,
    };

    // send verification email
    await sendEmail(emailData);

    // return res.status(201).json
    return res.status(201).json({
      message: "User created successfully",
      data: {
        ...newUser,
        token,
        emailData,
      },
    });
  } catch (error) {
    logger.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
