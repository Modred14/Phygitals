import { PrismaClient } from "@prisma/client";
// Lazy so that `next build` does not require a generated client.
export function getDb() {
  if (!globalThis.__db) globalThis.__db = new PrismaClient();
  return globalThis.__db;
}
