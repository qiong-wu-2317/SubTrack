import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      // CLAUDE.md: only src/server/repo/** may touch Prisma.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message: "Only src/server/repo/** may import Prisma (ARCHITECTURE.md layers).",
            },
          ],
        },
      ],
    },
  },
  {
    // The repo layer, and the seed script that runs outside the app.
    files: ["src/server/repo/**/*.ts", "prisma/seed.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
