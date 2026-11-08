import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class User extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public isAdmin!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);

export default User;
