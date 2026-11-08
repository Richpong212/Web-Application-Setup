require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const auth = require("../build/controllers/auth.controller");
const users = require("../build/controllers/user.controller");
const farms = require("../build/controllers/farm.controller");
const authService = require("../build/services/auth.service");
const farmService = require("../build/services/farm.service");
const { Session } = require("../build/models");
const { appConfig } = require("../build/config/index.config");

// Fault injection verifies each controller catches failures and forwards them once.
const cases = [
  ["login", auth.login, authService, "loginUser"],
  ["refresh", auth.refresh, authService, "refreshSession"],
  ["logout", auth.logout, authService, "revokeSession"],
  ["logoutAll", auth.logoutAll, Session, "update"],
  ["verifyEmail", auth.verifyEmail, authService, "verifyEmail"],
  [
    "resendVerification",
    auth.resendVerification,
    authService,
    "resendVerification",
  ],
  ["forgotPassword", auth.forgotPassword, authService, "requestPasswordReset"],
  ["resetPassword", auth.resetPassword, authService, "resetPassword"],
  ["createUser", users.createUser, authService, "registerUser"],
  ["getCurrentUser", users.getCurrentUser],
  ["updateCurrentUser", users.updateCurrentUser],
  ["createFarm", farms.createFarm, farmService, "createFarm"],
  ["listFarms", farms.listFarms, farmService, "listFarms"],
  ["getFarm", farms.getFarm, farmService, "getFarm"],
  ["updateFarm", farms.updateFarm, farmService, "updateFarm"],
  ["deleteFarm", farms.deleteFarm, farmService, "deleteFarm"],
];

for (const [name, controller, service, method] of cases) {
  test(`${name} catches errors and forwards them to the error handler`, async (context) => {
    const failure = new Error("Private diagnostic failure");
    if (service)
      context.mock.method(service, method, async () => {
        throw failure;
      });
    const req = {
      body: {},
      params: {},
      query: {},
      cookies: { [`${appConfig.app.cookieName}_refresh`]: "test-cookie" },
    };
    let cleared = false;
    const res = {
      locals: {
        user: {
          id: "test-user",
          update: async () => {
            throw failure;
          },
        },
      },
      clearCookie: () => {
        cleared = true;
      },
      json: () => {
        throw failure;
      },
    };
    const forwarded = [];
    await controller(req, res, (error) => forwarded.push(error));
    assert.deepEqual(forwarded, [failure]);
    if (name === "refresh") assert.equal(cleared, true);
  });
}

for (const moduleName of ["team", "operations"]) {
  const controllers = require(`../build/controllers/${moduleName}.controller`);
  for (const [name, controller] of Object.entries(controllers)) {
    test(`${moduleName}.${name} forwards unexpected failures without exposing diagnostics`, async () => {
      const failure = new Error("Private controller diagnostic");
      const req = { body: {}, params: {}, query: {} };
      const res = new Proxy({}, { get: () => { throw failure; } });
      const forwarded = [];
      await controller(req, res, error => forwarded.push(error));
      assert.deepEqual(forwarded, [failure]);
    });
  }
}
