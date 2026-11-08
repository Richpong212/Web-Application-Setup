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
    yield queryInterface.addColumn("farm_members", "permissions", {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING(32)),
        allowNull: true,
        defaultValue: null,
    }, { transaction });
    yield queryInterface.createTable("flocks", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
        farmId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "farms", key: "id" },
            onDelete: "CASCADE",
        },
        name: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
        birdType: { type: sequelize_1.DataTypes.STRING(16), allowNull: false },
        breed: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "",
        },
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
        house: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "",
        },
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
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.addIndex("flocks", ["farmId"], { transaction });
    yield queryInterface.createTable("daily_records", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
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
        cause: {
            type: sequelize_1.DataTypes.STRING(200),
            allowNull: false,
            defaultValue: "",
        },
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
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.addIndex("daily_records", ["farmId"], { transaction });
    yield queryInterface.createTable("feed_stages", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
        farmId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "farms", key: "id" },
            onDelete: "CASCADE",
        },
        fromWeek: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        toWeek: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        feed: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.addIndex("feed_stages", ["farmId"], { transaction });
    yield queryInterface.createTable("vaccination_schedules", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
        farmId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "farms", key: "id" },
            onDelete: "CASCADE",
        },
        day: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        name: { type: sequelize_1.DataTypes.STRING(150), allowNull: false },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.addIndex("vaccination_schedules", ["farmId"], {
        transaction,
    });
    yield queryInterface.createTable("vaccination_records", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
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
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.addIndex("vaccination_records", ["farmId"], {
        transaction,
    });
    yield queryInterface.createTable("farm_tasks", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
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
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.addIndex("farm_tasks", ["farmId"], { transaction });
    yield queryInterface.createTable("farm_invitations", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
        farmId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: false,
            references: { model: "farms", key: "id" },
            onDelete: "CASCADE",
        },
        email: { type: sequelize_1.DataTypes.STRING(254), allowNull: false },
        role: { type: sequelize_1.DataTypes.STRING(16), allowNull: false },
        permissions: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING(32)),
            allowNull: true,
        },
        tokenHash: { type: sequelize_1.DataTypes.STRING(64), allowNull: false },
        expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        status: {
            type: sequelize_1.DataTypes.STRING(16),
            allowNull: false,
            defaultValue: "Pending",
        },
        invitedBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
        acceptedBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: { model: "users", key: "id" },
            onDelete: "SET NULL",
        },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.addIndex("farm_invitations", ["farmId"], {
        transaction,
    });
    yield queryInterface.createTable("audit_logs", {
        id: { type: sequelize_1.DataTypes.UUID, primaryKey: true, allowNull: false },
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
        reason: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: false,
            defaultValue: "",
        },
        before: { type: sequelize_1.DataTypes.JSONB, allowNull: true },
        after: { type: sequelize_1.DataTypes.JSONB, allowNull: true },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    }, { transaction });
    yield queryInterface.addIndex("audit_logs", ["farmId"], { transaction });
    yield queryInterface.addIndex("flocks", ["farmId", "id"], {
        unique: true,
        transaction,
    });
    yield queryInterface.addIndex("daily_records", ["flockId", "date"], {
        unique: true,
        transaction,
    });
    yield queryInterface.addIndex("daily_records", ["farmId", "date"], {
        transaction,
    });
    yield queryInterface.addIndex("vaccination_records", ["flockId", "scheduleId"], { unique: true, transaction });
    yield queryInterface.addIndex("farm_invitations", ["tokenHash"], {
        unique: true,
        transaction,
    });
    yield queryInterface.sequelize.query(`CREATE UNIQUE INDEX farm_invitations_pending_email ON farm_invitations ("farmId", LOWER(email)) WHERE status = 'Pending'`, { transaction });
    for (const table of ["daily_records", "vaccination_records"]) {
        yield queryInterface.sequelize.query(`ALTER TABLE ${table} ADD CONSTRAINT ${table}_flock_scope FOREIGN KEY ("farmId", "flockId") REFERENCES flocks ("farmId", id) ON DELETE CASCADE`, { transaction });
    }
    yield queryInterface.sequelize.query(`ALTER TABLE daily_records ADD CONSTRAINT daily_records_nonnegative CHECK (mortality >= 0 AND "feedKg" >= 0 AND eggs >= 0)`, { transaction });
    yield queryInterface.sequelize.query(`ALTER TABLE flocks ADD CONSTRAINT flocks_population_check CHECK ("initialBirds" > 0 AND "ageAtArrivalDays" >= 0 AND status IN ('Active', 'Closed') AND "birdType" IN ('Layers', 'Broilers', 'Other'))`, { transaction });
    yield queryInterface.sequelize.query(`ALTER TABLE feed_stages ADD CONSTRAINT feed_stages_range CHECK ("fromWeek" > 0 AND "toWeek" >= "fromWeek")`, { transaction });
    yield queryInterface.sequelize.query(`ALTER TABLE vaccination_schedules ADD CONSTRAINT vaccination_schedule_day CHECK (day >= 0)`, { transaction });
    yield queryInterface.sequelize.query(`ALTER TABLE farm_invitations ADD CONSTRAINT farm_invitation_role CHECK (role IN ('Manager', 'Worker') AND status IN ('Pending', 'Accepted', 'Revoked'))`, { transaction });
});
exports.up = up;
const down = (queryInterface, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    yield queryInterface.dropTable("audit_logs", { transaction });
    yield queryInterface.dropTable("farm_invitations", { transaction });
    yield queryInterface.dropTable("farm_tasks", { transaction });
    yield queryInterface.dropTable("vaccination_records", { transaction });
    yield queryInterface.dropTable("vaccination_schedules", { transaction });
    yield queryInterface.dropTable("feed_stages", { transaction });
    yield queryInterface.dropTable("daily_records", { transaction });
    yield queryInterface.dropTable("flocks", { transaction });
    yield queryInterface.removeColumn("farm_members", "permissions", {
        transaction,
    });
});
exports.down = down;
