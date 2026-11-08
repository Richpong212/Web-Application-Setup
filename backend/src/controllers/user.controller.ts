import { NextFunction, Request, Response } from "express";

import User from "../models/user.model";
import { registerUser, publicUser } from "../services/auth.service";

// Request signup approval. A user is created only by the approval endpoint.
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await registerUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    res.status(202).json({
      message:
        "If this email is eligible, you will receive an approval link. You can also log in or request a new link.",
      data: { email: result.email },
    });
  } catch (error) {
    return next(error);
  }
};

export const getCurrentUser = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({ data: publicUser(res.locals.user as User) });
  } catch (error) {
    return next(error);
  }
};

export const updateCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = res.locals.user as User;

    await user.update({ name: req.body.name });

    res.json({ message: "Profile updated", data: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};
