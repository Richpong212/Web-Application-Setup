import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class FeedStage extends Model {
  public id!: string;
  public farmId!: string;
  public fromWeek!: number;
  public toWeek!: number;
  public feed!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

FeedStage.init(
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
    fromWeek: { type: DataTypes.INTEGER, allowNull: false },
    toWeek: { type: DataTypes.INTEGER, allowNull: false },
    feed: { type: DataTypes.STRING(100), allowNull: false },
  },
  {
    sequelize: db,
    modelName: "FeedStage",
    tableName: "feed_stages",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
  },
);

export default FeedStage;
