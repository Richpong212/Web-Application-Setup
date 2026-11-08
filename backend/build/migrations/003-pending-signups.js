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
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = (queryInterface, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    yield queryInterface.createTable("pending_signups", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
        name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        email: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        password: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        tokenHash: { type: sequelize_1.DataTypes.STRING(64), allowNull: true, unique: true },
        expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.sequelize.query("CREATE UNIQUE INDEX pending_signups_email_unique ON pending_signups (LOWER(email))", { transaction });
    yield queryInterface.addIndex("pending_signups", ["expiresAt"], {
        transaction,
    });
    // Preserve earlier unapproved registrations as pending requests. Their hashes
    // and existing approval links survive, but they no longer exist as users.
    yield queryInterface.sequelize.query(`
    INSERT INTO pending_signups (id, name, email, password, "tokenHash", "expiresAt", "createdAt", "updatedAt")
    SELECT u.id, u.name, u.email, u.password, t."tokenHash",
      COALESCE(t."expiresAt", NOW() + INTERVAL '24 hours'), u."createdAt", u."updatedAt"
    FROM users u
    LEFT JOIN user_tokens t ON t."userId" = u.id AND t.purpose = 'verify-email'
    WHERE u."isEmailVerified" = false
  `, { transaction });
    // Cascades remove unusable sessions and old user-bound email tokens.
    yield queryInterface.sequelize.query('DELETE FROM users WHERE "isEmailVerified" = false', { transaction });
    yield queryInterface.sequelize.query("DELETE FROM user_tokens WHERE purpose = 'verify-email'", { transaction });
    yield queryInterface.changeColumn("users", "isEmailVerified", {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }, { transaction });
});
exports.up = up;
const down = (queryInterface, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const [result] = yield queryInterface.sequelize.query("SELECT COUNT(*) AS count FROM pending_signups", { type: sequelize_1.QueryTypes.SELECT, transaction });
    // A rollback must never silently discard pending credentials or create users
    // who have not approved their signup. Resolve/export pending requests first.
    if (Number(result === null || result === void 0 ? void 0 : result.count) > 0) {
        throw new Error("Cannot roll back while pending signups exist; preserve or resolve them first");
    }
    yield queryInterface.dropTable("pending_signups", { transaction });
    yield queryInterface.changeColumn("users", "isEmailVerified", {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }, { transaction });
});
exports.down = down;
