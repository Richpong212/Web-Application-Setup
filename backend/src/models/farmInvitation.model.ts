import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class FarmInvitation extends Model {
  public id!: string;
  public farmId!: string;
  public email!: string;
  public role!: string;
  public permissions!: string[] | null;
  public tokenHash!: string;
  public expiresAt!: Date;
  public status!: string;
  public invitedBy!: string | null;
  public acceptedBy!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

FarmInvitation.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
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
  },
  {
    sequelize: db,
    modelName: "FarmInvitation",
    tableName: "farm_invitations",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
  },
);

export default FarmInvitation;
