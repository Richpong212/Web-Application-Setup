"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = void 0;
const errors_1 = require("./errors");
// Keep client responses small. Diagnostics belong in server logs.
const sendError = (res, code, fields = []) => {
    const error = errors_1.errors[code];
    const message = code === "VALIDATION_ERROR" && fields[0]
        ? fields[0].message
        : error.message;
    res.setHeader("Cache-Control", "no-store");
    res.status(error.status).json({ message });
};
exports.sendError = sendError;
