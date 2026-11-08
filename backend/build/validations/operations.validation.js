"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyRecordsValidation = exports.reportValidation = exports.updateTaskValidation = exports.createTaskValidation = exports.completeVaccineValidation = exports.vaccineValidation = exports.feedValidation = exports.correctRecordValidation = exports.createRecordValidation = exports.updateFlockValidation = exports.createFlockValidation = exports.invitationAcceptValidation = exports.invitationPreviewValidation = exports.memberValidation = exports.inviteValidation = exports.resourceReference = exports.farmReference = void 0;
const express_validator_1 = require("express-validator");
const permissions_1 = require("../config/permissions");
const text = (field, max, optional = false, empty = false) => {
    const rule = optional ? (0, express_validator_1.body)(field).optional() : (0, express_validator_1.body)(field);
    return rule
        .isString()
        .withMessage("Enter valid text")
        .bail()
        .trim()
        .isLength({ min: empty ? 0 : 1, max })
        .withMessage(`Use at most ${max} characters`);
};
const integer = (field, min, max, optional = false) => (optional ? (0, express_validator_1.body)(field).optional() : (0, express_validator_1.body)(field))
    .isInt({ min, max })
    .withMessage("Enter a valid whole number")
    .toInt();
const date = (field, past = false, optional = false) => (optional ? (0, express_validator_1.body)(field).optional() : (0, express_validator_1.body)(field))
    .isString()
    .bail()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .isISO8601({ strict: true })
    .withMessage("Enter a valid date")
    .bail()
    .custom((value) => !past || value <= new Date().toISOString().slice(0, 10))
    .withMessage("The date cannot be in the future");
const exact = (fields, nonempty = false) => (0, express_validator_1.body)()
    .custom((value) => value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => fields.includes(key)) &&
    (!nonempty || Object.keys(value).length > 0))
    .withMessage("Provide only the allowed fields");
exports.farmReference = [
    (0, express_validator_1.param)("farmId").isUUID().withMessage("Invalid farm reference"),
];
exports.resourceReference = [
    (0, express_validator_1.param)("id").isUUID().withMessage("Invalid record reference"),
];
const grants = (0, express_validator_1.body)("permissions")
    .optional()
    .isArray({ max: permissions_1.permissionNames.length })
    .bail()
    .custom((values) => values.every((value) => permissions_1.permissionNames.includes(value)) && new Set(values).size === values.length)
    .withMessage("Choose valid permissions");
exports.inviteValidation = [
    (0, express_validator_1.body)("email")
        .isString()
        .bail()
        .trim()
        .toLowerCase()
        .isEmail()
        .isLength({ max: 254 })
        .withMessage("Enter a valid email"),
    (0, express_validator_1.body)("role")
        .isIn(["Manager", "Worker"])
        .withMessage("Choose Manager or Worker"),
    grants,
    exact(["email", "role", "permissions"]),
];
exports.memberValidation = [
    (0, express_validator_1.body)("role")
        .isIn(["Manager", "Worker"])
        .withMessage("Choose Manager or Worker"),
    grants,
    exact(["role", "permissions"]),
];
exports.invitationPreviewValidation = [
    (0, express_validator_1.query)("token")
        .isString()
        .bail()
        .matches(/^[a-f0-9]{64}$/)
        .withMessage("Invalid invitation link"),
];
exports.invitationAcceptValidation = [
    (0, express_validator_1.body)("token")
        .isString()
        .bail()
        .matches(/^[a-f0-9]{64}$/)
        .withMessage("Invalid invitation link"),
    exact(["token"]),
];
const flockFields = (partial) => [
    text("name", 100, partial),
    (partial ? (0, express_validator_1.body)("birdType").optional() : (0, express_validator_1.body)("birdType"))
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
    (0, express_validator_1.body)("purchaseCost")
        .optional()
        .isFloat({ min: 0, max: 1000000000 })
        .withMessage("Enter a valid cost")
        .toFloat(),
    text("notes", 2000, true, true),
    ...(partial
        ? [
            (0, express_validator_1.body)("status")
                .optional()
                .isIn(["Active", "Closed"])
                .withMessage("Choose a valid flock status"),
        ]
        : []),
    exact([
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
    ], partial),
];
exports.createFlockValidation = flockFields(false);
exports.updateFlockValidation = flockFields(true);
const recordFields = (partial) => [
    ...(partial
        ? []
        : [
            (0, express_validator_1.body)("flockId").isUUID().withMessage("Choose a flock"),
            date("date", true),
        ]),
    integer("mortality", 0, 1000000, partial),
    text("cause", 200, true, true),
    (partial ? (0, express_validator_1.body)("feedKg").optional() : (0, express_validator_1.body)("feedKg"))
        .isFloat({ min: 0, max: 1000000 })
        .withMessage("Enter a valid feed amount")
        .toFloat(),
    integer("eggs", 0, 10000000, partial),
    text("medication", 2000, true, true),
    text("activity", 2000, true, true),
    text("notes", 2000, true, true),
    ...(partial ? [text("reason", 500)] : []),
    exact([
        "mortality",
        "cause",
        "feedKg",
        "eggs",
        "medication",
        "activity",
        "notes",
        ...(partial ? ["reason"] : ["flockId", "date"]),
    ], true),
];
exports.createRecordValidation = recordFields(false);
exports.correctRecordValidation = recordFields(true);
exports.feedValidation = [
    (0, express_validator_1.body)("stages")
        .isArray({ max: 100 })
        .bail()
        .custom((stages) => stages.every((item) => item &&
        Object.keys(item).every((key) => ["fromWeek", "toWeek", "feed"].includes(key)) &&
        Number.isInteger(item.fromWeek) &&
        item.fromWeek >= 1 &&
        Number.isInteger(item.toWeek) &&
        item.toWeek <= 520 &&
        item.toWeek >= item.fromWeek &&
        typeof item.feed === "string" &&
        item.feed.trim().length > 0 &&
        item.feed.length <= 100))
        .withMessage("Enter valid feeding stages"),
    exact(["stages"]),
];
exports.vaccineValidation = [
    (0, express_validator_1.body)("entries")
        .isArray({ max: 100 })
        .bail()
        .custom((entries) => entries.every((item) => item &&
        Object.keys(item).every((key) => ["id", "day", "name"].includes(key)) &&
        (!item.id || /^[a-f0-9-]{36}$/i.test(item.id)) &&
        Number.isInteger(item.day) &&
        item.day >= 0 &&
        item.day <= 3650 &&
        typeof item.name === "string" &&
        item.name.trim().length > 0 &&
        item.name.length <= 150))
        .withMessage("Enter valid vaccination entries"),
    exact(["entries"]),
];
exports.completeVaccineValidation = [
    (0, express_validator_1.body)("flockId").isUUID(),
    (0, express_validator_1.body)("scheduleId").isUUID(),
    date("date", true),
    text("notes", 2000, true, true),
    exact(["flockId", "scheduleId", "date", "notes"]),
];
const taskFields = (partial) => [
    text("title", 200, partial),
    date("due", false, partial),
    (0, express_validator_1.body)("assigneeId")
        .optional()
        .custom((value) => value === null ||
        (typeof value === "string" && /^[a-f0-9-]{36}$/i.test(value)))
        .withMessage("Choose a team member"),
    ...(partial ? [(0, express_validator_1.body)("done").optional().isBoolean().toBoolean()] : []),
    exact(["title", "due", "assigneeId", ...(partial ? ["done"] : [])], partial),
];
exports.createTaskValidation = taskFields(false);
exports.updateTaskValidation = taskFields(true);
exports.reportValidation = [
    (0, express_validator_1.query)("from")
        .isString()
        .bail()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .isISO8601({ strict: true }),
    (0, express_validator_1.query)("to")
        .isString()
        .bail()
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .isISO8601({ strict: true })
        .bail()
        .custom((value, { req }) => {
        var _a;
        const days = (Date.parse(value) - Date.parse(String((_a = req.query) === null || _a === void 0 ? void 0 : _a.from))) / 86400000;
        return days >= 0 && days < 366;
    })
        .withMessage("Choose a date range of up to one year"),
    (0, express_validator_1.query)("flockId").optional().isUUID().withMessage("Choose a valid flock"),
];
exports.weeklyRecordsValidation = [
    (0, express_validator_1.query)("flockId").isUUID().withMessage("Choose a valid flock"),
    (0, express_validator_1.query)("week")
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage("Choose a valid week")
        .toInt(),
];
