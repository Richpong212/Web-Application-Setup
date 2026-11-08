const { serve } = require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Op } = require("sequelize");
const { createApp } = require("../build/app");
const { db } = require("../build/config/connectDb");
const { appConfig } = require("../build/config/index.config");
const { runMigrations } = require("../build/database/migrate");
const { User, Session, UserToken, PendingSignup } = require("../build/models");
const { comparePassword } = require("../build/utils/passwordHashing");
const { genToken } = require("../build/utils/token");
const {
  hashToken,
  createAccessToken,
  createRefreshToken,
} = require("../build/utils/authToken");

const { createInbox } = require("./smtp.cjs");

const emailToken = (message) => {
  const decoded = message.replace(/=\r\n/g, "").replace(/=3D/gi, "=");
  const token = decoded.match(/token=([a-f0-9]{64})/);
  assert.ok(token, "Email must contain an actionable token");
  return token[1];
};

const cookieFrom = (response) => {
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  return cookie.split(";")[0];
};

test(
  "migrations and complete user authentication through HTTP, PostgreSQL and SMTP",
  { timeout: 60000 },
  async () => {
    // All destructive checks are guarded to the isolated test database.
    assert.equal(process.env.NODE_ENV, "test");
    assert.equal(db.getDatabaseName(), "backend_test");
    const email = `auth-${randomUUID()}@rp-ranch.test`;
    const password = "Farm Password 42!";
    const newPassword = "New Farm Password 87!";
    const inbox = await createInbox();

    try {
      await runMigrations();
      await runMigrations(); // Applying twice must preserve schema and data.

      const cache = {
        ping: async () => "PONG",
        get: async () => null,
        set: async () => "OK",
      };
      await serve(
        createApp({ database: db, cache, cacheEnabled: false }),
        async (url) => {
          const post = (path, body = {}, headers = {}) =>
            fetch(`${url}/api/v1/${path}`, {
              method: "POST",
              headers: { "content-type": "application/json", ...headers },
              body: JSON.stringify(body),
            });
          const profile = (accessToken) =>
            fetch(`${url}/api/v1/users/me`, {
              headers: { authorization: `Bearer ${accessToken}` },
            });

          assert.equal(
            (await post("auth/register", { name: "", email, password: "weak" }))
              .status,
            400,
          );
          assert.equal(
            (
              await post("auth/register", {
                name: "Farmer",
                email,
                password: "A1!" + "x".repeat(73),
              })
            ).status,
            400,
          );

          const registration = await post("auth/register", {
            name: "RP Farmer",
            email: ` ${email.toUpperCase()} `,
            password,
            isAdmin: true,
            isEmailVerified: true,
          });
          assert.equal(registration.status, 202);
          const registered = await registration.json();
          assert.deepEqual(registered.data, { email });
          assert.ok(!JSON.stringify(registered).includes("password"));
          assert.ok(!JSON.stringify(registered).includes("token"));
          assert.equal(await User.count({ where: { email } }), 0);
          const pending = await PendingSignup.scope("withCredentials").findOne({
            where: { email },
          });
          assert.notEqual(pending.password, password);
          assert.equal(await comparePassword(password, pending.password), true);
          assert.equal(
            (await PendingSignup.findByPk(pending.id)).get("password"),
            undefined,
          );
          const tokenRecord = pending;
          const originalVerification = emailToken(inbox.messages.at(-1));
          assert.equal(tokenRecord.tokenHash, hashToken(originalVerification));
          assert.notEqual(tokenRecord.tokenHash, originalVerification);
          assert.equal(
            (
              await post("auth/register", {
                name: "Duplicate",
                email,
                password,
              })
            ).status,
            202,
          );
          assert.equal(
            (await post("auth/login", { email, password })).status,
            401,
          );
          assert.equal(
            (await post("auth/verify-email", { token: "a".repeat(64) })).status,
            400,
          );

          // Neither a failed/expired link nor password recovery may create a user.
          await PendingSignup.update(
            { expiresAt: new Date(0) },
            { where: { email } },
          );
          assert.equal(
            (await post("auth/verify-email", { token: originalVerification }))
              .status,
            400,
          );
          assert.equal(await User.count({ where: { email } }), 0);
          const messagesBeforeReset = inbox.messages.length;
          await post("auth/forgot-password", { email });
          assert.equal(inbox.messages.length, messagesBeforeReset);
          await post("auth/resend-verification", { email });
          const verificationToken = emailToken(inbox.messages.at(-1));
          assert.notEqual(verificationToken, originalVerification);
          assert.equal(
            (await post("auth/verify-email", { token: originalVerification }))
              .status,
            400,
          );
          const approvals = await Promise.all([
            post("auth/verify-email", { token: verificationToken }),
            post("auth/verify-email", { token: verificationToken }),
          ]);
          assert.deepEqual(
            approvals.map((response) => response.status).sort(),
            [200, 400],
          );
          assert.equal(await PendingSignup.count({ where: { email } }), 0);
          let user = await User.scope("withPassword").findOne({
            where: { email },
          });
          assert.equal(user.isAdmin, false);
          assert.equal(user.isEmailVerified, true);
          assert.equal(await comparePassword(password, user.password), true);
          assert.equal(
            (await User.findByPk(user.id)).get("password"),
            undefined,
          );
          assert.equal(await User.count({ where: { email } }), 1);
          const knownRegistration = await post("auth/register", {
            name: "Another Name",
            email,
            password,
          });
          assert.equal(knownRegistration.status, 202);
          assert.deepEqual(await knownRegistration.json(), registered);

          assert.equal(
            (await post("auth/verify-email", { token: verificationToken }))
              .status,
            400,
          );
          assert.equal(
            (await post("auth/login", { email, password: "incorrect" })).status,
            401,
          );
          assert.equal(
            (
              await post(
                "auth/login",
                { email, password },
                { origin: "https://evil.test" },
              )
            ).status,
            403,
          );

          const login = await post("auth/login", { email, password });
          assert.equal(login.status, 200);
          const firstCookie = cookieFrom(login);
          const firstAccess = (await login.json()).data.accessToken;
          assert.equal((await profile(firstAccess)).status, 200);
          assert.equal((await fetch(`${url}/api/v1/users/me`)).status, 401);
          const refreshToken = decodeURIComponent(firstCookie.split("=")[1]);
          assert.equal(
            (await profile(refreshToken)).status,
            401,
            "Refresh tokens cannot authorize API access",
          );
          assert.equal(
            (
              await post(
                "auth/refresh",
                {},
                { cookie: `${firstCookie.split("=")[0]}=${firstAccess}` },
              )
            ).status,
            401,
          );

          const updated = await fetch(`${url}/api/v1/users/me`, {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${firstAccess}`,
            },
            body: JSON.stringify({
              name: "Updated Farmer",
              isAdmin: true,
              email: "other@rp-ranch.test",
            }),
          });
          assert.equal(updated.status, 200);
          assert.equal((await updated.json()).data.name, "Updated Farmer");
          user = await User.findByPk(user.id);
          assert.equal(user.email, email);
          assert.equal(user.isAdmin, false);

          const rotated = await post(
            "auth/refresh",
            {},
            { cookie: firstCookie },
          );
          assert.equal(rotated.status, 200);
          const rotatedCookie = cookieFrom(rotated);
          assert.notEqual(rotatedCookie, firstCookie);
          const rotatedAccess = (await rotated.json()).data.accessToken;
          assert.equal(
            (await post("auth/refresh", {}, { cookie: firstCookie })).status,
            401,
            "Rotated token reuse is rejected",
          );
          assert.equal(
            (await post("auth/refresh", {}, { cookie: rotatedCookie })).status,
            401,
          );
          assert.equal(
            (await profile(rotatedAccess)).status,
            401,
            "Reuse revokes the session's access tokens",
          );

          const secondLogin = await post("auth/login", { email, password });
          const secondCookie = cookieFrom(secondLogin);
          const secondAccess = (await secondLogin.json()).data.accessToken;
          assert.equal(
            (await post("auth/logout", {}, { cookie: secondCookie })).status,
            200,
          );
          assert.equal((await profile(secondAccess)).status, 401);
          assert.equal((await post("auth/logout")).status, 200);

          const thirdLogin = await post("auth/login", { email, password });
          const thirdCookie = cookieFrom(thirdLogin);
          const thirdAccess = (await thirdLogin.json()).data.accessToken;
          const unknownReset = await (
            await post("auth/forgot-password", {
              email: "missing@rp-ranch.test",
            })
          ).json();
          const knownReset = await (
            await post("auth/forgot-password", { email })
          ).json();
          assert.deepEqual(knownReset, unknownReset);
          const resetToken = emailToken(inbox.messages.at(-1));
          assert.equal(
            (await post("auth/verify-email", { token: resetToken })).status,
            400,
          );
          assert.equal(
            (
              await post("auth/reset-password", {
                token: resetToken,
                password: newPassword,
              })
            ).status,
            200,
          );
          assert.equal(
            (
              await post("auth/reset-password", {
                token: resetToken,
                password: newPassword,
              })
            ).status,
            400,
          );
          assert.equal((await profile(thirdAccess)).status, 401);
          assert.equal(
            (await post("auth/refresh", {}, { cookie: thirdCookie })).status,
            401,
          );
          assert.equal(
            (await post("auth/login", { email, password })).status,
            401,
          );

          const finalLogin = await post("auth/login", {
            email,
            password: newPassword,
          });
          assert.equal(finalLogin.status, 200);
          const finalAccess = (await finalLogin.json()).data.accessToken;
          assert.equal(
            (
              await post(
                "auth/logout-all",
                {},
                { authorization: `Bearer ${finalAccess}` },
              )
            ).status,
            200,
          );
          assert.equal((await profile(finalAccess)).status, 401);

          // Expiry is checked server-side, independent of the client cookie's lifetime.
          await post("auth/forgot-password", { email });
          const expiredReset = emailToken(inbox.messages.at(-1));
          await UserToken.update(
            { expiresAt: new Date(0) },
            { where: { userId: user.id } },
          );
          assert.equal(
            (
              await post("auth/reset-password", {
                token: expiredReset,
                password,
              })
            ).status,
            400,
          );

          const expiredSessionId = randomUUID();
          const expiredSessionToken = createRefreshToken(
            user.id,
            expiredSessionId,
            new Date(Date.now() + 60000),
          );
          await Session.create({
            id: expiredSessionId,
            userId: user.id,
            refreshTokenHash: hashToken(expiredSessionToken),
            expiresAt: new Date(0),
          });
          assert.equal(
            (await profile(createAccessToken(user.id, expiredSessionId)))
              .status,
            401,
          );

          const expiredAccess = genToken({
            sub: user.id,
            sessionId: expiredSessionId,
            purpose: "access",
            exp: 1,
          });
          assert.equal((await profile(expiredAccess)).status, 401);
          const expiredRefresh = genToken({
            sub: user.id,
            sessionId: expiredSessionId,
            purpose: "refresh",
            exp: 1,
          });
          assert.equal(
            (
              await post(
                "auth/refresh",
                {},
                { cookie: `${firstCookie.split("=")[0]}=${expiredRefresh}` },
              )
            ).status,
            401,
          );

          // Simultaneous requests create only one pending signup, never a user.
          const raceEmail = `race-${email}`;
          const races = await Promise.all([
            post("auth/register", {
              name: "Farmer A",
              email: raceEmail,
              password,
            }),
            post("users/signup", {
              name: "Farmer B",
              email: raceEmail.toUpperCase(),
              password,
            }),
          ]);
          assert.deepEqual(
            races.map((response) => response.status).sort(),
            [202, 202],
          );
          assert.equal(await User.count({ where: { email: raceEmail } }), 0);
          assert.equal(
            await PendingSignup.count({ where: { email: raceEmail } }),
            1,
          );

          // Delivery failure must not create a user; resend can recover the pending request.
          const smtpPort = appConfig.smtp.port;
          try {
            appConfig.smtp.port = 1;
            assert.equal(
              (
                await post("auth/register", {
                  name: "Delivery Failure",
                  email: `failed-${email}`,
                  password,
                })
              ).status,
              202,
            );
          } finally {
            appConfig.smtp.port = smtpPort;
          }
          assert.equal(
            await User.count({ where: { email: `failed-${email}` } }),
            0,
          );
          assert.equal(
            await PendingSignup.count({ where: { email: `failed-${email}` } }),
            1,
          );
          assert.equal(
            (
              await post("auth/resend-verification", {
                email: `failed-${email}`,
              })
            ).status,
            200,
          );
          assert.equal(
            (
              await post("auth/verify-email", {
                token: emailToken(inbox.messages.at(-1)),
              })
            ).status,
            200,
          );
          assert.equal(
            await User.count({ where: { email: `failed-${email}` } }),
            1,
          );

          // PostgreSQL enforces email uniqueness even if callers bypass validation.
          await assert.rejects(
            User.create({
              name: "Duplicate",
              email: email.toUpperCase(),
              password: "hash",
            }),
            { name: "SequelizeUniqueConstraintError" },
          );
          assert.equal(await User.count({ where: { email } }), 1);
          assert.equal(
            (await Session.count({
              where: { userId: user.id, expiresAt: { [Op.gt]: new Date() } },
            })) > 0,
            true,
          );
        },
      );
    } finally {
      await User.destroy({
        where: {
          email: { [Op.in]: [email, `race-${email}`, `failed-${email}`] },
        },
      }); // Foreign keys remove sessions/tokens.
      await PendingSignup.destroy({
        where: {
          email: { [Op.in]: [email, `race-${email}`, `failed-${email}`] },
        },
      });
      await inbox.close();
      await db.close();
    }
  },
);
