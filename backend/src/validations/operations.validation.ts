import { body, param, query } from "express-validator";
import { permissionNames } from "../config/permissions";

const text = (field: string, max: number, optional = false, empty = false) => {
  const rule = optional ? body(field).optional() : body(field);
  return rule
    .isString()
    .withMessage("Enter valid text")
    .bail()
    .trim()
    .isLength({ min: empty ? 0 : 1, max })
    .withMessage(`Use at most ${max} characters`);
};
const integer = (field: string, min: number, max: number, optional = false) =>
  (optional ? body(field).optional() : body(field))
    .isInt({ min, max })
    .withMessage("Enter a valid whole number")
    .toInt();
const date = (field: string, past = false, optional = false) =>
  (optional ? body(field).optional() : body(field))
    .isString()
    .bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .isISO8601({ strict: true })
    .withMessage("Enter a valid date")
    .bail()
    .custom(
      (value: string) =>
        !past || value <= new Date().toISOString().slice(0, 10),
    )
    .withMessage("The date cannot be in the future");
const exact = (fields: string[], nonempty = false) =>
  body()
    .custom(
      (value) =>
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).every((key) => fields.includes(key)) &&
        (!nonempty || Object.keys(value).length > 0),
    )
    .withMessage("Provide only the allowed fields");

export const farmReference = [
  param("farmId").isUUID().withMessage("Invalid farm reference"),
];
export const resourceReference = [
  param("id").isUUID().withMessage("Invalid record reference"),
];
const grants = body("permissions")
  .optional()
  .isArray({ max: permissionNames.length })
  .bail()
  .custom(
    (values: unknown[]) =>
      values.every((value) =>
        permissionNames.includes(value as (typeof permissionNames)[number]),
      ) && new Set(values).size === values.length,
  )
  .withMessage("Choose valid permissions");
export const inviteValidation = [
  body("email")
    .isString()
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .isLength({ max: 254 })
    .withMessage("Enter a valid email"),
  body("role")
    .isIn(["Manager", "Worker"])
    .withMessage("Choose Manager or Worker"),
  grants,
  exact(["email", "role", "permissions"]),
];
export const memberValidation = [
  body("role")
    .isIn(["Manager", "Worker"])
    .withMessage("Choose Manager or Worker"),
  grants,
  exact(["role", "permissions"]),
];
export const invitationPreviewValidation = [
  query("token")
    .isString()
    .bail()
    .matches(/^[a-f0-9]{64}$/)
    .withMessage("Invalid invitation link"),
];
export const invitationAcceptValidation = [
  body("token")
    .isString()
    .bail()
    .matches(/^[a-f0-9]{64}$/)
    .withMessage("Invalid invitation link"),
  exact(["token"]),
];

const flockFields = (partial: boolean) => [
  text("name", 100, partial),
  (partial ? body("birdType").optional() : body("birdType"))
    .isIn(["Layers", "Broilers", "Other"])
    .withMessage("Choose a valid bird type"),
  text("breed", 100, true, true),
  text("supplier", 150, true, true),
  text("supplierContact", 150, true, true),
  ...(partial
    ? []
    : [
        date("dateReceived", true),
        integer("ageAtArrivalDays", 0, 3650),
        integer("initialBirds", 1, 1000000),
      ]),
  text("house", 100, true, true),
  body("purchaseCost")
    .optional()
    .isFloat({ min: 0, max: 1000000000 })
    .withMessage("Enter a valid cost")
    .toFloat(),
  text("notes", 2000, true, true),
  ...(partial
    ? [
        body("status")
          .optional()
          .isIn(["Active", "Closed"])
          .withMessage("Choose a valid flock status"),
      ]
    : []),
  exact(
    [
      "name",
      "birdType",
      "breed",
      "supplier",
      "supplierContact",
      "house",
      "purchaseCost",
      "notes",
      ...(partial
        ? ["status"]
        : ["dateReceived", "ageAtArrivalDays", "initialBirds"]),
    ],
    partial,
  ),
];
export const createFlockValidation = flockFields(false);
export const updateFlockValidation = flockFields(true);

const recordFields = (partial: boolean) => [
  ...(partial
    ? []
    : [
        body("flockId").isUUID().withMessage("Choose a flock"),
        date("date", true),
      ]),
  integer("mortality", 0, 1000000, partial),
  text("cause", 200, true, true),
  (partial ? body("feedKg").optional() : body("feedKg"))
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Enter a valid feed amount")
    .toFloat(),
  integer("eggs", 0, 10000000, partial),
  text("medication", 2000, true, true),
  text("activity", 2000, true, true),
  text("notes", 2000, true, true),
  ...(partial ? [text("reason", 500)] : []),
  exact(
    [
      "mortality",
      "cause",
      "feedKg",
      "eggs",
      "medication",
      "activity",
      "notes",
      ...(partial ? ["reason"] : ["flockId", "date"]),
    ],
    true,
  ),
];
export const createRecordValidation = recordFields(false);
export const correctRecordValidation = recordFields(true);

export const feedValidation = [
  body("stages")
    .isArray({ max: 100 })
    .bail()
    .custom((stages: unknown[]) =>
      stages.every(
        (item: any) =>
          item &&
          Object.keys(item).every((key) =>
            ["fromWeek", "toWeek", "feed"].includes(key),
          ) &&
          Number.isInteger(item.fromWeek) &&
          item.fromWeek >= 1 &&
          Number.isInteger(item.toWeek) &&
          item.toWeek <= 520 &&
          item.toWeek >= item.fromWeek &&
          typeof item.feed === "string" &&
          item.feed.trim().length > 0 &&
          item.feed.length <= 100,
      ),
    )
    .withMessage("Enter valid feeding stages"),
  exact(["stages"]),
];
export const vaccineValidation = [
  body("entries")
    .isArray({ max: 100 })
    .bail()
    .custom((entries: unknown[]) =>
      entries.every(
        (item: any) =>
          item &&
          Object.keys(item).every((key) =>
            ["id", "day", "name"].includes(key),
          ) &&
          (!item.id || /^[a-f0-9-]{36}$/i.test(item.id)) &&
          Number.isInteger(item.day) &&
          item.day >= 0 &&
          item.day <= 3650 &&
          typeof item.name === "string" &&
          item.name.trim().length > 0 &&
          item.name.length <= 150,
      ),
    )
    .withMessage("Enter valid vaccination entries"),
  exact(["entries"]),
];
export const completeVaccineValidation = [
  body("flockId").isUUID(),
  body("scheduleId").isUUID(),
  date("date", true),
  text("notes", 2000, true, true),
  exact(["flockId", "scheduleId", "date", "notes"]),
];
const taskFields = (partial: boolean) => [
  text("title", 200, partial),
  date("due", false, partial),
  body("assigneeId")
    .optional()
    .custom(
      (value) =>
        value === null ||
        (typeof value === "string" && /^[a-f0-9-]{36}$/i.test(value)),
    )
    .withMessage("Choose a team member"),
  ...(partial ? [body("done").optional().isBoolean().toBoolean()] : []),
  exact(["title", "due", "assigneeId", ...(partial ? ["done"] : [])], partial),
];
export const createTaskValidation = taskFields(false);
export const updateTaskValidation = taskFields(true);
export const reportValidation = [
  query("from")
    .isString()
    .bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .isISO8601({ strict: true }),
  query("to")
    .isString()
    .bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .isISO8601({ strict: true })
    .bail()
    .custom((value, { req }) => {
      const days =
        (Date.parse(value) - Date.parse(String(req.query?.from))) / 86400000;
      return days >= 0 && days < 366;
    })
    .withMessage("Choose a date range of up to one year"),
  query("flockId").optional().isUUID().withMessage("Choose a valid flock"),
];

export const weeklyRecordsValidation = [
  query("flockId").isUUID().withMessage("Choose a valid flock"),
  query("week")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Choose a valid week")
    .toInt(),
];
