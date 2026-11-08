"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const connectDb_1 = require("../config/connectDb");
class FeedStage extends sequelize_1.Model {
}
FeedStage.init({
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
    fromWeek: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    toWeek: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    feed: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
}, {
    sequelize: connectDb_1.db,
    modelName: "FeedStage",
    tableName: "feed_stages",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
});
exports.default = FeedStage;
