import { postTransaction, platformAccountId } from "./ledger.js";

// Rule (default, operator-configurable in Admin → Settings): the referred user makes ONE verified deposit >= minDepositCents.
export const qualifies = (depositCents, rules) => Number.isSafeInteger(depositCents) && rules.rewardCents > 0 && depositCents >= rules.minDepositCents;

export const maskName = (u) => (u ? `${u.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, u.length - 2)))}` : "Player");

// Wallet addresses a user has paid from (verified deposits) or withdrawn to.
async function walletsOf(tx, userId) {
  const deps = await tx.deposit.findMany({ where: { userId, status: "CREDITED", chainTxId: { not: null } }, select: { chainTxId: true } });
  const chain = deps.length ? await tx.blockchainTransaction.findMany({ where: { signature: { in: deps.map((d) => d.chainTxId) } }, select: { rawSummary: true } }) : [];
  const wds = await tx.withdrawal.findMany({ where: { userId }, select: { destination: true } });
  return new Set([...chain.flatMap((c) => c.rawSummary?.senders ?? []), ...wds.map((w) => w.destination)]);
}
export async function sharedWallet(tx, a, b) {
  const [wa, wb] = await Promise.all([walletsOf(tx, a), walletsOf(tx, b)]);
  return [...wa].some((w) => wb.has(w));
}

// Confirms rewards whose hold period has ended. Self-dealing (shared wallet) or a banned referrer revokes instead of paying.
export async function confirmDueRewards(db, { holdDays, now = new Date() }) {
  const cutoff = new Date(now.getTime() - holdDays * 86_400_000);
  const due = await db.referralReward.findMany({ where: { status: "PENDING", createdAt: { lte: cutoff } }, include: { referral: true }, take: 200 });
  const tally = { confirmed: 0, revoked: 0, skipped: 0 };
  for (const r of due) {
    const out = await db.$transaction(async (tx) => {
      const [row] = await tx.$queryRaw`SELECT status FROM "ReferralReward" WHERE id = ${r.id} FOR UPDATE`;
      if (row.status !== "PENDING") return "skipped";
      const referrer = await tx.user.findUnique({ where: { id: r.referral.referrerId }, select: { bannedAt: true } });
      const reason = referrer?.bannedAt ? "referrer_banned" : (await sharedWallet(tx, r.referral.referrerId, r.referral.referredId)) ? "shared_wallet" : null;
      if (reason) {
        await tx.referralReward.update({ where: { id: r.id }, data: { status: "REVOKED", reason } });
        await tx.referral.update({ where: { id: r.referralId }, data: { status: "REJECTED" } });
        return "revoked";
      }
      const [acct] = await tx.$queryRaw`SELECT id FROM "LedgerAccount" WHERE "userId" = ${r.referral.referrerId} AND type = 'USER_AVAILABLE'::"LedgerAccountType" FOR UPDATE`;
      await postTransaction(tx, { kind: "REFERRAL_REWARD", refType: "ReferralReward", refId: r.id, lines: [
        { accountId: await platformAccountId(tx, "PLATFORM_MARKETING"), amountCents: -r.amountCents },
        { accountId: acct.id, amountCents: r.amountCents, idempotencyKey: `referral:${r.id}` } ] });
      await tx.referralReward.update({ where: { id: r.id }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
      return "confirmed";
    }, { timeout: 15000 }).catch(() => "skipped");
    tally[out]++;
  }
  return tally;
}
