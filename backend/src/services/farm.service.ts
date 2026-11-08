import { permissionNames, resolvePermissions } from "../config/permissions";
import { Transaction } from "sequelize";
import { db } from "../config/connectDb";
import { Farm, FarmMember } from "../models";
import { HttpError } from "../utils/httpError";

export interface FarmInput {
  name: string;
  country: string;
  location: string;
  type: string;
  description?: string;
  houses?: string[];
}

// Public responses omit ownership IDs and membership records.
export const publicFarm = (farm: Farm) => ({
  id: farm.id,
  name: farm.name,
  country: farm.country,
  location: farm.location,
  type: farm.type,
  description: farm.description,
  houses: farm.houses,
  role: farm.memberships?.[0]?.role || "Owner",
  permissions:
    !farm.memberships || farm.memberships[0]?.userId === farm.ownerId
      ? [...permissionNames]
      : resolvePermissions(
          farm.memberships[0]?.role || "Worker",
          farm.memberships[0]?.permissions ?? null,
        ),
  createdAt: farm.createdAt,
  updatedAt: farm.updatedAt,
});

const membership = (userId: string) => ({
  model: FarmMember,
  as: "memberships",
  where: { userId },
  attributes: ["role", "permissions", "userId"],
  required: true,
});

export const createFarm = async (userId: string, input: FarmInput) => {
  return db.transaction(async (transaction) => {
    const farm = await Farm.create(
      { ...input, ownerId: userId },
      { transaction },
    );
    await FarmMember.create(
      { farmId: farm.id, userId, role: "Owner" },
      { transaction },
    );
    return publicFarm(farm);
  });
};

export const listFarms = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const result = await Farm.findAndCountAll({
    include: [membership(userId)],
    distinct: true,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    offset: (page - 1) * limit,
    limit,
  });

  return {
    data: result.rows.map(publicFarm),
    pagination: {
      page,
      limit,
      total: result.count,
      pages: Math.ceil(result.count / limit),
    },
  };
};

export const getFarm = async (userId: string, farmId: string) => {
  const farm = await Farm.findOne({
    where: { id: farmId },
    include: [membership(userId)],
  });
  if (!farm) throw new HttpError("NOT_FOUND");
  return publicFarm(farm);
};

const ownedFarm = async (
  userId: string,
  farmId: string,
  transaction: Transaction,
) => {
  // Use both ownership and membership in the write query. An inaccessible farm
  // returns the same response as a missing one, without revealing its existence.
  const farm = await Farm.findOne({
    where: { id: farmId, ownerId: userId },
    include: [membership(userId)],
    transaction,
    lock: { level: transaction.LOCK.UPDATE, of: Farm },
  });
  if (!farm) throw new HttpError("NOT_FOUND");
  return farm;
};

export const updateFarm = async (
  userId: string,
  farmId: string,
  input: Partial<FarmInput>,
) => {
  return db.transaction(async (transaction) => {
    const farm = await ownedFarm(userId, farmId, transaction);
    await farm.update(input, { transaction });
    return publicFarm(farm);
  });
};

export const deleteFarm = async (userId: string, farmId: string) => {
  await db.transaction(async (transaction) => {
    const farm = await ownedFarm(userId, farmId, transaction);
    await farm.destroy({ transaction });
  });
};

// Append under the farm lock so concurrent additions cannot replace each other.
export const addHouse = async (userId: string, farmId: string, name: string) =>
  db.transaction(async (transaction) => {
    const farm = await ownedFarm(userId, farmId, transaction);
    const existing = farm.houses.find(
      (house) => house.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return { farm: publicFarm(farm), house: existing };
    if (farm.houses.length >= 50)
      throw new HttpError("VALIDATION_ERROR", [
        { field: "name", message: "A farm can have up to 50 houses." },
      ]);
    await farm.update({ houses: [...farm.houses, name] }, { transaction });
    return { farm: publicFarm(farm), house: name };
  });
