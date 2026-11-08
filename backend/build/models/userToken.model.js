"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class UserToken extends sequelize_1.Model {
}
// Only token hashes are stored. The original token is sent by email once.
UserToken.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
    },
    purpose: {
        type: sequelize_1.DataTypes.STRING(32),
        allowNull: false,
        validate: { isIn: [["reset-password"]] },
    },
    tokenHash: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: false,
        unique: true,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: connectDb_1.db,
    modelName: "UserToken",
    tableName: "user_tokens",
    timestamps: true,
    indexes: [
        { fields: ["userId", "purpose"], unique: true },
        { fields: ["expiresAt"] },
    ],
});
exports.default = UserToken;
