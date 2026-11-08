import { body } from "express-validator";

export const historyValidation = [
  body("flockId").isUUID().withMessage("Choose a flock"),
  body("fileName")
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Choose a valid file name"),
  body("rows")
    .isArray({ min: 1, max: 2000 })
    .withMessage("Import between 1 and 2,000 daily records at a time"),
  body("rows.*")
    .custom(
      (row) =>
        row &&
        typeof row === "object" &&
        !Array.isArray(row) &&
        Object.keys(row).every((key) =>
          [
            "source",
            "date",
            "mortality",
            "feedKg",
            "eggs",
            "cause",
            "medication",
            "activity",
            "notes",
          ].includes(key),
        ),
    )
    .withMessage("Provide only supported record fields"),
  body("rows.*.source")
    .isString()
    .bail()
    .isLength({ min: 1, max: 150 })
    .withMessage("Include each record's worksheet and row"),
  body("rows.*.date")
    .isString()
    .bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .isISO8601({ strict: true })
    .bail()
    .custom((value) => value <= new Date().toISOString().slice(0, 10))
    .withMessage("Use valid dates that are not in the future"),
  ...["mortality", "eggs"].map((field) =>
    body(`rows.*.${field}`)
      .custom(
        (value) =>
          typeof value === "number" &&
          Number.isInteger(value) &&
          value >= 0 &&
          value <= (field === "eggs" ? 10000000 : 1000000),
      )
      .withMessage("Mortality and eggs must be nonnegative whole numbers"),
  ),
  body("rows.*.feedKg")
    .custom(
      (value) =>
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 1000000 &&
        Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001,
    )
    .withMessage(
      "Feed must be a nonnegative amount in kg with up to three decimal places",
    ),
  ...["cause", "medication", "activity", "notes"].map((field) =>
    body(`rows.*.${field}`)
      .isString()
      .bail()
      .isLength({ max: field === "cause" ? 200 : 2000 })
      .withMessage("Record text is too long"),
  ),
  body()
    .custom(
      (value) =>
        value &&
        Object.keys(value).every((key) =>
          ["flockId", "fileName", "rows"].includes(key),
        ),
    )
    .withMessage("Provide only supported import fields"),
];
