"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = void 0;
// Public messages are reviewed here, never copied from database/provider errors.
exports.errors = {
    PERMISSION_DENIED: {
        status: 403,
        message: "You do not have permission to do that.",
    },
    INVITATION_INVALID: {
        status: 400,
        message: "This invitation is invalid or has expired.",
    },
    INVITATION_ACCOUNT: {
        status: 403,
        message: "Please log in with the invited email address.",
    },
    CONFLICT: { status: 409, message: "This record already exists." },
    VALIDATION_ERROR: {
        status: 400,
        message: "Check your information and try again.",
    },
    INVALID_REQUEST: {
        status: 400,
        message: "We could not read your request. Check your information and try again.",
    },
    INVALID_LINK: {
        status: 400,
        message: "This link is invalid or has expired. Please request a new link.",
    },
    INVALID_CREDENTIALS: {
        status: 401,
        message: "The email or password is incorrect.",
    },
    SIGN_IN_REQUIRED: { status: 401, message: "Please log in to continue." },
    SESSION_EXPIRED: {
        status: 401,
        message: "Your session has ended. Please log in again.",
    },
    REQUEST_NOT_ALLOWED: {
        status: 403,
        message: "We could not complete this request. Refresh the page and try again.",
    },
    NOT_FOUND: {
        status: 404,
        message: "The requested resource could not be found.",
    },
    PAYLOAD_TOO_LARGE: {
        status: 413,
        message: "Your request is too large. Reduce its size and try again.",
    },
    RATE_LIMITED: {
        status: 429,
        message: "Too many requests. Please wait and try again.",
    },
    SERVICE_UNAVAILABLE: {
        status: 503,
        message: "This service is temporarily unavailable. Please try again shortly.",
    },
    INTERNAL_ERROR: {
        status: 500,
        message: "Internal server error",
    },
};
