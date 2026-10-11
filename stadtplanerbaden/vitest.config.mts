import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Zwei Testprojekte:
 * - unit: reine Domänenlogik (Datum, Agenda, Validierung, Suche, Favoriten) – ohne Datenbank
 * - integration: Services gegen eine echte PostgreSQL-Testdatenbank (baden_test)
 */
const serverOnlyStub = fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url));
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? "postgresql://baden:baden_local_dev@localhost:5433/baden_test?schema=public";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": serverOnlyStub },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          env: { DATABASE_URL: testDatabaseUrl },
          globalSetup: ["tests/support/integration-setup.ts"],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
