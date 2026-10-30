export const flags = () => ({
  paidOpenings: process.env.PAID_OPENINGS_ENABLED === "true",
  withdrawals: process.env.WITHDRAWALS_ENABLED === "true",
  referralRewards: process.env.REFERRAL_REWARDS_ENABLED === "true",
});
