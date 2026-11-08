import { DataTypes, QueryInterface, Transaction } from "sequelize";

export const up = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  const timestamps = {
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  };

  await queryInterface.createTable(
    "farms",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      name: { type: DataTypes.STRING(100), allowNull: false },
      country: { type: DataTypes.STRING(100), allowNull: false },
      location: { type: DataTypes.STRING(200), allowNull: false },
      type: { type: DataTypes.STRING(50), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      houses: {
        type: DataTypes.ARRAY(DataTypes.STRING(100)),
        allowNull: false,
        defaultValue: [],
      },
      ...timestamps,
    },
    { transaction },
  );

  await queryInterface.createTable(
    "farm_members",
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      farmId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "farms", key: "id" },
        onDelete: "CASCADE",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      role: { type: DataTypes.STRING(16), allowNull: false },
      ...timestamps,
    },
    { transaction },
  );

  await queryInterface.addIndex("farms", ["ownerId"], { transaction });
  await queryInterface.addIndex("farm_members", ["farmId", "userId"], {
    unique: true,
    transaction,
  });
  await queryInterface.addIndex("farm_members", ["userId", "farmId"], {
    transaction,
  });
  await queryInterface.sequelize.query(
    `ALTER TABLE farm_members ADD CONSTRAINT farm_members_role_check CHECK (role IN ('Owner', 'Manager', 'Worker'))`,
    { transaction },
  );
};

export const down = async (
  queryInterface: QueryInterface,
  transaction: Transaction,
) => {
  await queryInterface.dropTable("farm_members", { transaction });
  await queryInterface.dropTable("farms", { transaction });
};
