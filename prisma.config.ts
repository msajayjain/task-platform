/**
 * File Description:
 * Prisma CLI configuration for schema and migration execution.
 *
 * Purpose:
 * Resolve root environment variables reliably and provide datasource/schema paths for Prisma commands.
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

const configDir = dirname(fileURLToPath(import.meta.url));

// Load root .env no matter where Prisma command is executed from.
loadEnv({ path: resolve(configDir, ".env") });

export default defineConfig({
  // Canonical schema path for this monorepo.
  schema: "prisma/schema.prisma",

  // Keep migration files in the standard prisma/migrations location.
  migrations: {
    path: "prisma/migrations",
  },

  // Connection used by Prisma CLI operations (migrate/generate/studio).
  datasource: {
    url: env("DATABASE_URL"),
  },
});


