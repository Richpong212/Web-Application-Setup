import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": "error",
      "no-undef": "error",
      "no-debugger": "error",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-useless-return": "error",
      "object-shorthand": ["error", "always"],

      "no-sync": "warn",
      "no-process-exit": "error",
      "callback-return": ["error", ["callback", "cb", "next"]],
      "handle-callback-err": ["error", "^err"],
      "no-path-concat": "error",
    },
  },
];
