import { body } from "express-validator";

// Normalize emails consistently without changing providers' address semantics.
const emailField = () =>
  body("email")
    .isString()
    .withMessage("Email is required")
    .bail()
    .trim()
    .toLowerCase()
    .isLength({ max: 254 })
    .withMessage("Email is too long")
    .isEmail()
    .withMessage("Invalid email");

// Passwords must be hashed exactly as entered: never trim or HTML-escape them.
const passwordField = () =>
  body("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters long")
    .isStrongPassword()
    .withMessage(
      "Password must contain lowercase, uppercase, a number and a symbol",
    )
    .custom((value: string) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Password must not exceed 72 bytes");

const nameField = () =>
  body("name")
    .isString()
    .withMessage("Name is required")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must contain 1 to 100 characters");

const tokenField = () =>
  body("token")
    .isString()
    .bail()
    .matches(/^[a-f0-9]{64}$/)
    .withMessage("Invalid token");

export const registrationValidation = [
  nameField(),
  emailField(),
  passwordField(),
];

export const loginValidation = [
  emailField(),
  body("password")
    .isString()
    .bail()
    .notEmpty()
    .withMessage("Password is required")
    .custom((value: string) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Password must not exceed 72 bytes"),
];

export const emailValidation = [emailField()];
export const tokenValidation = [tokenField()];
export const resetPasswordValidation = [tokenField(), passwordField()];

// Email changes need a separate verification flow. Profile updates only allow name.
export const updateUserValidation = [nameField()];
