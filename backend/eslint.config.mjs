import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["node_modules/**", "dist/**", "generated/**", "**/generated/**"],
    },
     ...tseslint.configs.recommended,
    {
        //files: ["src/**/*.ts", "tests/**/*.ts"],
        files: ["src/**/*.ts", "prisma/**/*.prisma"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json", // 프로젝트 설정 연결
                tsconfigRootDir: import.meta.dirname,
            },
            sourceType: "module",
            ecmaVersion: "latest", 
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "prettier": prettierPlugin,
        },
        rules: {
            "prettier/prettier": "error",
            "no-console": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern : "^_"}],
            "@typescript-eslint/require-await": "error",
            "@typescript-eslint/no-floating-promises" : "error",
            "@typescript-eslint/no-empty-object-type": "off",
            ...prettierConfig.rules,
        },
    }
);
