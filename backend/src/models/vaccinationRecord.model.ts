import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class VaccinationRecord extends Model {
  public id!: string;
  public farmId!: string;
  public flockId!: string;
  public scheduleId!: string | null;
  public day!: number;
  public name!: string;
  public date!: string;
  public notes!: string;
  public recordedBy!: string;
  public createdBy!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

VaccinationRecord.init(
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
    scheduleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "vaccination_schedules", key: "id" },
      onDelete: "SET NULL",
    },
    day: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
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
    modelName: "VaccinationRecord",
    tableName: "vaccination_records",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
  },
);

export default VaccinationRecord;
