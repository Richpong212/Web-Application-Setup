import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class FarmTask extends Model {
  public id!: string;
  public farmId!: string;
  public title!: string;
  public due!: string;
  public assigneeId!: string | null;
  public done!: boolean;
  public completedAt!: Date | null;
  public completedBy!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

FarmTask.init(
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
  },
  {
    sequelize: db,
    modelName: "FarmTask",
    tableName: "farm_tasks",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
  },
);

export default FarmTask;
