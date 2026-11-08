"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class FarmTask extends sequelize_1.Model {
}
FarmTask.init({
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
    title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    due: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    assigneeId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
    },
    done: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    completedBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
    },
}, {
    sequelize: connectDb_1.db,
    modelName: "FarmTask",
    tableName: "farm_tasks",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
});
exports.default = FarmTask;
