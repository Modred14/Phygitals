import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
import { flags } from "@/lib/flags";
import { loadReferralSettings } from "@/lib/settings";
import { maskName } from "@/lib/referrals";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const uid = readSession(req);
  if (!uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb(), rules = await loadReferralSettings(db);
  const rows = await db.referral.findMany({ where: { referrerId: uid }, orderBy: { createdAt: "desc" }, take: 50, include: { reward: true, referred: { include: { telegram: true } } } });
  const sum = (st) => rows.reduce((a, r) => a + (r.reward?.status === st ? Number(r.reward.amountCents) : 0), 0);
  return Response.json({
    enabled: flags().referralRewards, rules: { rewardCents: rules.rewardCents, minDepositCents: rules.minDepositCents, holdDays: rules.holdDays },
    pendingCents: sum("PENDING"), confirmedCents: sum("CONFIRMED"),
    referrals: rows.map((r) => ({ id: r.id, name: maskName(r.referred.telegram?.username), status: r.status, rewardStatus: r.reward?.status ?? null, rewardCents: r.reward ? Number(r.reward.amountCents) : null, createdAt: r.createdAt })),
  });
}
