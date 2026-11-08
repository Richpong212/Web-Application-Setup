"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const sequelize_1 = require("sequelize");
const up = (queryInterface, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamps = {
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    };
    yield queryInterface.createTable("farms", Object.assign({ id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false }, ownerId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
        }, name: { type: sequelize_1.DataTypes.STRING(100), allowNull: false }, country: { type: sequelize_1.DataTypes.STRING(100), allowNull: false }, location: { type: sequelize_1.DataTypes.STRING(200), allowNull: false }, type: { type: sequelize_1.DataTypes.STRING(50), allowNull: false }, description: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: "" }, houses: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING(100)),
            allowNull: false,
            defaultValue: [],
        } }, timestamps), { transaction });
    yield queryInterface.createTable("farm_members", Object.assign({ id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false }, farmId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "farms", key: "id" },
            onDelete: "CASCADE",
        }, userId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
        }, role: { type: sequelize_1.DataTypes.STRING(16), allowNull: false } }, timestamps), { transaction });
    yield queryInterface.addIndex("farms", ["ownerId"], { transaction });
    yield queryInterface.addIndex("farm_members", ["farmId", "userId"], {
        unique: true,
        transaction,
    });
    yield queryInterface.addIndex("farm_members", ["userId", "farmId"], {
        transaction,
    });
    yield queryInterface.sequelize.query(`ALTER TABLE farm_members ADD CONSTRAINT farm_members_role_check CHECK (role IN ('Owner', 'Manager', 'Worker'))`, { transaction });
});
exports.up = up;
const down = (queryInterface, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    yield queryInterface.dropTable("farm_members", { transaction });
    yield queryInterface.dropTable("farms", { transaction });
});
exports.down = down;
