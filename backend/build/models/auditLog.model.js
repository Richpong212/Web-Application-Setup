"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class AuditLog extends sequelize_1.Model {
}
AuditLog.init({
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
    actorId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
    },
    action: { type: sequelize_1.DataTypes.STRING(80), allowNull: false },
    entityType: { type: sequelize_1.DataTypes.STRING(40), allowNull: false },
    entityId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    reason: { type: sequelize_1.DataTypes.STRING(500), allowNull: false, defaultValue: "" },
    before: { type: sequelize_1.DataTypes.JSONB, allowNull: true },
    after: { type: sequelize_1.DataTypes.JSONB, allowNull: true },
}, {
    sequelize: connectDb_1.db,
    modelName: "AuditLog",
    tableName: "audit_logs",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
});
exports.default = AuditLog;
