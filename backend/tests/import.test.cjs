const { serve } = require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { createApp } = require("../build/app");
const { db } = require("../build/config/connectDb");
const { runMigrations } = require("../build/database/migrate");
const {
  User,
  PendingSignup,
  Farm,
  FarmMember,
  Flock,
  DailyRecord,
  AuditLog,
} = require("../build/models");
const {
  permissionNames,
  defaultPermissions,
} = require("../build/config/permissions");
const { createInbox } = require("./smtp.cjs");

const tokenFrom = (message) =>
  message
    .replace(/=\r\n/g, "")
    .replace(/=3D/gi, "=")
    .match(/token=([a-f0-9]{64})/)[1];

test(
  "history imports require an explicit grant, preserve existing data and commit atomically",
  { timeout: 90000 },
  async () => {
    assert.equal(db.getDatabaseName(), "backend_test");
    assert.ok(permissionNames.includes("records.import"));
    assert.ok(!defaultPermissions.Worker.includes("records.import"));
    assert.ok(!defaultPermissions.Manager.includes("records.import"));
    const suffix = randomUUID();
    const emails = ["owner", "worker", "outsider"].map(
      (name) => `import-${name}-${suffix}@rp-ranch.test`,
    );
    const inbox = await createInbox();
    try {
      await runMigrations();
      await serve(
        createApp({ database: db, cache: {}, cacheEnabled: false }),
        async (url) => {
          const request = (path, method = "GET", body, actor) =>
            fetch(`${url}/api/v1${path}`, {
              method,
              headers: {
                ...(body ? { "content-type": "application/json" } : {}),
                ...(actor
                  ? { authorization: `Bearer ${actor.accessToken}` }
                  : {}),
              },
              ...(body ? { body: JSON.stringify(body) } : {}),
            });
          const approved = async (email) => {
            const password = "History Import Password42!";
            assert.equal(
              (
                await request("/auth/register", "POST", {
                  name: "History Operator",
                  email,
                  password,
                })
              ).status,
              202,
            );
            assert.equal(
              (
                await request("/auth/verify-email", "POST", {
                  token: tokenFrom(inbox.messages.at(-1)),
                })
              ).status,
              200,
            );
            const response = await request("/auth/login", "POST", {
              email,
              password,
            });
            assert.equal(response.status, 200);
            return (await response.json()).data;
          };
          const owner = await approved(emails[0]);
          const worker = await approved(emails[1]);
          const outsider = await approved(emails[2]);
          const farmResponse = await request(
            "/farms",
            "POST",
            {
              name: "History Farm",
              country: "Ghana",
              location: "Assesso",
              type: "Poultry",
              houses: ["House 1"],
            },
            owner,
          );
          const farm = (await farmResponse.json()).data;
          const path = `/farms/${farm.id}`;
          const flockResponse = await request(
            `${path}/flocks`,
            "POST",
            {
              name: "Historical flock",
              birdType: "Layers",
              dateReceived: "2026-01-01",
              ageAtArrivalDays: 1,
              initialBirds: 391,
              house: "House 1",
            },
            owner,
          );
          assert.equal(flockResponse.status, 201);
          const flock = (await flockResponse.json()).data;
          // Exercise historical imports into a closed flock, without reopening it.
          assert.equal(
            (
              await request(
                `${path}/flocks/${flock.id}`,
                "PATCH",
                { status: "Closed" },
                owner,
              )
            ).status,
            200,
          );
          const member = await FarmMember.create({
            farmId: farm.id,
            userId: worker.user.id,
            role: "Worker",
            permissions: ["records.write"],
          });
          const row = {
            source: "WEEK 1 row 2",
            date: "2026-01-01",
            mortality: 1,
            feedKg: 4.3,
            eggs: 0,
            cause: "Upon arrival",
            medication: "Vitamins",
            activity: "",
            notes: "Workbook bird count: 391.",
          };
          const input = {
            flockId: flock.id,
            fileName: "history.xlsx",
            rows: [row],
          };
          assert.equal(
            (await request(`${path}/imports/preview`, "POST", input, worker))
              .status,
            403,
          );
          assert.equal(
            (await request(`${path}/imports/commit`, "POST", input, worker))
              .status,
            403,
          );
          assert.equal(
            (await request(`${path}/imports/preview`, "POST", input, outsider))
              .status,
            404,
          );
          const preview = await request(
            `${path}/imports/preview`,
            "POST",
            input,
            owner,
          );
          assert.equal(preview.status, 200);
          assert.equal((await preview.json()).data.ready, 1);
          assert.equal(
            await DailyRecord.count({ where: { farmId: farm.id } }),
            0,
          );
          await member.update({ permissions: ["records.import"] });
          const imported = await request(
            `${path}/imports/commit`,
            "POST",
            input,
            worker,
          );
          assert.equal(imported.status, 200);
          assert.equal((await imported.json()).data.imported, 1);
          const saved = await DailyRecord.findOne({
            where: { farmId: farm.id },
          });
          assert.equal(saved.createdBy, worker.user.id);
          assert.equal(saved.medication, "Vitamins");
          assert.equal(
            await AuditLog.count({
              where: { farmId: farm.id, action: "records.imported" },
            }),
            1,
          );
          const retry = await request(
            `${path}/imports/commit`,
            "POST",
            input,
            worker,
          );
          assert.equal((await retry.json()).data.skipped, 1);
          assert.equal(
            await DailyRecord.count({ where: { farmId: farm.id } }),
            1,
          );
          const conflict = {
            ...input,
            rows: [
              { ...row, feedKg: 99 },
              { ...row, source: "WEEK 1 row 3", date: "2026-01-02" },
            ],
          };
          const conflictPreview = await request(
            `${path}/imports/preview`,
            "POST",
            conflict,
            worker,
          );
          assert.equal((await conflictPreview.json()).data.errors, 1);
          assert.equal(
            (await request(`${path}/imports/commit`, "POST", conflict, worker))
              .status,
            400,
          );
          assert.equal(
            await DailyRecord.count({ where: { farmId: farm.id } }),
            1,
          );
          assert.equal(Number((await saved.reload()).feedKg), 4.3);
          for (const invalid of [
            { ...row, mortality: "o" },
            { ...row, feedKg: -1 },
            { ...row, date: "2099-01-01" },
            { ...row, date: "2025-12-31" },
            { ...row, date: "2026-01-03", mortality: 391 },
          ]) {
            assert.equal(
              (
                await request(
                  `${path}/imports/commit`,
                  "POST",
                  { ...input, rows: [invalid] },
                  worker,
                )
              ).status,
              400,
            );
          }
          const repeatedDate = await request(
            `${path}/imports/commit`,
            "POST",
            {
              ...input,
              rows: [
                { ...row, date: "2026-01-04" },
                { ...row, date: "2026-01-04" },
              ],
            },
            worker,
          );
          assert.equal(repeatedDate.status, 400);
          const concurrentInput = {
            ...input,
            rows: [{ ...row, source: "WEEK 1 row 5", date: "2026-01-05" }],
          };
          const concurrent = await Promise.all(
            [1, 2].map(() =>
              request(
                `${path}/imports/commit`,
                "POST",
                concurrentInput,
                worker,
              ),
            ),
          );
          assert.ok(concurrent.every((response) => response.status === 200));
          const concurrentResults = await Promise.all(
            concurrent.map((response) => response.json()),
          );
          assert.equal(
            concurrentResults.reduce(
              (sum, result) => sum + result.data.imported,
              0,
            ),
            1,
          );
          assert.equal(
            concurrentResults.reduce(
              (sum, result) => sum + result.data.skipped,
              0,
            ),
            1,
          );
          await member.update({ permissions: [] });
          assert.equal(
            (
              await request(
                `${path}/imports/commit`,
                "POST",
                { ...input, rows: [{ ...row, date: "2026-01-02" }] },
                worker,
              )
            ).status,
            403,
          );
          assert.equal(
            await DailyRecord.count({ where: { farmId: farm.id } }),
            2,
          );
          assert.equal((await Flock.findByPk(flock.id)).status, "Closed");
        },
      );
    } finally {
      const users = await User.findAll({ where: { email: emails } });
      await Farm.destroy({ where: { ownerId: users.map((user) => user.id) } });
      await User.destroy({ where: { email: emails } });
      await PendingSignup.destroy({ where: { email: emails } });
      await inbox.close();
      await db.close();
    }
  },
);
