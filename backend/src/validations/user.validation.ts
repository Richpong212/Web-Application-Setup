import { check } from "express-validator";

// Registration validation
export const registrationValidation = [
  check("name").notEmpty().withMessage("Name is required").trim().escape(),
  check("email")
    .isEmail()
    .withMessage("Invalid email")
    .notEmpty()
    .withMessage("Email is required")
    .trim()
    .escape()
    .normalizeEmail()
    .customSanitizer((value) => value.replace(/[^\x20-\x7E]/g, ""))
    .custom(async (value) => {
      // Additional custom checks for commonly abused CVEs
      const invalidPatterns = [
        /(\b(and|or)\b\s*=\s*\b(and|or)\b)/i, // SQL tautology
        /[\^<>()[\]{};'",]/, // Potentially harmful special characters
        /(UNION\s+SELECT)/i, // SQL UNION attack
      ];
      if (invalidPatterns.some((pattern) => pattern.test(value))) {
        throw new Error("Email contains potentially harmful characters");
      }
      const bannedDomains = ["example.com", "mailinator.com", "fakeemail.com"];
      const domain = value.split("@")[1];
      if (bannedDomains.includes(domain)) {
        throw new Error("Email domain is not allowed");
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .isStrongPassword()
    .trim()
    .escape()
    .withMessage(
      "Password must contain at least 1 lowercase, 1 uppercase, 1 number, 1 special character"
    ),
];

// Login validation
export const loginValidation = [
  check("email")
    .isEmail()
    .notEmpty()
    .withMessage("Email is required")
    .trim()
    .escape()
    .normalizeEmail()
    .customSanitizer((value) => value.replace(/[^\x20-\x7E]/g, ""))
    .custom(async (value) => {
      // Additional custom checks for commonly abused CVEs
      const invalidPatterns = [
        /(\b(and|or)\b\s*=\s*\b(and|or)\b)/i, // SQL tautology
        /[\^<>()[\]{};'",]/, // Potentially harmful special characters
        /(UNION\s+SELECT)/i, // SQL UNION attack
      ];
      if (invalidPatterns.some((pattern) => pattern.test(value))) {
        throw new Error("Email contains potentially harmful characters");
      }
      const bannedDomains = ["example.com", "mailinator.com", "fakeemail.com"];
      const domain = value.split("@")[1];
      if (bannedDomains.includes(domain)) {
        throw new Error("Email domain is not allowed");
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .trim()
    .escape(),
];

export const updateUserValidation = [
  check("name").trim().escape(),
  check("email")
    .isEmail()
    .withMessage("Invalid email")
    .trim()
    .escape()
    .normalizeEmail()
    .customSanitizer((value) => value.replace(/[^\x20-\x7E]/g, ""))
    .custom(async (value) => {
      // Additional custom checks for commonly abused CVEs
      const invalidPatterns = [
        /(\b(and|or)\b\s*=\s*\b(and|or)\b)/i, // SQL tautology
        /[\^<>()[\]{};'",]/, // Potentially harmful special characters
        /(UNION\s+SELECT)/i, // SQL UNION attack
      ];
      if (invalidPatterns.some((pattern) => pattern.test(value))) {
        throw new Error("Email contains potentially harmful characters");
      }
      const bannedDomains = ["example.com", "mailinator.com", "fakeemail.com"];
      const domain = value.split("@")[1];
      if (bannedDomains.includes(domain)) {
        throw new Error("Email domain is not allowed");
      }
    }),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .isStrongPassword()
    .trim()
    .escape()
    .withMessage(
      "Password must contain at least 1 lowercase, 1 uppercase, 1 number, 1 special character"
    ),
];
