import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class VaccinationSchedule extends Model {
  public id!: string;
  public farmId!: string;
  public day!: number;
  public name!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

VaccinationSchedule.init(
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
    day: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
  },
  {
    sequelize: db,
    modelName: "VaccinationSchedule",
    tableName: "vaccination_schedules",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
  },
);

export default VaccinationSchedule;
