import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        ignores: ["dist/**/*", "test/**/*", "eslint.config.ts"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
        ...config,
        files: ["**/*.ts"],
    })),
    {
        files: ["**/*.{js,ts}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.node,
        },
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    eslintConfigPrettier,
    {
        files: ["**/*.{js,ts}"],
        rules: {
            "linebreak-style": ["error", "unix"],
            "no-throw-literal": "error",
            quotes: ["error", "double"],
            semi: ["error", "always"],
        },
    },
    {
        files: ["**/*.ts"],
        rules: {
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": "error",
        },
    },
]);
