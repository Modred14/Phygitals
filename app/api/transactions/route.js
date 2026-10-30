import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const uid = readSession(req);
  if (!uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const acct = await db.ledgerAccount.findFirst({ where: { type: "USER_AVAILABLE", userId: uid }, select: { id: true } });
  if (!acct) return Response.json({ entries: [] });
  const rows = await db.ledgerEntry.findMany({ where: { accountId: acct.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return Response.json({ entries: rows.map((r) => ({ id: r.id, kind: r.kind, amountCents: Number(r.amountCents), createdAt: r.createdAt })) });
}
