import { DataTypes, QueryInterface, QueryTypes, Transaction } from "sequelize";

export const up = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  await queryInterface.createTable(
    "pending_signups",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      tokenHash: { type: DataTypes.STRING(64), allowNull: true, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.sequelize.query(
    "CREATE UNIQUE INDEX pending_signups_email_unique ON pending_signups (LOWER(email))",
    { transaction },
  );
  await queryInterface.addIndex("pending_signups", ["expiresAt"], {
    transaction,
  });

  // Preserve earlier unapproved registrations as pending requests. Their hashes
  // and existing approval links survive, but they no longer exist as users.
  await queryInterface.sequelize.query(
    `
    INSERT INTO pending_signups (id, name, email, password, "tokenHash", "expiresAt", "createdAt", "updatedAt")
    SELECT u.id, u.name, u.email, u.password, t."tokenHash",
      COALESCE(t."expiresAt", NOW() + INTERVAL '24 hours'), u."createdAt", u."updatedAt"
    FROM users u
    LEFT JOIN user_tokens t ON t."userId" = u.id AND t.purpose = 'verify-email'
    WHERE u."isEmailVerified" = false
  `,
    { transaction },
  );

  // Cascades remove unusable sessions and old user-bound email tokens.
  await queryInterface.sequelize.query(
    'DELETE FROM users WHERE "isEmailVerified" = false',
    { transaction },
  );
  await queryInterface.sequelize.query(
    "DELETE FROM user_tokens WHERE purpose = 'verify-email'",
    { transaction },
  );
  await queryInterface.changeColumn(
    "users",
    "isEmailVerified",
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    { transaction },
  );
};

export const down = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  const [result] = await queryInterface.sequelize.query<{ count: string }>(
    "SELECT COUNT(*) AS count FROM pending_signups",
    { type: QueryTypes.SELECT, transaction },
  );

  // A rollback must never silently discard pending credentials or create users
  // who have not approved their signup. Resolve/export pending requests first.
  if (Number(result?.count) > 0) {
    throw new Error(
      "Cannot roll back while pending signups exist; preserve or resolve them first",
    );
  }

  await queryInterface.dropTable("pending_signups", { transaction });
  await queryInterface.changeColumn(
    "users",
    "isEmailVerified",
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );
};
