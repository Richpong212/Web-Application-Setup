import { DataTypes, QueryInterface, Transaction } from "sequelize";

export const up = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  await queryInterface.addColumn(
    "farm_members",
    "permissions",
    {
      type: DataTypes.ARRAY(DataTypes.STRING(32)),
      allowNull: true,
      defaultValue: null,
    },
    { transaction },
  );
  await queryInterface.createTable(
    "flocks",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      name: { type: DataTypes.STRING(100), allowNull: false },
      birdType: { type: DataTypes.STRING(16), allowNull: false },
      breed: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "",
      },
      supplier: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: "",
      },
      supplierContact: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: "",
      },
      dateReceived: { type: DataTypes.DATEONLY, allowNull: false },
      ageAtArrivalDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      initialBirds: { type: DataTypes.INTEGER, allowNull: false },
      house: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "",
      },
      purchaseCost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "Active",
      },
      notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex("flocks", ["farmId"], { transaction });
  await queryInterface.createTable(
    "daily_records",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      flockId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "flocks", key: "id" },
        onDelete: "CASCADE",
      },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      mortality: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      cause: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: "",
      },
      feedKg: {
        type: DataTypes.DECIMAL(14, 3),
        allowNull: false,
        defaultValue: 0,
      },
      eggs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      medication: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      activity: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      recordedBy: { type: DataTypes.STRING(100), allowNull: false },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex("daily_records", ["farmId"], { transaction });
  await queryInterface.createTable(
    "feed_stages",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      fromWeek: { type: DataTypes.INTEGER, allowNull: false },
      toWeek: { type: DataTypes.INTEGER, allowNull: false },
      feed: { type: DataTypes.STRING(100), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex("feed_stages", ["farmId"], { transaction });
  await queryInterface.createTable(
    "vaccination_schedules",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      day: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(150), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex("vaccination_schedules", ["farmId"], {
    transaction,
  });
  await queryInterface.createTable(
    "vaccination_records",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      flockId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "flocks", key: "id" },
        onDelete: "CASCADE",
      },
      scheduleId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "vaccination_schedules", key: "id" },
        onDelete: "SET NULL",
      },
      day: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING(150), allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      recordedBy: { type: DataTypes.STRING(100), allowNull: false },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex("vaccination_records", ["farmId"], {
    transaction,
  });
  await queryInterface.createTable(
    "farm_tasks",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      title: { type: DataTypes.STRING(200), allowNull: false },
      due: { type: DataTypes.DATEONLY, allowNull: false },
      assigneeId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      completedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex("farm_tasks", ["farmId"], { transaction });
  await queryInterface.createTable(
    "farm_invitations",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      email: { type: DataTypes.STRING(254), allowNull: false },
      role: { type: DataTypes.STRING(16), allowNull: false },
      permissions: {
        type: DataTypes.ARRAY(DataTypes.STRING(32)),
        allowNull: true,
      },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      status: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: "Pending",
      },
      invitedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      acceptedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex("farm_invitations", ["farmId"], {
    transaction,
  });
  await queryInterface.createTable(
    "audit_logs",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      actorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      action: { type: DataTypes.STRING(80), allowNull: false },
      entityType: { type: DataTypes.STRING(40), allowNull: false },
      entityId: { type: DataTypes.UUID, allowNull: false },
      reason: {
        type: DataTypes.STRING(500),
        allowNull: false,
        defaultValue: "",
      },
      before: { type: DataTypes.JSONB, allowNull: true },
      after: { type: DataTypes.JSONB, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
  await queryInterface.addIndex("audit_logs", ["farmId"], { transaction });
  await queryInterface.addIndex("flocks", ["farmId", "id"], {
    unique: true,
    transaction,
  });
  await queryInterface.addIndex("daily_records", ["flockId", "date"], {
    unique: true,
    transaction,
  });
  await queryInterface.addIndex("daily_records", ["farmId", "date"], {
    transaction,
  });
  await queryInterface.addIndex(
    "vaccination_records",
    ["flockId", "scheduleId"],
    { unique: true, transaction },
  );
  await queryInterface.addIndex("farm_invitations", ["tokenHash"], {
    unique: true,
    transaction,
  });
  await queryInterface.sequelize.query(
    `CREATE UNIQUE INDEX farm_invitations_pending_email ON farm_invitations ("farmId", LOWER(email)) WHERE status = 'Pending'`,
    { transaction },
  );
  for (const table of ["daily_records", "vaccination_records"]) {
    await queryInterface.sequelize.query(
      `ALTER TABLE ${table} ADD CONSTRAINT ${table}_flock_scope FOREIGN KEY ("farmId", "flockId") REFERENCES flocks ("farmId", id) ON DELETE CASCADE`,
      { transaction },
    );
  }
  await queryInterface.sequelize.query(
    `ALTER TABLE daily_records ADD CONSTRAINT daily_records_nonnegative CHECK (mortality >= 0 AND "feedKg" >= 0 AND eggs >= 0)`,
    { transaction },
  );
  await queryInterface.sequelize.query(
    `ALTER TABLE flocks ADD CONSTRAINT flocks_population_check CHECK ("initialBirds" > 0 AND "ageAtArrivalDays" >= 0 AND status IN ('Active', 'Closed') AND "birdType" IN ('Layers', 'Broilers', 'Other'))`,
    { transaction },
  );
  await queryInterface.sequelize.query(
    `ALTER TABLE feed_stages ADD CONSTRAINT feed_stages_range CHECK ("fromWeek" > 0 AND "toWeek" >= "fromWeek")`,
    { transaction },
  );
  await queryInterface.sequelize.query(
    `ALTER TABLE vaccination_schedules ADD CONSTRAINT vaccination_schedule_day CHECK (day >= 0)`,
    { transaction },
  );
  await queryInterface.sequelize.query(
    `ALTER TABLE farm_invitations ADD CONSTRAINT farm_invitation_role CHECK (role IN ('Manager', 'Worker') AND status IN ('Pending', 'Accepted', 'Revoked'))`,
    { transaction },
  );
};

export const down = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  await queryInterface.dropTable("audit_logs", { transaction });
  await queryInterface.dropTable("farm_invitations", { transaction });
  await queryInterface.dropTable("farm_tasks", { transaction });
  await queryInterface.dropTable("vaccination_records", { transaction });
  await queryInterface.dropTable("vaccination_schedules", { transaction });
  await queryInterface.dropTable("feed_stages", { transaction });
  await queryInterface.dropTable("daily_records", { transaction });
  await queryInterface.dropTable("flocks", { transaction });
  await queryInterface.removeColumn("farm_members", "permissions", {
    transaction,
  });
};
