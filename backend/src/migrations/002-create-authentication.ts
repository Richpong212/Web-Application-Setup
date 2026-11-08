import { DataTypes, QueryInterface, Transaction } from "sequelize";

export const up = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  await queryInterface.addColumn(
    "users",
    "isEmailVerified",
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );

  // Normalize legacy nullable flags before enforcing the model's constraint.
  await queryInterface.sequelize.query(
    'UPDATE users SET "isAdmin" = false WHERE "isAdmin" IS NULL',
    { transaction },
  );
  await queryInterface.changeColumn(
    "users",
    "isAdmin",
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );

  const timestamps = {
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  };

  const userReference = {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "users", key: "id" },
    onDelete: "CASCADE" as const,
  };

  await queryInterface.createTable(
    "sessions",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      userId: userReference,
      refreshTokenHash: { type: DataTypes.STRING(64), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      revokedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      ...timestamps,
    },
    { transaction },
  );

  await queryInterface.createTable(
    "user_tokens",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      userId: userReference,
      purpose: { type: DataTypes.STRING(32), allowNull: false },
      tokenHash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      ...timestamps,
    },
    { transaction },
  );

  await queryInterface.addIndex("sessions", ["userId"], { transaction });
  await queryInterface.addIndex("sessions", ["expiresAt"], { transaction });
  await queryInterface.addIndex("user_tokens", ["userId", "purpose"], {
    unique: true,
    transaction,
  });
  await queryInterface.addIndex("user_tokens", ["expiresAt"], { transaction });
};

export const down = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  await queryInterface.dropTable("user_tokens", { transaction });
  await queryInterface.dropTable("sessions", { transaction });
  await queryInterface.removeColumn("users", "isEmailVerified", {
    transaction,
  });
};
