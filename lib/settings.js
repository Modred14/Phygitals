import { withdrawalSettings } from "./withdrawals.js";
export async function loadWithdrawalSettings(db) {
  const row = await db.appSettings.findUnique({ where: { key: "withdrawal" } });
  return { ...withdrawalSettings(), ...(row?.value ?? {}) };
}
export async function loadReferralSettings(db) {
  const row = await db.appSettings.findUnique({ where: { key: "referral" } });
  return { rewardCents: 100, minDepositCents: 500, holdDays: 7, ...(row?.value ?? {}) }; // payout is still gated by REFERRAL_REWARDS_ENABLED
}
