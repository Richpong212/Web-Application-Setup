"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = void 0;
const crypto_1 = require("crypto");
const httpError_1 = require("../utils/httpError");
const errorResponse_1 = require("../utils/errorResponse");
const logger_utils_1 = require("../utils/logger.utils");
const handleError = (error, _req, res, next) => {
    var _a;
    var _b;
    if (res.headersSent) {
        next(error);
        return;
    }
    (_b = res.locals).requestId || (_b.requestId = (0, crypto_1.randomUUID)());
    if (error instanceof httpError_1.HttpError) {
        (0, errorResponse_1.sendError)(res, error.code, error.fields);
        return;
    }
    // Parser exceptions contain the submitted body. Only return a safe code.
    if ((error === null || error === void 0 ? void 0 : error.type) === "entity.parse.failed") {
        (0, errorResponse_1.sendError)(res, "INVALID_REQUEST");
        return;
    }
    if ((error === null || error === void 0 ? void 0 : error.type) === "entity.too.large") {
        (0, errorResponse_1.sendError)(res, "PAYLOAD_TOO_LARGE");
        return;
    }
    // Do not serialize the exception: Sequelize attaches SQL, parameters and
    // credentials. Log diagnostic codes and stack frames with a support reference.
    logger_utils_1.logger.error(`[HTTP] Unexpected failure; reference ${res.locals.requestId}`, {
        requestId: res.locals.requestId,
        errorName: error === null || error === void 0 ? void 0 : error.name,
        errorCode: ((_a = error === null || error === void 0 ? void 0 : error.original) === null || _a === void 0 ? void 0 : _a.code) || (error === null || error === void 0 ? void 0 : error.code),
        stack: typeof (error === null || error === void 0 ? void 0 : error.stack) === "string"
            ? error.stack
                .split("\n")
                .filter((line) => /^\s+at\s/.test(line))
                .join("\n")
            : undefined,
    });
    (0, errorResponse_1.sendError)(res, "INTERNAL_ERROR");
};
exports.handleError = handleError;
