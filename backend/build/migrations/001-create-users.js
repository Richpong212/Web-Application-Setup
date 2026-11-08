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
// Keep database columns aligned with User.init in models/user.model.ts.
const up = (queryInterface, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    yield queryInterface.createTable("users", {
        id: {
            type: sequelize_1.DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        isAdmin: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
    }, { transaction });
    yield queryInterface.sequelize.query("UPDATE users SET email = LOWER(TRIM(email))", { transaction });
    // Enforce uniqueness in PostgreSQL, including simultaneous registrations.
    // Existing duplicate emails cause the migration to fail rather than lose data.
    yield queryInterface.sequelize.query("CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email))", { transaction });
});
exports.up = up;
const down = (queryInterface, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    yield queryInterface.dropTable("users", { transaction });
});
exports.down = down;
