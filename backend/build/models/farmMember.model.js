"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class FarmMember extends sequelize_1.Model {
}
FarmMember.init({
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
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
    },
    permissions: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING(32)),
        allowNull: true,
        defaultValue: null,
    },
    role: {
        type: sequelize_1.DataTypes.STRING(16),
        allowNull: false,
        validate: { isIn: [["Owner", "Manager", "Worker"]] },
    },
}, {
    sequelize: connectDb_1.db,
    modelName: "FarmMember",
    tableName: "farm_members",
    timestamps: true,
    indexes: [
        { fields: ["farmId", "userId"], unique: true },
        { fields: ["userId", "farmId"] },
    ],
});
exports.default = FarmMember;
