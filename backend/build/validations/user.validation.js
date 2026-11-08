"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserValidation = exports.resetPasswordValidation = exports.tokenValidation = exports.emailValidation = exports.loginValidation = exports.registrationValidation = void 0;
const express_validator_1 = require("express-validator");
// Normalize emails consistently without changing providers' address semantics.
const emailField = () => (0, express_validator_1.body)("email")
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
const passwordField = () => (0, express_validator_1.body)("password")
    .isString()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 12 })
    .withMessage("Password must be at least 12 characters long")
    .isStrongPassword()
    .withMessage("Password must contain lowercase, uppercase, a number and a symbol")
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Password must not exceed 72 bytes");
const nameField = () => (0, express_validator_1.body)("name")
    .isString()
    .withMessage("Name is required")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must contain 1 to 100 characters");
const tokenField = () => (0, express_validator_1.body)("token")
    .isString()
    .bail()
    .matches(/^[a-f0-9]{64}$/)
    .withMessage("Invalid token");
exports.registrationValidation = [
    nameField(),
    emailField(),
    passwordField(),
];
exports.loginValidation = [
    emailField(),
    (0, express_validator_1.body)("password")
        .isString()
        .bail()
        .notEmpty()
        .withMessage("Password is required")
        .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
        .withMessage("Password must not exceed 72 bytes"),
];
exports.emailValidation = [emailField()];
exports.tokenValidation = [tokenField()];
exports.resetPasswordValidation = [tokenField(), passwordField()];
// Email changes need a separate verification flow. Profile updates only allow name.
exports.updateUserValidation = [nameField()];
