"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class FarmInvitation extends sequelize_1.Model {
}
FarmInvitation.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    farmId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
    },
    email: { type: sequelize_1.DataTypes.STRING(254), allowNull: false },
    role: { type: sequelize_1.DataTypes.STRING(16), allowNull: false },
    permissions: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING(32)),
        allowNull: true,
    },
    tokenHash: { type: sequelize_1.DataTypes.STRING(64), allowNull: false },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    status: {
        type: sequelize_1.DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "Pending",
    },
    invitedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
    },
    acceptedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
    },
}, {
    sequelize: connectDb_1.db,
    modelName: "FarmInvitation",
    tableName: "farm_invitations",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
});
exports.default = FarmInvitation;
