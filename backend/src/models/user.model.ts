import { Model, DataTypes, fn, col } from "sequelize";
import { db } from "../config/connectDb";

class User extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public isAdmin!: boolean;
  public isEmailVerified!: boolean;
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
      validate: { isEmail: true },
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    indexes: [
      {
        name: "users_email_unique",
        unique: true,
        fields: [fn("LOWER", col("email"))],
      },
    ],
    // Password hashes are only loaded explicitly by authentication code.
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: {
        attributes: [
          "id",
          "name",
          "email",
          "password",
          "isEmailVerified",
          "isAdmin",
          "createdAt",
          "updatedAt",
        ],
      },
    },
  },
);

export default User;
