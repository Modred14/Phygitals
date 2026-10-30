import { getDb } from "@/lib/db";
import { requireAdmin, ser } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const a = await requireAdmin(req, "FINANCE"); if (a.res) return a.res;
  const sp = new URL(req.url).searchParams, userId = sp.get("userId"), type = sp.get("type");
  const rows = await getDb().ledgerEntry.findMany({ where: { account: { ...(userId ? { userId } : {}), ...(type ? { type } : {}) } }, orderBy: { createdAt: "desc" }, take: 200, include: { account: true } });
  return Response.json(ser({ entries: rows.map((e) => ({ id: e.id, transactionId: e.transactionId, account: e.account.type, userId: e.account.userId, kind: e.kind, amountCents: e.amountCents, refType: e.refType, refId: e.refId, createdAt: e.createdAt })) }));
}
