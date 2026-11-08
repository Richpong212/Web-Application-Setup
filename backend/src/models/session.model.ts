import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class Session extends Model {
  public id!: string;
  public userId!: string;
  public refreshTokenHash!: string;
  public expiresAt!: Date;
  public revokedAt!: Date | null;
}

Session.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    refreshTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: db,
    modelName: "Session",
    tableName: "sessions",
    timestamps: true,
    indexes: [{ fields: ["userId"] }, { fields: ["expiresAt"] }],
  },
);

export default Session;
