"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class Flock extends sequelize_1.Model {
}
Flock.init({
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
    name: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    birdType: { type: sequelize_1.DataTypes.STRING(16), allowNull: false },
    breed: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, defaultValue: "" },
    supplier: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        defaultValue: "",
    },
    supplierContact: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: false,
        defaultValue: "",
    },
    dateReceived: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false },
    ageAtArrivalDays: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    initialBirds: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    house: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, defaultValue: "" },
    purchaseCost: {
        type: sequelize_1.DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: sequelize_1.DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "Active",
    },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: "" },
}, {
    sequelize: connectDb_1.db,
    modelName: "Flock",
    tableName: "flocks",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
});
exports.default = Flock;
