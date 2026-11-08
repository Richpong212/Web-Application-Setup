import { arrivalWeek, calculateWeek } from "./weeklyRecord.service";
import { db } from "../config/connectDb";
import { Flock, DailyRecord } from "../models";
import { farmAccess } from "./access.service";
import { publicRecord } from "./record.service";
import { HttpError } from "../utils/httpError";

interface FlockData {
  id: string;
  name: string;
  initialBirds: number;
  dateReceived: string;
  status: string;
}
interface RecordData {
  flockId: string;
  date: string;
  mortality: number;
  feedKg: number;
  eggs: number;
  cause?: string;
  medication?: string;
  activity?: string;
  notes?: string;
  recordedBy: string;
}

// Pure calculations are shared by reports and dashboard tests. Amounts are added
// in grams to keep three-decimal feed values stable across report totals.
export const calculateReport = (
  flocks: FlockData[],
  records: RecordData[],
  from: string,
  to: string,
) => {
  const eligible = flocks.filter((flock) => flock.dateReceived <= to);
  const ids = new Set(eligible.map((flock) => flock.id));
  const all = records.filter(
    (record) => ids.has(record.flockId) && record.date <= to,
  );
  const period = all
    .filter((record) => record.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date));
  const initialBirds = eligible.reduce(
    (sum, flock) => sum + flock.initialBirds,
    0,
  );
  const mortalityAll = all.reduce((sum, record) => sum + record.mortality, 0);
  const byDay: {
    date: string;
    eggs: number;
    feed: number;
    mort: number;
    rate: number;
  }[] = [];
  let birdDays = 0;
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  for (let time = start; time <= end; time += 86400000) {
    const date = new Date(time).toISOString().slice(0, 10);
    const present = eligible.filter((flock) => flock.dateReceived <= date);
    const presentIds = new Set(present.map((flock) => flock.id));
    const birds =
      present.reduce((sum, flock) => sum + flock.initialBirds, 0) -
      all
        .filter(
          (record) => presentIds.has(record.flockId) && record.date <= date,
        )
        .reduce((sum, record) => sum + record.mortality, 0);
    const rows = period.filter((record) => record.date === date);
    const eggs = rows.reduce((sum, record) => sum + record.eggs, 0);
    birdDays += birds;
    byDay.push({
      date,
      eggs,
      feed:
        rows.reduce(
          (sum, record) => sum + Math.round(Number(record.feedKg) * 1000),
          0,
        ) / 1000,
      mort: rows.reduce((sum, record) => sum + record.mortality, 0),
      rate: birds > 0 ? (eggs / birds) * 100 : 0,
    });
  }
  const feedKg =
    period.reduce(
      (sum, record) => sum + Math.round(Number(record.feedKg) * 1000),
      0,
    ) / 1000;
  const eggs = period.reduce((sum, record) => sum + record.eggs, 0);
  const currentBirds = initialBirds - mortalityAll;
  const activeBirds = eligible
    .filter((flock) => flock.status === "Active")
    .reduce(
      (sum, flock) =>
        sum +
        flock.initialBirds -
        all
          .filter((record) => record.flockId === flock.id)
          .reduce((deaths, record) => deaths + record.mortality, 0),
      0,
    );
  return {
    initialBirds,
    currentBirds,
    activeBirds,
    mortalityAll,
    mortality: period.reduce((sum, record) => sum + record.mortality, 0),
    feedKg,
    eggs,
    averageFeedKg: byDay.length ? feedKg / byDay.length : 0,
    eggRate: birdDays ? (eggs / birdDays) * 100 : 0,
    survivalRate: initialBirds ? (currentBirds / initialBirds) * 100 : 0,
    byDay,
    records: period,
  };
};

export const getReport = async (
  userId: string,
  farmId: string,
  from: string,
  to: string,
  flockId?: string,
  dashboard = false,
) => {
  return db.transaction(async (transaction) => {
    await farmAccess(
      userId,
      farmId,
      dashboard ? "dashboard.read" : "reports.read",
      transaction,
    );
    const flocks = await Flock.findAll({
      where: { farmId, ...(flockId ? { id: flockId } : {}) },
      transaction,
    });
    if (flockId && !flocks.length) throw new HttpError("NOT_FOUND");
    const records = await DailyRecord.findAll({
      where: { farmId, ...(flockId ? { flockId } : {}) },
      transaction,
    });
    const report = calculateReport(
      flocks,
      records.map(publicRecord) as RecordData[],
      from,
      to,
    );
    return {
      ...report,
      ...(dashboard
        ? {
            flockWeeks: flocks
              .filter(
                (flock) =>
                  flock.dateReceived <= to && flock.status === "Active",
              )
              .map((flock) => {
                const { days, ...summary } = calculateWeek(
                  flock,
                  records.map(publicRecord),
                  Math.max(1, arrivalWeek(flock.dateReceived, to)),
                  to,
                );
                void days;
                return summary;
              }),
          }
        : {}),
      activeFlockCount: flocks.filter((flock) => flock.status === "Active")
        .length,
      flocks: flocks.map((flock) => ({ id: flock.id, name: flock.name })),
    };
  });
};

export const reportCsv = (report: Awaited<ReturnType<typeof getReport>>) => {
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = report.records.map((record) =>
    [
      record.date,
      report.flocks.find((flock) => flock.id === record.flockId)?.name || "",
      record.mortality,
      record.cause,
      record.feedKg,
      record.eggs,
      record.medication,
      record.activity,
      record.notes,
      record.recordedBy,
    ]
      .map(cell)
      .join(","),
  );
  return [
    [
      "Date",
      "Flock",
      "Mortality",
      "Cause",
      "Feed (kg)",
      "Eggs",
      "Medication",
      "Activity",
      "Notes",
      "Recorded by",
    ].join(","),
    ...rows,
  ].join("\r\n");
};
