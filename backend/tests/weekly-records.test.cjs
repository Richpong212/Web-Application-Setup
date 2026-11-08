require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { arrivalWeek, calculateWeek } = require("../build/services/weeklyRecord.service");
const flock = { id: "flock", name: "Layers", house: "House 1", dateReceived: "2026-03-25", ageAtArrivalDays: 14, initialBirds: 100 };
const record = (date, values = {}) => ({ flockId: "flock", date, mortality: 0, feedKg: 0, eggs: 0, activity: "Water check", ...values });

test("arrival weeks cross months and daylight saving without using bird age", () => {
  assert.equal(arrivalWeek(flock.dateReceived, "2026-03-25"), 1);
  assert.equal(arrivalWeek(flock.dateReceived, "2026-03-31"), 1);
  assert.equal(arrivalWeek(flock.dateReceived, "2026-04-01"), 2);
  assert.equal(arrivalWeek("2024-02-28", "2024-03-06"), 2);
});

test("weekly rows retain missing days, historical population and precise feed totals", () => {
  const rows = [record("2026-03-25", { mortality: 2 }), record("2026-04-01", { mortality: 1, feedKg: 0.1, eggs: 10 }), record("2026-04-02", { feedKg: 0.2, eggs: 20 }), record("2026-04-08", { mortality: 5 }), { ...record("2026-04-01", { mortality: 50 }), flockId: "other" }];
  const week = calculateWeek(flock, rows, 2, "2026-04-10");
  assert.equal(week.from, "2026-04-01");
  assert.equal(week.to, "2026-04-07");
  assert.equal(week.ageAtStartDays, 21);
  assert.equal(week.openingBirds, 98);
  assert.equal(week.closingBirds, 97);
  assert.equal(week.mortality, 1);
  assert.equal(week.cumulativeMortality, 3);
  assert.equal(week.feedKg, 0.3);
  assert.equal(week.eggs, 30);
  assert.equal(week.recordedDays, 2);
  assert.equal(week.days.length, 7);
  assert.equal(week.days[2].record, null);
  assert.equal(week.days[2].birds, 97);
  assert.equal(week.eggRate, 30 / 194 * 100);
});

test("partial weeks exclude future data and distinguish saved zero from missing", () => {
  const week = calculateWeek(flock, [record("2026-03-25"), record("2026-03-27", { mortality: 10 })], 1, "2026-03-26");
  assert.equal(week.recordedDays, 1);
  assert.equal(week.days[0].record.eggs, 0);
  assert.equal(week.days[1].record, null);
  assert.equal(week.days[2].future, true);
  assert.equal(week.days[2].birds, null);
  assert.equal(week.days[2].record, null);
  assert.equal(week.closingBirds, 100);
});
