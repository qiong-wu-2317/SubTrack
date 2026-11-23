import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a stray lockfile in a parent folder
  // isn't mistaken for the monorepo root.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
};

export default nextConfig;
