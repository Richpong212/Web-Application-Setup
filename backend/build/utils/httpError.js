"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
const errors_1 = require("./errors");
// Expected errors carry a reviewed public code, not an arbitrary exception message.
class HttpError extends Error {
    constructor(code, fields = []) {
        super(errors_1.errors[code].message);
        this.name = "HttpError";
        this.code = code;
        this.status = errors_1.errors[code].status;
        this.fields = fields;
    }
}
exports.HttpError = HttpError;
