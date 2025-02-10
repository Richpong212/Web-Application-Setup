import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["./src/**/*.ts", "./src/**/*.tsx"],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }], // Warn on console logs, but allow console.warn/error
      "no-undef": "off",
      "no-unused-vars": "off",
      // You can also tighten or loosen any rules you like:
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      "no-debugger": "warn", // Warn on debugger statements
      eqeqeq: "error", // Require === and !==
      semi: ["error", "always"], // Require semicolons
    },
  },
];
