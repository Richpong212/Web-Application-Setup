import { db } from "../config/connectDb";
import { Flock, DailyRecord } from "../models";
import { farmAccess, audit } from "./access.service";
import { HttpError } from "../utils/httpError";

export interface FlockInput {
  name: string;
  birdType: string;
  breed?: string;
  supplier?: string;
  supplierContact?: string;
  dateReceived: string;
  ageAtArrivalDays: number;
  initialBirds: number;
  house?: string;
  purchaseCost?: number;
  notes?: string;
}

export const publicFlock = (flock: Flock) => ({
  ...flock.get({ plain: true }),
  purchaseCost: Number(flock.purchaseCost),
});

export const createFlock = async (
  actorId: string,
  farmId: string,
  input: FlockInput,
) => {
  return db.transaction(async (transaction) => {
    const { farm } = await farmAccess(
      actorId,
      farmId,
      "flocks.write",
      transaction,
    );
    if (input.house && !farm.houses.includes(input.house))
      throw new HttpError("VALIDATION_ERROR", [
        { field: "house", message: "Choose a house from this farm." },
      ]);
    const flock = await Flock.create(
      { ...input, farmId, status: "Active" },
      { transaction },
    );
    await audit(
      farmId,
      actorId,
      "flock.created",
      "flock",
      flock.id,
      null,
      input,
      transaction,
    );
    return publicFlock(flock);
  });
};

export const updateFlock = async (
  actorId: string,
  farmId: string,
  flockId: string,
  input: Partial<FlockInput> & { status?: string },
) => {
  return db.transaction(async (transaction) => {
    const { farm } = await farmAccess(
      actorId,
      farmId,
      "flocks.write",
      transaction,
    );
    const flock = await Flock.findOne({
      where: { id: flockId, farmId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!flock) throw new HttpError("NOT_FOUND");
    if (input.house && !farm.houses.includes(input.house))
      throw new HttpError("VALIDATION_ERROR", [
        { field: "house", message: "Choose a house from this farm." },
      ]);
    const mortality =
      Number(
        await DailyRecord.sum("mortality", {
          where: { farmId, flockId },
          transaction,
        }),
      ) || 0;
    if (input.initialBirds !== undefined && input.initialBirds < mortality)
      throw new HttpError("VALIDATION_ERROR", [
        {
          field: "initialBirds",
          message: "Bird count cannot be lower than recorded mortality.",
        },
      ]);
    const before = publicFlock(flock);
    await flock.update(input, { transaction });
    await audit(
      farmId,
      actorId,
      "flock.updated",
      "flock",
      flock.id,
      before,
      publicFlock(flock),
      transaction,
    );
    return publicFlock(flock);
  });
};
