"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class DailyRecord extends sequelize_1.Model {
}
DailyRecord.init({
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
    flockId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "flocks", key: "id" },
        onDelete: "CASCADE",
    },
    date: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    mortality: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cause: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, defaultValue: "" },
    feedKg: {
        type: sequelize_1.DataTypes.DECIMAL(14, 3),
        allowNull: false,
        defaultValue: 0,
    },
    eggs: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    medication: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: "" },
    activity: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: "" },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: "" },
    recordedBy: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    createdBy: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
    },
}, {
    sequelize: connectDb_1.db,
    modelName: "DailyRecord",
    tableName: "daily_records",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
});
exports.default = DailyRecord;
