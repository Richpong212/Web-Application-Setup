"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const httpError_1 = require("../utils/httpError");
const validate = (req, _res, next) => {
    const result = (0, express_validator_1.validationResult)(req);
    if (!result.isEmpty()) {
        // Return field names and our validation rules, never submitted values.
        const fields = result
            .array({ onlyFirstError: true })
            .filter((error) => error.type === "field")
            .map((error) => ({
            field: error.path,
            message: typeof error.msg === "string" ? error.msg : "Check this field.",
        }));
        throw new httpError_1.HttpError("VALIDATION_ERROR", fields);
    }
    next();
};
exports.validate = validate;
