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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.requestPasswordReset = exports.revokeSession = exports.refreshSession = exports.loginUser = exports.verifyEmail = exports.resendVerification = exports.registerUser = exports.publicUser = void 0;
const crypto_1 = require("crypto");
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
const index_config_1 = require("../config/index.config");
const models_1 = require("../models");
const passwordHashing_1 = require("../utils/passwordHashing");
const authToken_1 = require("../utils/authToken");
const httpError_1 = require("../utils/httpError");
const sendEmail_1 = require("../utils/sendEmail");
const logger_utils_1 = require("../utils/logger.utils");
const VerificationEmail_template_1 = require("./VerificationEmail.template");
// Every response uses an explicit list of public profile fields.
const publicUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
exports.publicUser = publicUser;
// Serialize signup, resend and approval for the same email, including requests
// arriving before a pending row exists. Different emails can proceed in parallel.
const lockSignupEmail = (email, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    yield connectDb_1.db.query("SELECT pg_advisory_xact_lock(73519002, hashtext(:email))", {
        replacements: { email },
        transaction,
    });
});
const deliverApproval = (signup, token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, sendEmail_1.sendEmail)(Object.assign({ email: signup.email }, (0, VerificationEmail_template_1.clientVerificationEmail)(signup.name, token)));
    }
    catch (_a) {
        logger_utils_1.logger.warn("[AUTH] Approval email delivery failed; no user was created");
    }
});
const registerUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const password = yield (0, passwordHashing_1.hashPassword)(data.password);
    const token = (0, authToken_1.createEmailToken)();
    const signup = yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield lockSignupEmail(data.email, transaction);
        if (yield models_1.User.findOne({ where: { email: data.email }, transaction })) {
            return null;
        }
        const existing = yield models_1.PendingSignup.findOne({
            where: { email: data.email },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (existing && existing.expiresAt.getTime() > Date.now()) {
            return null;
        }
        const values = {
            name: data.name,
            email: data.email,
            password,
            tokenHash: (0, authToken_1.hashToken)(token),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        if (existing)
            return existing.update(values, { transaction });
        return models_1.PendingSignup.create(values, { transaction });
    }));
    // SMTP failure leaves only a pending request for resend, never a user account.
    if (signup)
        yield deliverApproval(signup, token);
    return { email: data.email };
});
exports.registerUser = registerUser;
const resendVerification = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authToken_1.createEmailToken)();
    const signup = yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        yield lockSignupEmail(email, transaction);
        const pending = yield models_1.PendingSignup.findOne({
            where: { email },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!pending)
            return null;
        yield pending.update({
            tokenHash: (0, authToken_1.hashToken)(token),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }, { transaction });
        return pending;
    }));
    if (signup)
        yield deliverApproval(signup, token);
});
exports.resendVerification = resendVerification;
const verifyEmail = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenHash = (0, authToken_1.hashToken)(token);
    try {
        yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            const request = yield models_1.PendingSignup.findOne({
                where: { tokenHash },
                transaction,
            });
            if (!request)
                throw new httpError_1.HttpError("INVALID_LINK");
            yield lockSignupEmail(request.email, transaction);
            const signup = yield models_1.PendingSignup.scope("withCredentials").findOne({
                where: { tokenHash, expiresAt: { [sequelize_1.Op.gt]: new Date() } },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!signup)
                throw new httpError_1.HttpError("INVALID_LINK");
            // This is the only account-creation path: approval and consumption commit
            // together, so failed or repeated confirmations cannot create another user.
            yield models_1.User.create({
                id: signup.id,
                name: signup.name,
                email: signup.email,
                password: signup.password,
                isAdmin: false,
                isEmailVerified: true,
            }, { transaction });
            yield signup.destroy({ transaction });
        }));
    }
    catch (error) {
        if (error instanceof sequelize_1.UniqueConstraintError) {
            throw new httpError_1.HttpError("INVALID_LINK");
        }
        throw error;
    }
});
exports.verifyEmail = verifyEmail;
const savePasswordResetToken = (userId, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const token = (0, authToken_1.createEmailToken)();
    const purpose = "reset-password";
    yield models_1.UserToken.destroy({ where: { userId, purpose }, transaction });
    yield models_1.UserToken.create({
        userId,
        purpose,
        tokenHash: (0, authToken_1.hashToken)(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }, { transaction });
    return token;
});
// Password reset applies only to an existing, approved user.
const findPasswordResetToken = (token, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenHash = (0, authToken_1.hashToken)(token);
    const purpose = "reset-password";
    const record = yield models_1.UserToken.findOne({
        where: { tokenHash, purpose },
        transaction,
    });
    if (!record)
        throw new httpError_1.HttpError("INVALID_LINK");
    const user = yield models_1.User.scope("withPassword").findByPk(record.userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
    });
    const currentToken = yield models_1.UserToken.findOne({
        where: { tokenHash, purpose, expiresAt: { [sequelize_1.Op.gt]: new Date() } },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });
    if (!user || !currentToken)
        throw new httpError_1.HttpError("INVALID_LINK");
    return { user, record: currentToken };
});
const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    return connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield models_1.User.scope("withPassword").findOne({
            where: { email },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        // Perform the same bcrypt check for unknown emails and incorrect passwords.
        // This dummy hash is not associated with a real account.
        const dummyHash = "$2b$12$jDHJ3Pc6XTCzfPfGkNHrT.trVcJ4yEpsKspbotOhcXGSX1UZ3ITj2";
        const passwordMatches = yield (0, passwordHashing_1.comparePassword)(password, (user === null || user === void 0 ? void 0 : user.password) || dummyHash);
        if (!user || !passwordMatches || !user.isEmailVerified) {
            throw new httpError_1.HttpError("INVALID_CREDENTIALS");
        }
        const sessionId = (0, crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + index_config_1.appConfig.app.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
        const refreshToken = (0, authToken_1.createRefreshToken)(user.id, sessionId, expiresAt);
        yield models_1.Session.create({
            id: sessionId,
            userId: user.id,
            refreshTokenHash: (0, authToken_1.hashToken)(refreshToken),
            expiresAt,
        }, { transaction });
        return {
            user: (0, exports.publicUser)(user),
            accessToken: (0, authToken_1.createAccessToken)(user.id, sessionId),
            refreshToken,
            expiresAt,
        };
    }));
});
exports.loginUser = loginUser;
const refreshSession = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, sessionId } = (0, authToken_1.readAuthToken)(token, "refresh");
    const result = yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        // All auth writes take the user lock first to avoid deadlocks with resets.
        const user = yield models_1.User.findByPk(userId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        const session = yield models_1.Session.findByPk(sessionId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!user ||
            !user.isEmailVerified ||
            !session ||
            session.userId !== userId ||
            session.revokedAt ||
            session.expiresAt.getTime() <= Date.now()) {
            return null;
        }
        if (session.refreshTokenHash !== (0, authToken_1.hashToken)(token)) {
            // A previously rotated token was reused. Commit revocation before replying.
            yield session.update({ revokedAt: new Date() }, { transaction });
            logger_utils_1.logger.warn("[AUTH] Refresh token reuse detected; session revoked");
            return null;
        }
        const refreshToken = (0, authToken_1.createRefreshToken)(userId, sessionId, session.expiresAt);
        yield session.update({ refreshTokenHash: (0, authToken_1.hashToken)(refreshToken) }, { transaction });
        return {
            accessToken: (0, authToken_1.createAccessToken)(userId, sessionId),
            refreshToken,
            expiresAt: session.expiresAt,
        };
    }));
    if (!result) {
        throw new httpError_1.HttpError("SESSION_EXPIRED");
    }
    return result;
});
exports.refreshSession = refreshSession;
const revokeSession = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, sessionId } = (0, authToken_1.readAuthToken)(token, "refresh");
        yield models_1.Session.update({ revokedAt: new Date() }, {
            where: { id: sessionId, userId, revokedAt: null },
        });
    }
    catch (error) {
        if (!(error instanceof httpError_1.HttpError)) {
            throw error;
        }
        // Logout remains safe to repeat after the cookie has expired.
    }
});
exports.revokeSession = revokeSession;
const requestPasswordReset = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield models_1.User.findOne({
            where: { email },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!user) {
            return null;
        }
        const token = yield savePasswordResetToken(user.id, transaction);
        return { user, token };
    }));
    if (!result) {
        return;
    }
    const resetUrl = `${index_config_1.appConfig.app.clientUrl}/reset-password?token=${result.token}`;
    try {
        yield (0, sendEmail_1.sendEmail)({
            email: result.user.email,
            subject: "Reset your RP Ranch password",
            text: `Reset your password using this link (valid for one hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        });
    }
    catch (_a) {
        logger_utils_1.logger.warn("[AUTH] Password reset email delivery failed");
    }
});
exports.requestPasswordReset = requestPasswordReset;
const resetPassword = (token, password) => __awaiter(void 0, void 0, void 0, function* () {
    const passwordHash = yield (0, passwordHashing_1.hashPassword)(password);
    yield connectDb_1.db.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
        const { user, record } = yield findPasswordResetToken(token, transaction);
        yield user.update({ password: passwordHash }, { transaction });
        yield record.destroy({ transaction });
        yield models_1.Session.update({ revokedAt: new Date() }, {
            where: { userId: user.id, revokedAt: null },
            transaction,
        });
    }));
});
exports.resetPassword = resetPassword;
