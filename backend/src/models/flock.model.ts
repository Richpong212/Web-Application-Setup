import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class Flock extends Model {
  public id!: string;
  public farmId!: string;
  public name!: string;
  public birdType!: string;
  public breed!: string;
  public supplier!: string;
  public supplierContact!: string;
  public dateReceived!: string;
  public ageAtArrivalDays!: number;
  public initialBirds!: number;
  public house!: string;
  public purchaseCost!: number;
  public status!: string;
  public notes!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Flock.init(
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
    name: { type: DataTypes.STRING(100), allowNull: false },
    birdType: { type: DataTypes.STRING(16), allowNull: false },
    breed: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "" },
    supplier: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: "",
    },
    supplierContact: {
      type: DataTypes.STRING(150),
      allowNull: false,
      defaultValue: "",
    },
    dateReceived: { type: DataTypes.DATEONLY, allowNull: false },
    ageAtArrivalDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    initialBirds: { type: DataTypes.INTEGER, allowNull: false },
    house: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "" },
    purchaseCost: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: "Active",
    },
    notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  },
  {
    sequelize: db,
    modelName: "Flock",
    tableName: "flocks",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
  },
);

export default Flock;
