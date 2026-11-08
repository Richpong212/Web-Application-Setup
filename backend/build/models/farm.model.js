"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class Farm extends sequelize_1.Model {
}
Farm.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        primaryKey: true,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
    },
    ownerId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
    },
    name: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    country: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    location: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    type: { type: sequelize_1.DataTypes.STRING(50), allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: "" },
    // Names only for now. Full house entities belong to the poultry-house phase.
    houses: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING(100)),
        allowNull: false,
        defaultValue: [],
    },
}, {
    sequelize: connectDb_1.db,
    modelName: "Farm",
    tableName: "farms",
    timestamps: true,
    indexes: [{ fields: ["ownerId"] }],
});
exports.default = Farm;
