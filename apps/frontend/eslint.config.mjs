import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  unicorn.configs["recommended"],

  // Strict type-checked rules for TS files
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // Rules not in shared configs

      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowNullableBoolean: true,
          allowNullableString: true,
        },
      ],

      // Override defaults for Next.js compatibility
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: { attributes: false },
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },

  // Non-type-aware rules
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "max-depth": ["error", 4],
      "max-params": ["error", 4],
      complexity: ["error", 15],

      // Unicorn overrides for Next.js
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
            props: false,
            ref: false,
            refs: false,
            params: false,
            args: false,
            env: false,
            dev: false,
            prod: false,
            src: false,
            err: false,
          },
        },
      ],
      "unicorn/filename-case": [
        "error",
        {
          cases: { kebabCase: true, pascalCase: true },
          ignore: ["^\\[.*\\].*\\.tsx?$"],
        },
      ],
      "unicorn/no-null": "off",
      "unicorn/no-useless-undefined": "off",
      "unicorn/prefer-module": "off",
    },
  },

  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
