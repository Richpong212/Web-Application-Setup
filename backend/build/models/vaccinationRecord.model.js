"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class VaccinationRecord extends sequelize_1.Model {
}
VaccinationRecord.init({
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
    scheduleId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        references: { model: "vaccination_schedules", key: "id" },
        onDelete: "SET NULL",
    },
    day: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING(150), allowNull: false },
    date: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
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
    modelName: "VaccinationRecord",
    tableName: "vaccination_records",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
});
exports.default = VaccinationRecord;
