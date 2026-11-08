import { Model, DataTypes, fn, col } from "sequelize";
import { db } from "../config/connectDb";

// A signup request is not a user. It cannot authenticate or own farm data.
class PendingSignup extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public tokenHash!: string | null;
  public expiresAt!: Date;
}

PendingSignup.init(
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
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: "PendingSignup",
    tableName: "pending_signups",
    timestamps: true,
    defaultScope: { attributes: { exclude: ["password", "tokenHash"] } },
    scopes: { withCredentials: {} },
    indexes: [
      {
        name: "pending_signups_email_unique",
        unique: true,
        fields: [fn("LOWER", col("email"))],
      },
      { fields: ["expiresAt"] },
    ],
  },
);

export default PendingSignup;
