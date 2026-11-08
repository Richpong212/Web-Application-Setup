"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
// A signup request is not a user. It cannot authenticate or own farm data.
class PendingSignup extends sequelize_1.Model {
}
PendingSignup.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true },
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    tokenHash: {
        type: sequelize_1.DataTypes.STRING(64),
        allowNull: true,
        unique: true,
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: connectDb_1.db,
    modelName: "PendingSignup",
    tableName: "pending_signups",
    timestamps: true,
    defaultScope: { attributes: { exclude: ["password", "tokenHash"] } },
    scopes: { withCredentials: {} },
    indexes: [
        {
            name: "pending_signups_email_unique",
            unique: true,
            fields: [(0, sequelize_1.fn)("LOWER", (0, sequelize_1.col)("email"))],
        },
        { fields: ["expiresAt"] },
    ],
});
exports.default = PendingSignup;
