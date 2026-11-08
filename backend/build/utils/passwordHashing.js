"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptPasword = exports.encryptPassword = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const index_config_1 = require("../config/index.config");
const algorithm = "aes-256-cbc";
const secretKey = Buffer.from(index_config_1.appConfig.app.secretKey, "hex");
// Hashes the password
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    return bcryptjs_1.default.hash(password, 12);
});
exports.hashPassword = hashPassword;
// Compares the password with the hashed password
const comparePassword = (password, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    return bcryptjs_1.default.compare(password, hashedPassword);
});
exports.comparePassword = comparePassword;
// Hash cryptorized password for smtp storage
const encryptPassword = (password) => {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(password), cipher.final()]);
    return {
        iv: iv.toString("hex"),
        encryptedData: encrypted.toString("hex"),
    };
};
exports.encryptPassword = encryptPassword;
// Decrypt cryptorized password for smtp usage
const decryptPasword = (hash) => {
    if (!hash || !hash.iv || !hash.encryptedData) {
        throw new Error("Invalid hash provided for decryption.");
    }
    const decipher = crypto_1.default.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, "hex"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(hash.encryptedData, "hex")),
        decipher.final(),
    ]);
    const decryptedPassword = decrypted.toString();
    return decryptedPassword;
};
exports.decryptPasword = decryptPasword;
