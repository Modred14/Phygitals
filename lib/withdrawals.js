// Fees are configurable. The platform processing fee is OURS and is never described as a blockchain fee;
// the Solana network fee (paid in SOL) is covered by the payout wallet and shown separately.
export function withdrawalSettings(env = process.env) {
  return { feeCents: Number(env.WITHDRAWAL_FEE_CENTS ?? 300), minCents: Number(env.WITHDRAWAL_MIN_CENTS ?? 1000), maxCents: Number(env.WITHDRAWAL_MAX_CENTS ?? 100000_00) };
}
export function quote(amountCents, s = withdrawalSettings()) {
  if (!Number.isSafeInteger(amountCents) || amountCents < s.minCents || amountCents > s.maxCents) return { ok: false, error: "amount_out_of_range", minCents: s.minCents };
  if (amountCents <= s.feeCents) return { ok: false, error: "amount_below_fee", minCents: s.minCents };
  return { ok: true, amountCents, platformFeeCents: s.feeCents, receiveCents: amountCents - s.feeCents, network: "Solana", asset: "USDC", eta: "Usually within 24 hours after review" };
}
export const CAN_SETTLE = new Set(["PENDING", "PROCESSING"]);
