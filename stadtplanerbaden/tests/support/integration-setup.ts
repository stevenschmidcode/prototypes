import { execSync } from "node:child_process";
import { Client } from "pg";

/**
 * Bereitet die Integrations-Testdatenbank vor: legt sie bei Bedarf an,
 * spielt alle Migrationen ein und lädt den Katalog (Seed).
 */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://baden:baden_local_dev@localhost:5433/baden_test?schema=public";
  const target = new URL(url);
  const dbName = target.pathname.slice(1);
  if (!/^[a-z0-9_]+$/i.test(dbName) || !dbName.includes("test")) {
    throw new Error(`Integrationstests laufen nur gegen eine Testdatenbank (Name muss «test» enthalten): ${dbName}`);
  }

  const admin = new URL(url);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${dbName}"`);
  await client.end();

  const env = { ...process.env, DATABASE_URL: url };
  execSync("pnpm exec prisma migrate deploy", { stdio: "inherit", env });
  execSync("pnpm exec tsx prisma/seed.ts", { stdio: "inherit", env });
}
