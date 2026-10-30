import { getDb } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-auth";
import { flags } from "@/lib/flags";
import { loadReferralSettings } from "@/lib/settings";
import { confirmDueRewards } from "@/lib/referrals";
export const dynamic = "force-dynamic";
// Pays out referral rewards whose hold period has ended. Requires the REFERRAL_REWARDS_ENABLED launch flag.
export async function POST(req) {
  const a = await requireAdmin(req, "FINANCE"); if (a.res) return a.res;
  if (!flags().referralRewards) return Response.json({ error: "referral_rewards_disabled" }, { status: 403 });
  const db = getDb(), rules = await loadReferralSettings(db);
  const tally = await confirmDueRewards(db, { holdDays: rules.holdDays });
  await audit(db, a.admin, req, "referral.confirm_due", "ReferralReward", null, null, { ...tally, holdDays: rules.holdDays });
  return Response.json(tally);
}
