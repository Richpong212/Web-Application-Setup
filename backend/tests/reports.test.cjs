require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateReport,
  reportCsv,
} = require("../build/services/report.service");
const {
  resolvePermissions,
  permissionNames,
} = require("../build/config/permissions");

test("custom grants do not inherit a role's other privileges", () => {
  assert.deepEqual(resolvePermissions("Manager", []), []);
  assert.deepEqual(resolvePermissions("Worker", ["tasks.complete"]), [
    "tasks.read",
    "tasks.complete",
  ]);
  assert.ok(resolvePermissions("Worker", ["records.read"]).includes("flocks.read"));
  assert.ok(resolvePermissions("Manager", null).includes("records.correct"));
  assert.ok(!resolvePermissions("Worker", null).includes("reports.read"));
  assert.ok(
    !permissionNames.some(
      (name) => name.startsWith("farm.") || name.startsWith("team."),
    ),
  );
});

test("reports use historical mortality, calendar-day averages and bird-day egg rates", () => {
  const flocks = [
    {
      id: "flock-a",
      name: "Layers",
      initialBirds: 10,
      dateReceived: "2026-11-01",
      status: "Active",
    },
  ];
  const records = [
    {
      flockId: "flock-a",
      date: "2026-11-01",
      mortality: 1,
      feedKg: 0.1,
      eggs: 9,
      recordedBy: "Farmer",
    },
    {
      flockId: "flock-a",
      date: "2026-11-03",
      mortality: 2,
      feedKg: 0.2,
      eggs: 7,
      recordedBy: "Farmer",
    },
  ];
  const first = calculateReport(flocks, records, "2026-11-01", "2026-11-02");
  assert.equal(first.currentBirds, 9);
  assert.equal(first.mortalityAll, 1);
  assert.equal(first.feedKg, 0.1);
  assert.equal(first.averageFeedKg, 0.05);
  assert.equal(first.eggRate, 50);
  assert.equal(first.byDay.length, 2);
  const second = calculateReport(flocks, records, "2026-11-02", "2026-11-03");
  assert.equal(second.currentBirds, 7);
  assert.equal(second.mortalityAll, 3);
  assert.equal(second.mortality, 2);
  assert.equal(second.feedKg, 0.2);
  assert.equal(second.eggRate, (7 / 16) * 100);
  assert.equal(calculateReport([], [], "2026-11-01", "2026-11-01").eggRate, 0);
});

test("CSV escapes delimiters and neutralizes spreadsheet formula cells", () => {
  const report = {
    flocks: [{ id: "a", name: '=HYPERLINK("bad")' }],
    records: [
      {
        flockId: "a",
        date: "2026-11-01",
        mortality: 0,
        feedKg: 1,
        eggs: 1,
        notes: 'note, with "quotes"',
        recordedBy: "+Formula",
      },
    ],
  };
  const csv = reportCsv(report);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"note, with ""quotes"""'));
  assert.ok(csv.includes('"\'+Formula"'));
});
