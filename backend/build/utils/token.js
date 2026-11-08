"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.decodeToken = exports.genToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_config_1 = require("../config/index.config");
const logger_utils_1 = require("./logger.utils");
const jwtSecret = index_config_1.appConfig.app.jwt_secret;
const genToken = (payload, expiresIn) => {
    const options = {};
    if (expiresIn && expiresIn !== "0") {
        options.expiresIn = expiresIn;
    }
    return jsonwebtoken_1.default.sign(payload, jwtSecret, options);
};
exports.genToken = genToken;
const decodeToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        return decoded;
    }
    catch (error) {
        logger_utils_1.logger.error(error);
        return null;
    }
};
exports.decodeToken = decodeToken;
const verifyToken = (token) => {
    try {
        jsonwebtoken_1.default.verify(token, jwtSecret);
        return true;
    }
    catch (error) {
        logger_utils_1.logger.error("Token verification failed:", error);
        return false;
    }
};
exports.verifyToken = verifyToken;
