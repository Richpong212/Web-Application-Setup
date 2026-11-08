require("./setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { appConfig } = require("../build/config/index.config");
const { checkAuthOrigin } = require("../build/middleware/auth.middleware");

test("allows the configured client origin on port 3000 and rejects other origins", () => {
  assert.equal(appConfig.app.clientUrl, "http://localhost:3000");
  let passed = false;
  checkAuthOrigin({ headers: { origin: "http://localhost:3000" } }, {}, () => {
    passed = true;
  });
  assert.equal(passed, true);
  assert.throws(
    () => {
      checkAuthOrigin(
        { headers: { origin: "https://untrusted.test" } },
        {},
        () => {},
      );
    },
    { status: 403 },
  );
});
