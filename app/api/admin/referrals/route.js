import { getDb } from "@/lib/db";
import { requireAdmin, ser } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const a = await requireAdmin(req, "FINANCE"); if (a.res) return a.res;
  const rows = await getDb().referral.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { reward: true, referrer: { include: { telegram: true } }, referred: { include: { telegram: true } } } });
  return Response.json(ser({ referrals: rows.map((r) => ({ id: r.id, referrer: r.referrer.telegram?.username ?? r.referrerId, referred: r.referred.telegram?.username ?? r.referredId, status: r.status, event: r.qualifyingEvent, rewardStatus: r.reward?.status ?? null, rewardCents: r.reward?.amountCents ?? null, reason: r.reward?.reason ?? null, createdAt: r.createdAt })) }));
}
