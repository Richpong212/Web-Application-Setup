import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class DailyRecord extends Model {
  public id!: string;
  public farmId!: string;
  public flockId!: string;
  public date!: string;
  public mortality!: number;
  public cause!: string;
  public feedKg!: number;
  public eggs!: number;
  public medication!: string;
  public activity!: string;
  public notes!: string;
  public recordedBy!: string;
  public createdBy!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

DailyRecord.init(
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
    flockId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "flocks", key: "id" },
      onDelete: "CASCADE",
    },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    mortality: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cause: { type: DataTypes.STRING(200), allowNull: false, defaultValue: "" },
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
  },
  {
    sequelize: db,
    modelName: "DailyRecord",
    tableName: "daily_records",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
  },
);

export default DailyRecord;
