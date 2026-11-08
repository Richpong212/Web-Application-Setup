import { Model, DataTypes } from "sequelize";
import { db } from "../config/connectDb";

class AuditLog extends Model {
  public id!: string;
  public farmId!: string;
  public actorId!: string | null;
  public action!: string;
  public entityType!: string;
  public entityId!: string;
  public reason!: string;
  public before!: Record<string, unknown> | null;
  public after!: Record<string, unknown> | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

AuditLog.init(
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
    actorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    action: { type: DataTypes.STRING(80), allowNull: false },
    entityType: { type: DataTypes.STRING(40), allowNull: false },
    entityId: { type: DataTypes.UUID, allowNull: false },
    reason: { type: DataTypes.STRING(500), allowNull: false, defaultValue: "" },
    before: { type: DataTypes.JSONB, allowNull: true },
    after: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize: db,
    modelName: "AuditLog",
    tableName: "audit_logs",
    timestamps: true,
    indexes: [{ fields: ["farmId"] }],
  },
);

export default AuditLog;
