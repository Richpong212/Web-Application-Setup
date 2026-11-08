"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class VaccinationSchedule extends sequelize_1.Model {
}
VaccinationSchedule.init({
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
    day: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING(150), allowNull: false },
}, {
    sequelize: connectDb_1.db,
    modelName: "VaccinationSchedule",
    tableName: "vaccination_schedules",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
});
exports.default = VaccinationSchedule;
