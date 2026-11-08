import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class UserToken extends Model {
  public id!: string;
  public userId!: string;
  public purpose!: "reset-password";
  public tokenHash!: string;
  public expiresAt!: Date;
}

// Only token hashes are stored. The original token is sent by email once.
UserToken.init(
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
    purpose: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: { isIn: [["reset-password"]] },
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: "UserToken",
    tableName: "user_tokens",
    timestamps: true,
    indexes: [
      { fields: ["userId", "purpose"], unique: true },
      { fields: ["expiresAt"] },
    ],
  },
);

export default UserToken;
