import { DataTypes, QueryInterface, Transaction } from "sequelize";

// Keep database columns aligned with User.init in models/user.model.ts.
export const up = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  await queryInterface.createTable(
    "users",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    { transaction },
  );

  await queryInterface.sequelize.query(
    "UPDATE users SET email = LOWER(TRIM(email))",
    { transaction },
  );

  // Enforce uniqueness in PostgreSQL, including simultaneous registrations.
  // Existing duplicate emails cause the migration to fail rather than lose data.
  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email))",
    { transaction },
  );
};

export const down = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  await queryInterface.dropTable("users", { transaction });
};
