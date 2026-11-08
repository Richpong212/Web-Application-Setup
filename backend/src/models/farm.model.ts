import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";
import type FarmMember from "./farmMember.model";

class Farm extends Model {
  public id!: string;
  public ownerId!: string;
  public name!: string;
  public country!: string;
  public location!: string;
  public type!: string;
  public description!: string;
  public houses!: string[];
  public createdAt!: Date;
  public updatedAt!: Date;
  public memberships?: FarmMember[];
}

Farm.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
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
    // Names only for now. Full house entities belong to the poultry-house phase.
    houses: {
      type: DataTypes.ARRAY(DataTypes.STRING(100)),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize: db,
    modelName: "Farm",
    tableName: "farms",
    timestamps: true,
    indexes: [{ fields: ["ownerId"] }],
  },
);

export default Farm;
