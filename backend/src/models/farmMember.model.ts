import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class FarmMember extends Model {
  public id!: string;
  public farmId!: string;
  public userId!: string;
  public permissions!: string[] | null;
  public role!: "Owner" | "Manager" | "Worker";
}

FarmMember.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING(32)),
      allowNull: true,
      defaultValue: null,
    },
    role: {
      type: DataTypes.STRING(16),
      allowNull: false,
      validate: { isIn: [["Owner", "Manager", "Worker"]] },
    },
  },
  {
    sequelize: db,
    modelName: "FarmMember",
    tableName: "farm_members",
    timestamps: true,
    indexes: [
      { fields: ["farmId", "userId"], unique: true },
      { fields: ["userId", "farmId"] },
    ],
  },
);

export default FarmMember;
