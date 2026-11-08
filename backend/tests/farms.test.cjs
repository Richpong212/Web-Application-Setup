const { serve } = require("./setup.cjs");
process.env.GLOBAL_RATE_LIMIT_MAX = "1000";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Op } = require("sequelize");
const { createApp } = require("../build/app");
const { db } = require("../build/config/connectDb");
const { runMigrations } = require("../build/database/migrate");
const { User, PendingSignup, Farm, FarmMember } = require("../build/models");
const { createInbox } = require("./smtp.cjs");

const farmInput = {
  name: "North Farm",
  country: "Ghana",
  location: "Assesso",
  type: "Poultry",
  description: "Layers",
  houses: ["House 1", "House 2"],
};

test(
  "farm CRUD, owner membership, validation, transactions and cross-tenant isolation",
  { timeout: 60000 },
  async (context) => {
    assert.equal(db.getDatabaseName(), "backend_test");
    const emails = [
      `farms-${randomUUID()}@rp-ranch.test`,
      `farms-${randomUUID()}@rp-ranch.test`,
    ];
    const inbox = await createInbox();

    try {
      await runMigrations();
      const cache = {
        ping: async () => "PONG",
        get: async () => null,
        set: async () => "OK",
      };
      await serve(
        createApp({ database: db, cache, cacheEnabled: false }),
        async (url) => {
          const request = (path, method = "GET", body, token) =>
            fetch(`${url}/api/v1${path}`, {
              method,
              headers: {
                ...(body === undefined
                  ? {}
                  : { "content-type": "application/json" }),
                ...(token ? { authorization: `Bearer ${token}` } : {}),
              },
              ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            });
          const approveAndLogin = async (email) => {
            const password = "Farm Owner Password42!";
            assert.equal(
              (
                await request("/auth/register", "POST", {
                  name: "Farm Owner",
                  email,
                  password,
                })
              ).status,
              202,
            );
            const message = inbox.messages
              .at(-1)
              .replace(/=\r\n/g, "")
              .replace(/=3D/gi, "=");
            const token = message.match(/token=([a-f0-9]{64})/)[1];
            assert.equal(
              (await request("/auth/verify-email", "POST", { token })).status,
              200,
            );
            const login = await request("/auth/login", "POST", {
              email,
              password,
            });
            assert.equal(login.status, 200);
            return (await login.json()).data;
          };
          const owner = await approveAndLogin(emails[0]);
          const other = await approveAndLogin(emails[1]);
          const asOwner = (path, method = "GET", body) =>
            request(path, method, body, owner.accessToken);
          const asOther = (path, method = "GET", body) =>
            request(path, method, body, other.accessToken);

          assert.equal((await request("/farms")).status, 401);
          assert.deepEqual((await (await asOwner("/farms")).json()).data, []);
          for (const invalid of [
            {},
            { ...farmInput, name: " " },
            { ...farmInput, country: "x".repeat(101) },
            { ...farmInput, ownerId: other.user.id },
            { ...farmInput, role: "Owner" },
            { ...farmInput, houses: ["House", " house "] },
            { ...farmInput, houses: [2] },
            {
              ...farmInput,
              houses: Array.from(
                { length: 51 },
                (_, index) => `House ${index}`,
              ),
            },
          ])
            assert.equal(
              (await asOwner("/farms", "POST", invalid)).status,
              400,
            );
          assert.equal(
            await Farm.count({ where: { ownerId: owner.user.id } }),
            0,
          );

          for (const houses of [undefined, [], [" "]]) {
            const invalidHouses = await asOwner("/farms", "POST", {
              ...farmInput,
              houses,
            });
            assert.equal(invalidHouses.status, 400);
          }
          const created = await asOwner("/farms", "POST", {
            ...farmInput,
            name: " North Farm ",
            houses: [" House 1 ", "House 2"],
          });
          assert.equal(created.status, 201);
          const farm = (await created.json()).data;
          assert.equal(farm.name, "North Farm");
          assert.deepEqual(farm.houses, ["House 1", "House 2"]);
          assert.equal(farm.role, "Owner");
          assert.ok(!Object.hasOwn(farm, "ownerId"));
          const membership = await FarmMember.findOne({
            where: { farmId: farm.id, userId: owner.user.id },
          });
          assert.equal(membership.role, "Owner");
          assert.equal((await Farm.findByPk(farm.id)).ownerId, owner.user.id);
          const read = await asOwner(`/farms/${farm.id}`);
          assert.equal(read.status, 200);
          assert.equal(read.headers.get("cache-control"), "no-store");
          assert.equal((await read.json()).data.id, farm.id);

          for (const method of ["GET", "PATCH", "DELETE"]) {
            const response = await asOther(
              `/farms/${farm.id}`,
              method,
              method === "PATCH" ? { name: "Stolen" } : undefined,
            );
            assert.equal(response.status, 404);
            assert.deepEqual(await response.json(), {
              message: "The requested resource could not be found.",
            });
          }
          assert.equal((await asOther(`/farms/${randomUUID()}`)).status, 404);
          assert.deepEqual((await (await asOther("/farms")).json()).data, []);
          assert.equal((await asOwner("/farms/not-a-uuid")).status, 400);
          assert.equal((await asOwner("/farms?limit=101")).status, 400);
          assert.equal((await asOwner("/farms?page=0")).status, 400);

          const second = (
            await (
              await asOwner("/farms", "POST", {
                ...farmInput,
                name: "South Farm",
              })
            ).json()
          ).data;
          const page = await (await asOwner("/farms?limit=1&page=1")).json();
          assert.equal(page.pagination.total, 2);
          assert.equal(page.pagination.pages, 2);
          assert.equal(page.data.length, 1);
          const next = await (await asOwner("/farms?limit=1&page=2")).json();
          assert.notEqual(page.data[0].id, next.data[0].id);

          const addedHouse = await asOwner(`/farms/${farm.id}/houses`, "POST", {
            name: " House 3 ",
          });
          assert.equal(addedHouse.status, 200);
          assert.equal((await addedHouse.json()).data.house, "House 3");
          const duplicateHouse = await asOwner(
            `/farms/${farm.id}/houses`,
            "POST",
            { name: "house 3" },
          );
          assert.equal((await duplicateHouse.json()).data.house, "House 3");
          const concurrentHouses = await Promise.all(
            ["House 4", "House 5"].map((name) =>
              asOwner(`/farms/${farm.id}/houses`, "POST", { name }),
            ),
          );
          assert.ok(
            concurrentHouses.every((response) => response.status === 200),
          );
          assert.deepEqual(
            new Set((await Farm.findByPk(farm.id)).houses),
            new Set(["House 1", "House 2", "House 3", "House 4", "House 5"]),
          );
          assert.equal(
            (
              await asOther(`/farms/${farm.id}/houses`, "POST", {
                name: "Forbidden",
              })
            ).status,
            404,
          );
          assert.equal(
            (await asOwner(`/farms/${farm.id}/houses`, "POST", { name: " " }))
              .status,
            400,
          );

          const changed = await asOwner(`/farms/${farm.id}`, "PATCH", {
            name: "Updated North Farm",
            description: "Updated",
            houses: [],
          });
          assert.equal(changed.status, 200);
          assert.equal((await changed.json()).data.name, "Updated North Farm");
          assert.deepEqual((await Farm.findByPk(farm.id)).houses, []);
          assert.equal(
            (await asOwner(`/farms/${farm.id}`, "PATCH", {})).status,
            400,
          );
          assert.equal(
            (
              await asOwner(`/farms/${farm.id}`, "PATCH", {
                ownerId: other.user.id,
              })
            ).status,
            400,
          );

          // A farm member can read their assigned farm, but membership alone cannot grant ownership.
          await FarmMember.create({
            farmId: farm.id,
            userId: other.user.id,
            role: "Worker",
          });
          assert.equal(
            (
              await asOther(`/farms/${farm.id}/houses`, "POST", {
                name: "Forbidden",
              })
            ).status,
            404,
          );
          const shared = await (await asOther("/farms")).json();
          assert.equal(shared.data.length, 1);
          assert.equal(shared.data[0].role, "Worker");
          assert.equal((await asOther(`/farms/${farm.id}`)).status, 200);
          assert.equal(
            (await asOther(`/farms/${farm.id}`, "PATCH", { name: "Stolen" }))
              .status,
            404,
          );
          assert.equal(
            (await asOther(`/farms/${farm.id}`, "DELETE")).status,
            404,
          );
          await assert.rejects(
            FarmMember.create({
              farmId: farm.id,
              userId: other.user.id,
              role: "Owner",
            }),
            { name: "SequelizeUniqueConstraintError" },
          );
          await assert.rejects(
            FarmMember.create({
              farmId: randomUUID(),
              userId: other.user.id,
              role: "Worker",
            }),
            { name: "SequelizeForeignKeyConstraintError" },
          );

          // If membership creation fails, the farm row must roll back as well.
          const before = await Farm.count({
            where: { ownerId: owner.user.id },
          });
          const createMember = context.mock.method(
            FarmMember,
            "create",
            async () => {
              throw new Error("Forced membership failure");
            },
          );
          try {
            assert.equal(
              (
                await asOwner("/farms", "POST", {
                  ...farmInput,
                  name: "Must roll back",
                })
              ).status,
              500,
            );
          } finally {
            createMember.mock.restore();
          }
          assert.equal(
            await Farm.count({ where: { ownerId: owner.user.id } }),
            before,
          );

          assert.equal(
            (await asOwner(`/farms/${farm.id}`, "DELETE")).status,
            204,
          );
          assert.equal(
            await FarmMember.count({ where: { farmId: farm.id } }),
            0,
          );
          assert.equal((await asOwner(`/farms/${farm.id}`)).status, 404);
          assert.equal((await asOther(`/farms/${farm.id}`)).status, 404);
          assert.deepEqual((await (await asOther("/farms")).json()).data, []);
          assert.equal((await asOwner(`/farms/${second.id}`)).status, 200);
          assert.equal(
            (await asOwner(`/farms/${second.id}`, "DELETE")).status,
            204,
          );
          assert.deepEqual((await (await asOwner("/farms")).json()).data, []);
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
