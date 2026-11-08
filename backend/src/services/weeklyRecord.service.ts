import { db } from "../config/connectDb";
import { DailyRecord, Flock } from "../models";
import { farmAccess } from "./access.service";
import { publicRecord } from "./record.service";
import { HttpError } from "../utils/httpError";

const dayMilliseconds = 86400000;
const dayNumber = (date: string) =>
  Date.parse(`${date}T00:00:00Z`) / dayMilliseconds;
const dateAt = (day: number) =>
  new Date(day * dayMilliseconds).toISOString().slice(0, 10);

interface WeeklyFlock {
  id: string;
  name: string;
  house: string;
  dateReceived: string;
  ageAtArrivalDays: number;
  initialBirds: number;
}
interface WeeklyRecord {
  id?: string;
  flockId: string;
  date: string;
  mortality: number;
  feedKg: number;
  eggs: number;
  cause?: string;
  medication?: string;
  activity?: string;
  notes?: string;
  recordedBy?: string;
}

// Farm weeks start on arrival, independently of calendar weeks and bird age.
export const arrivalWeek = (arrival: string, date: string) =>
  Math.floor((dayNumber(date) - dayNumber(arrival)) / 7) + 1;

export const calculateWeek = (
  flock: WeeklyFlock,
  records: WeeklyRecord[],
  week: number,
  asOf: string,
) => {
  const start = dayNumber(flock.dateReceived) + (week - 1) * 7;
  const from = dateAt(start);
  const to = dateAt(start + 6);
  const history = records.filter(
    (record) => record.flockId === flock.id && record.date <= asOf,
  );
  const before = history
    .filter((record) => record.date < from)
    .reduce((sum, record) => sum + record.mortality, 0);
  let cumulativeMortality = before;
  let grams = 0;
  let eggs = 0;
  let mortality = 0;
  let recordedDays = 0;
  let recordedBirdDays = 0;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = dateAt(start + index);
    const record = history.find((item) => item.date === date);
    if (record) {
      cumulativeMortality += record.mortality;
      mortality += record.mortality;
      grams += Math.round(Number(record.feedKg) * 1000);
      eggs += record.eggs;
      recordedDays += 1;
      recordedBirdDays += flock.initialBirds - cumulativeMortality;
    }
    return {
      date,
      future: date > asOf,
      // Missing entries are not zero-activity days. Bird count is based on recorded mortality.
      birds: date <= asOf ? flock.initialBirds - cumulativeMortality : null,
      record: record || null,
    };
  });
  const openingBirds = flock.initialBirds - before;
  return {
    flockId: flock.id,
    flockName: flock.name,
    house: flock.house,
    week,
    from,
    to,
    asOf,
    ageAtStartDays: flock.ageAtArrivalDays + (week - 1) * 7,
    openingBirds,
    closingBirds: flock.initialBirds - cumulativeMortality,
    mortality,
    mortalityRate: openingBirds ? (mortality / openingBirds) * 100 : 0,
    cumulativeMortality,
    cumulativeMortalityRate: flock.initialBirds
      ? (cumulativeMortality / flock.initialBirds) * 100
      : 0,
    feedKg: grams / 1000,
    eggs,
    recordedDays,
    eggRate: recordedBirdDays ? (eggs / recordedBirdDays) * 100 : 0,
    days,
  };
};

export const getWeeklyRecords = async (
  userId: string,
  farmId: string,
  flockId: string,
  week?: number,
) => {
  return db.transaction(async (transaction) => {
    await farmAccess(userId, farmId, "records.read", transaction);
    const flock = await Flock.findOne({
      where: { id: flockId, farmId },
      transaction,
    });
    if (!flock) throw new HttpError("NOT_FOUND");
    const asOf = new Date().toISOString().slice(0, 10);
    const currentWeek = Math.max(1, arrivalWeek(flock.dateReceived, asOf));
    if (week && week > currentWeek)
      throw new HttpError("VALIDATION_ERROR", [
        { field: "week", message: "Choose a week since the flock arrived." },
      ]);
    const records = await DailyRecord.findAll({
      where: { farmId, flockId },
      transaction,
    });
    return {
      ...calculateWeek(
        flock,
        records.map(publicRecord),
        week || currentWeek,
        asOf,
      ),
      currentWeek,
    };
  });
};
