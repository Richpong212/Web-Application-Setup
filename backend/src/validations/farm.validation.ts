import { body, param, query } from "express-validator";

const farmFields = (partial: boolean) => {
  const text = (field: string, label: string, max: number, required = true) => {
    let rule = body(field);
    if (partial || !required) rule = rule.optional();
    return rule
      .isString()
      .withMessage(`${label} must be text`)
      .bail()
      .trim()
      .isLength({ min: required ? 1 : 0, max })
      .withMessage(
        `${label} must contain ${required ? "1" : "0"} to ${max} characters`,
      );
  };

  const houses = partial ? body("houses").optional() : body("houses");

  return [
    text("name", "Farm name", 100),
    text("country", "Country", 100),
    text("location", "Location", 200),
    text("type", "Farm type", 50),
    text("description", "Description", 2000, false),
    houses
      .isArray({ min: partial ? 0 : 1, max: 50 })
      .withMessage(
        partial
          ? "Use at most 50 house names"
          : "Add at least one house when creating a farm (up to 50)",
      )
      .bail()
      .custom((values: unknown[]) =>
        values.every(
          (value) =>
            typeof value === "string" &&
            value.trim().length > 0 &&
            value.trim().length <= 100,
        ),
      )
      .withMessage("House names must contain 1 to 100 characters")
      .bail()
      .customSanitizer((values: string[]) =>
        values.map((value) => value.trim()),
      )
      .custom(
        (values: string[]) =>
          new Set(values.map((value) => value.toLowerCase())).size ===
          values.length,
      )
      .withMessage("House names must be unique"),
    // Ownership and permissions can never be supplied by the caller.
    body()
      .custom((value) => {
        const allowed = [
          "name",
          "country",
          "location",
          "type",
          "description",
          "houses",
        ];
        return (
          value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          Object.keys(value).every((key) => allowed.includes(key)) &&
          (!partial || Object.keys(value).length > 0)
        );
      })
      .withMessage("Provide only farm profile fields"),
  ];
};

export const createFarmValidation = farmFields(false);
export const updateFarmValidation = farmFields(true);
export const farmIdValidation = [
  param("farmId").isUUID().withMessage("Invalid farm reference"),
];
export const listFarmsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage("Invalid page number")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be between 1 and 100")
    .toInt(),
];

export const addHouseValidation = [
  body("name")
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Enter a house name with 1 to 100 characters"),
  body()
    .custom(
      (value) =>
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).every((key) => key === "name"),
    )
    .withMessage("Provide only the house name"),
];
