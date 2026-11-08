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
    yield queryInterface.addColumn("users", "isEmailVerified", {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }, { transaction });
    // Normalize legacy nullable flags before enforcing the model's constraint.
    yield queryInterface.sequelize.query('UPDATE users SET "isAdmin" = false WHERE "isAdmin" IS NULL', { transaction });
    yield queryInterface.changeColumn("users", "isAdmin", {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }, { transaction });
    const timestamps = {
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    };
    const userReference = {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
    };
    yield queryInterface.createTable("sessions", Object.assign({ id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false }, userId: userReference, refreshTokenHash: { type: sequelize_1.DataTypes.STRING(64), allowNull: false }, expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false }, revokedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, defaultValue: null } }, timestamps), { transaction });
    yield queryInterface.createTable("user_tokens", Object.assign({ id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false }, userId: userReference, purpose: { type: sequelize_1.DataTypes.STRING(32), allowNull: false }, tokenHash: { type: sequelize_1.DataTypes.STRING(64), allowNull: false, unique: true }, expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false } }, timestamps), { transaction });
    yield queryInterface.addIndex("sessions", ["userId"], { transaction });
    yield queryInterface.addIndex("sessions", ["expiresAt"], { transaction });
    yield queryInterface.addIndex("user_tokens", ["userId", "purpose"], {
        unique: true,
        transaction,
    });
    yield queryInterface.addIndex("user_tokens", ["expiresAt"], { transaction });
});
exports.up = up;
const down = (queryInterface, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    yield queryInterface.dropTable("user_tokens", { transaction });
    yield queryInterface.dropTable("sessions", { transaction });
    yield queryInterface.removeColumn("users", "isEmailVerified", {
        transaction,
    });
});
exports.down = down;
