import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginPrettierRecommended from "eslint-plugin-prettier/recommended";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginPrettierRecommended,
  {
    rules: {
      "prettier/prettier": [
        "error",
        {
          trailingComma: "all",
          tabWidth: 2,
          semi: false,
          singleQuote: false,
        },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
