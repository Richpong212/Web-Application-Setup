const { serve } = require("./setup.cjs");
process.env.GLOBAL_RATE_LIMIT_MAX = "3000";
process.env.AUTH_RATE_LIMIT_MAX = "1000";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Op } = require("sequelize");
const { createApp } = require("../build/app");
const { db } = require("../build/config/connectDb");
const { runMigrations } = require("../build/database/migrate");
const {
  User,
  PendingSignup,
  FarmMember,
  FarmInvitation,
  DailyRecord,
  AuditLog,
  VaccinationRecord,
  Flock,
} = require("../build/models");
const { createInbox } = require("./smtp.cjs");
const tokenFrom = (message) =>
  message
    .replace(/=\r\n/g, "")
    .replace(/=3D/gi, "=")
    .match(/token=([a-f0-9]{64})/)[1];
const date = (offset) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

test(
  "team invitations, custom permissions and every operational module enforce farm scope",
  { timeout: 90000 },
  async () => {
    assert.equal(db.getDatabaseName(), "backend_test");
    const suffix = randomUUID();
    const emails = [
      `ops-owner-${suffix}@rp-ranch.test`,
      `ops-worker-${suffix}@rp-ranch.test`,
      `ops-other-${suffix}@rp-ranch.test`,
    ];
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
                ...(body === undefined
                  ? {}
                  : { "content-type": "application/json" }),
                ...(actor
                  ? { authorization: `Bearer ${actor.accessToken}` }
                  : {}),
              },
              ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            });
          const approved = async (email) => {
            const password = "Farm Operator Password42!";
            assert.equal(
              (
                await request("/auth/register", "POST", {
                  name: "Farm Operator",
                  email,
                  password,
                })
              ).status,
              202,
            );
            assert.equal(await User.count({ where: { email } }), 0);
            assert.equal(
              (
                await request("/auth/verify-email", "POST", {
                  token: tokenFrom(inbox.messages.at(-1)),
                })
              ).status,
              200,
            );
            const result = await request("/auth/login", "POST", {
              email,
              password,
            });
            assert.equal(result.status, 200);
            return (await result.json()).data;
          };
          const owner = await approved(emails[0]);
          const other = await approved(emails[2]);
          const farm = (
            await (
              await request(
                "/farms",
                "POST",
                {
                  name: "Operations Farm",
                  country: "Ghana",
                  location: "Assesso",
                  type: "Poultry",
                  houses: ["House 1"],
                },
                owner,
              )
            ).json()
          ).data;
          const foreignFarm = (
            await (
              await request(
                "/farms",
                "POST",
                {
                  name: "Other Farm",
                  country: "Ghana",
                  location: "Elsewhere",
                  type: "Poultry",
                  houses: ["Other House"],
                },
                other,
              )
            ).json()
          ).data;
          const path = `/farms/${farm.id}`;
          const grants = [
            "flocks.read",
            "records.read",
            "records.write",
            "health.read",
            "health.complete",
            "tasks.read",
            "tasks.complete",
          ];
          assert.equal(
            (
              await request(
                `${path}/team/invitations`,
                "POST",
                { email: emails[1], role: "Worker", permissions: grants },
                owner,
              )
            ).status,
            201,
          );
          const invitationToken = tokenFrom(inbox.messages.at(-1));
          assert.equal(await User.count({ where: { email: emails[1] } }), 0);
          assert.equal(
            await PendingSignup.count({ where: { email: emails[1] } }),
            0,
          );
          const invitation = await FarmInvitation.findOne({
            where: { farmId: farm.id, email: emails[1] },
          });
          assert.notEqual(invitation.tokenHash, invitationToken);
          assert.equal(
            (await request(`/invitations/preview?token=${invitationToken}`))
              .status,
            200,
          );
          assert.equal(
            (
              await request("/invitations/accept", "POST", {
                token: invitationToken,
              })
            ).status,
            401,
          );
          assert.equal(
            (
              await request(
                "/invitations/accept",
                "POST",
                { token: invitationToken },
                other,
              )
            ).status,
            403,
          );
          const worker = await approved(emails[1]);
          assert.equal(
            (await request(path, "GET", undefined, worker)).status,
            404,
          );
          assert.equal(
            (
              await request(
                "/invitations/accept",
                "POST",
                { token: invitationToken },
                worker,
              )
            ).status,
            200,
          );
          assert.equal(
            (
              await request(
                "/invitations/accept",
                "POST",
                { token: invitationToken },
                worker,
              )
            ).status,
            400,
          );
          assert.equal(
            (await request(path, "PATCH", { name: "Hacked" }, worker)).status,
            404,
          );
          assert.equal(
            (await request(path, "DELETE", undefined, worker)).status,
            404,
          );
          assert.equal(
            (await request(`${path}/team`, "GET", undefined, worker)).status,
            403,
          );
          assert.equal(
            (
              await request(
                `${path}/team/invitations`,
                "POST",
                { email: emails[2], role: "Manager" },
                worker,
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await request(
                `${path}/team/invitations`,
                "POST",
                { email: emails[2], role: "Owner" },
                owner,
              )
            ).status,
            400,
          );
          assert.equal(
            (
              await request(
                `${path}/team/invitations`,
                "POST",
                {
                  email: emails[2],
                  role: "Worker",
                  permissions: ["farm.delete"],
                },
                owner,
              )
            ).status,
            400,
          );

          const flockInput = {
            name: "Layers",
            birdType: "Layers",
            dateReceived: date(-4),
            ageAtArrivalDays: 1,
            initialBirds: 100,
            house: "House 1",
          };
          assert.equal(
            (await request(`${path}/flocks`, "POST", flockInput, worker))
              .status,
            403,
          );
          const flockResult = await request(
            `${path}/flocks`,
            "POST",
            flockInput,
            owner,
          );
          assert.equal(flockResult.status, 201);
          const flock = (await flockResult.json()).data;
          const foreignFlock = (
            await (
              await request(
                `/farms/${foreignFarm.id}/flocks`,
                "POST",
                { ...flockInput, house: "Other House" },
                other,
              )
            ).json()
          ).data;
          const record = {
            flockId: flock.id,
            date: date(-2),
            mortality: 70,
            feedKg: 1.125,
            eggs: 2,
            medication: "Treatment",
            notes: "Private record note",
          };
          assert.equal(
            (
              await request(
                `${path}/records`,
                "POST",
                { ...record, flockId: foreignFlock.id },
                worker,
              )
            ).status,
            404,
          );
          assert.equal(
            (
              await request(
                `${path}/records`,
                "POST",
                { ...record, mortality: -1 },
                worker,
              )
            ).status,
            400,
          );
          const races = await Promise.all([
            request(`${path}/records`, "POST", record, worker),
            request(
              `${path}/records`,
              "POST",
              { ...record, date: date(-1) },
              owner,
            ),
          ]);
          assert.deepEqual(
            races.map((response) => response.status).sort(),
            [201, 400],
          );
          const saved = await DailyRecord.findOne({
            where: { farmId: farm.id, flockId: flock.id },
          });
          assert.equal(
            (
              await request(
                `${path}/records`,
                "POST",
                { ...record, date: saved.date, mortality: 0 },
                worker,
              )
            ).status,
            409,
          );
          assert.equal(
            (
              await request(
                `${path}/records/${saved.id}`,
                "PATCH",
                { mortality: 1, reason: "Recount" },
                worker,
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await request(
                `${path}/records/${saved.id}`,
                "PATCH",
                { mortality: 1 },
                owner,
              )
            ).status,
            400,
          );
          assert.equal(
            (
              await request(
                `${path}/records/${saved.id}`,
                "PATCH",
                { mortality: 1, reason: "Recount" },
                owner,
              )
            ).status,
            200,
          );
          const correction = await AuditLog.findOne({
            where: { farmId: farm.id, action: "record.corrected" },
          });
          assert.equal(correction.before.mortality, 70);
          assert.equal(correction.after.mortality, 1);
          assert.equal(correction.reason, "Recount");

          assert.equal(
            (
              await request(
                `${path}/feed-schedule`,
                "PUT",
                { stages: [{ fromWeek: 1, toWeek: 4, feed: "Starter" }] },
                owner,
              )
            ).status,
            200,
          );
          assert.equal(
            (
              await request(
                `${path}/feed-schedule`,
                "PUT",
                { stages: [] },
                worker,
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await request(
                `${path}/feed-schedule`,
                "PUT",
                {
                  stages: [
                    { fromWeek: 1, toWeek: 4, feed: "Starter" },
                    { fromWeek: 4, toWeek: 8, feed: "Grower" },
                  ],
                },
                owner,
              )
            ).status,
            400,
          );
          assert.equal(
            (
              await request(
                `${path}/vaccination-schedule`,
                "PUT",
                { entries: [{ day: 14, name: "Vet-approved vaccine" }] },
                owner,
              )
            ).status,
            200,
          );
          const workspace = (
            await (
              await request(`${path}/workspace`, "GET", undefined, owner)
            ).json()
          ).data;
          const scheduleId = workspace.vaccineSchedule[0].id;
          const vaccine = { flockId: flock.id, scheduleId, date: date(0) };
          assert.equal(
            (await request(`${path}/vaccinations`, "POST", vaccine, worker))
              .status,
            201,
          );
          assert.equal(
            (await request(`${path}/vaccinations`, "POST", vaccine, worker))
              .status,
            409,
          );
          assert.equal(
            (
              await request(
                `${path}/vaccination-schedule`,
                "PUT",
                { entries: [] },
                owner,
              )
            ).status,
            200,
          );
          const historical = await VaccinationRecord.findOne({
            where: { farmId: farm.id },
          });
          assert.equal(historical.scheduleId, null);
          assert.equal(historical.name, "Vet-approved vaccine");

          assert.equal(
            (
              await request(
                `${path}/tasks`,
                "POST",
                {
                  title: "Invalid assignee",
                  due: date(0),
                  assigneeId: other.user.id,
                },
                owner,
              )
            ).status,
            404,
          );
          const assigned = (
            await (
              await request(
                `${path}/tasks`,
                "POST",
                {
                  title: "Clean house",
                  due: date(0),
                  assigneeId: worker.user.id,
                },
                owner,
              )
            ).json()
          ).data;
          assert.equal(
            (
              await request(
                `${path}/tasks/${assigned.id}`,
                "PATCH",
                { done: true },
                worker,
              )
            ).status,
            200,
          );
          assert.equal(
            (
              await request(
                `${path}/tasks/${assigned.id}`,
                "PATCH",
                { done: false },
                worker,
              )
            ).status,
            403,
          );
          const ownerTask = (
            await (
              await request(
                `${path}/tasks`,
                "POST",
                {
                  title: "Owner work",
                  due: date(0),
                  assigneeId: owner.user.id,
                },
                owner,
              )
            ).json()
          ).data;
          assert.equal(
            (
              await request(
                `${path}/tasks/${ownerTask.id}`,
                "PATCH",
                { done: true },
                worker,
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await request(
                `${path}/tasks/${ownerTask.id}`,
                "DELETE",
                undefined,
                worker,
              )
            ).status,
            403,
          );
          const weeklyPath = `${path}/records/weekly?flockId=${flock.id}&week=1`;
          const weeklyResponse = await request(weeklyPath, "GET", undefined, worker);
          assert.equal(weeklyResponse.status, 200);
          const weekly = (await weeklyResponse.json()).data;
          assert.equal(weekly.days.length, 7);
          assert.equal(weekly.week, 1);
          assert.equal(weekly.flockId, flock.id);
          assert.equal(weekly.days.filter(day => day.record).length, 1);
          assert.equal((await request(`${path}/records/weekly?flockId=${foreignFlock.id}`, "GET", undefined, owner)).status, 404);
          assert.equal((await request(weeklyPath, "GET", undefined, other)).status, 404);
          assert.equal((await request(`${path}/records/weekly?flockId=${flock.id}&week=0`, "GET", undefined, worker)).status, 400);
          assert.equal((await request(`${path}/records/weekly?flockId=${flock.id}&week=9999`, "GET", undefined, worker)).status, 400);
          const reportPath = `${path}/reports?from=${date(-4)}&to=${date(0)}&flockId=${flock.id}`;
          assert.equal(
            (await request(reportPath, "GET", undefined, worker)).status,
            403,
          );
          const reportResult = await request(
            reportPath,
            "GET",
            undefined,
            owner,
          );
          assert.equal(reportResult.status, 200);
          const report = (await reportResult.json()).data;
          assert.equal(report.currentBirds, 99);
          assert.equal(report.mortality, 1);
          assert.equal(report.feedKg, 1.125);
          assert.equal(report.eggs, 2);
          const csv = await request(
            reportPath.replace("/reports?", "/reports.csv?"),
            "GET",
            undefined,
            owner,
          );
          assert.equal(csv.status, 200);
          assert.match(csv.headers.get("content-type"), /text\/csv/);
          assert.ok((await csv.text()).includes("Treatment"));
          assert.equal(
            (
              await request(
                `${path}/reports?from=${date(0)}&to=${date(-1)}`,
                "GET",
                undefined,
                owner,
              )
            ).status,
            400,
          );
          assert.equal(
            (await request(`${path}/workspace`, "GET", undefined, other))
              .status,
            404,
          );

          const member = await FarmMember.findOne({
            where: { farmId: farm.id, userId: worker.user.id },
          });
          assert.equal(
            (
              await request(
                `${path}/team/members/${member.id}`,
                "PATCH",
                { role: "Manager", permissions: [] },
                owner,
              )
            ).status,
            200,
          );
          const restricted = (
            await (
              await request(`${path}/workspace`, "GET", undefined, worker)
            ).json()
          ).data;
          assert.deepEqual(restricted.permissions, []);
          assert.equal((await request(weeklyPath, "GET", undefined, worker)).status, 403);
          assert.deepEqual(restricted.records, []);
          assert.deepEqual(restricted.flocks, []);
          assert.equal(
            (
              await request(
                `${path}/records`,
                "POST",
                { ...record, date: date(0), mortality: 0 },
                worker,
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await request(
                `${path}/team/members/${member.id}`,
                "PATCH",
                { role: "Manager" },
                owner,
              )
            ).status,
            200,
          );
          assert.equal(
            (
              await request(
                `${path}/flocks`,
                "POST",
                { ...flockInput, name: "Manager flock" },
                worker,
              )
            ).status,
            201,
          );
          assert.equal(
            (await request(path, "PATCH", { name: "Still forbidden" }, worker))
              .status,
            404,
          );
          assert.equal(
            (await request(path, "DELETE", undefined, worker)).status,
            404,
          );
          assert.equal(
            (
              await request(
                `${path}/team/members/${member.id}`,
                "DELETE",
                undefined,
                owner,
              )
            ).status,
            204,
          );
          assert.equal(
            (await request(`${path}/workspace`, "GET", undefined, worker))
              .status,
            404,
          );
          assert.equal(
            (await request("/users/me", "GET", undefined, worker)).status,
            200,
          );

          const pendingEmail = `ops-pending-${suffix}@rp-ranch.test`;
          assert.equal(
            (
              await request(
                `${path}/team/invitations`,
                "POST",
                { email: pendingEmail, role: "Worker" },
                owner,
              )
            ).status,
            201,
          );
          const staleToken = tokenFrom(inbox.messages.at(-1));
          const pending = await FarmInvitation.findOne({
            where: { farmId: farm.id, email: pendingEmail },
          });
          await pending.update({ expiresAt: new Date(0) });
          assert.equal(
            (await request(`/invitations/preview?token=${staleToken}`)).status,
            400,
          );
          assert.equal(
            (
              await request(
                `${path}/team/invitations`,
                "POST",
                { email: pendingEmail, role: "Worker" },
                owner,
              )
            ).status,
            201,
          );
          const renewedToken = tokenFrom(inbox.messages.at(-1));
          assert.notEqual(staleToken, renewedToken);
          assert.equal(
            (
              await request(
                `${path}/team/invitations/${pending.id}`,
                "DELETE",
                undefined,
                owner,
              )
            ).status,
            204,
          );
          assert.equal(
            (await request(`/invitations/preview?token=${renewedToken}`))
              .status,
            400,
          );
          assert.ok((await AuditLog.count({ where: { farmId: farm.id } })) > 8);
          assert.equal(
            (await request(`${path}/audit`, "GET", undefined, owner)).status,
            200,
          );
          assert.equal(
            (await request(`${path}/audit`, "GET", undefined, other)).status,
            404,
          );
        },
      );
    } finally {
      await User.destroy({ where: { email: { [Op.in]: emails } } });
      await PendingSignup.destroy({ where: { email: { [Op.in]: emails } } });
      await inbox.close();
      await db.close();
    }
  },
);
