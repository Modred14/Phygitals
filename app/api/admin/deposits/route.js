import { getDb } from "@/lib/db";
import { requireAdmin, ser } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const a = await requireAdmin(req, "FINANCE"); if (a.res) return a.res;
  const rows = await getDb().deposit.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { include: { telegram: true } } } });
  return Response.json(ser({ deposits: rows.map((d) => ({ id: d.id, user: d.user.telegram?.username ?? d.userId, status: d.status, reference: d.reference, creditedCents: d.creditedCents, chainTxId: d.chainTxId, createdAt: d.createdAt })) }));
}
