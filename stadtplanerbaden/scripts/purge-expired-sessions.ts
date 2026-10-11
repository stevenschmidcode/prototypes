/**
 * Löscht abgelaufene Gast-Sessions inklusive aller Aufenthalte, Agenden und
 * Favoriten (Cascade). Für einen täglichen Cron-Job gedacht: pnpm db:purge
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL ist nicht gesetzt.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const result = await db.visitorSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    console.log(`✓ ${result.count} abgelaufene Gast-Session(s) gelöscht`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
