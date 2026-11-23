import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside a React Server Component bundle; tests run in plain Node.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
    // Integration tests (src/server/**) share one throwaway DB, recreated once per run.
    // Each file clears its own tables in beforeEach.
    globalSetup: ["./tests/global-setup.ts"],
    env: { DATABASE_URL: "file:./test.db" },
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.test.ts"],
      thresholds: { lines: 100 },
    },
  },
});
