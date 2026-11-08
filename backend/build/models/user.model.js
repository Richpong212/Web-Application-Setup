"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class User extends sequelize_1.Model {
}
User.init({
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
        validate: { isEmail: true },
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    isEmailVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    isAdmin: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    sequelize: connectDb_1.db,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    indexes: [
        {
            name: "users_email_unique",
            unique: true,
            fields: [(0, sequelize_1.fn)("LOWER", (0, sequelize_1.col)("email"))],
        },
    ],
    // Password hashes are only loaded explicitly by authentication code.
    defaultScope: {
        attributes: { exclude: ["password"] },
    },
    scopes: {
        withPassword: {
            attributes: [
                "id",
                "name",
                "email",
                "password",
                "isEmailVerified",
                "isAdmin",
                "createdAt",
                "updatedAt",
            ],
        },
    },
});
exports.default = User;
