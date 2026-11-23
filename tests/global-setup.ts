import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Throwaway SQLite DB for integration tests (CLAUDE.md testing strategy).
// SQLite paths are relative to prisma/schema.prisma, so this is prisma/test.db.
export const TEST_DATABASE_URL = "file:./test.db";

export default function setup(): void {
  const root = fileURLToPath(new URL("..", import.meta.url));
  for (const suffix of ["", "-journal"]) {
    rmSync(`${root}prisma/test.db${suffix}`, { force: true });
  }
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe",
  });
}
