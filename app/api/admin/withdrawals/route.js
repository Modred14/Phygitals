import { getDb } from "@/lib/db";
import { requireAdmin, ser } from "@/lib/admin-auth";
import { explorerUrl } from "@/lib/solana";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const a = await requireAdmin(req, "FINANCE"); if (a.res) return a.res;
  const st = new URL(req.url).searchParams.get("status");
  const rows = await getDb().withdrawal.findMany({ where: st ? { status: st } : {}, orderBy: { createdAt: "desc" }, take: 100, include: { user: { include: { telegram: true } } } });
  return Response.json(ser({ withdrawals: rows.map((w) => ({ id: w.id, user: w.user.telegram?.username ?? w.userId, status: w.status, destination: w.destination, amountCents: w.amountCents, platformFeeCents: w.platformFeeCents, failureReason: w.failureReason, signature: w.signature, explorerUrl: w.signature ? explorerUrl(w.signature) : null, createdAt: w.createdAt })) }));
}
