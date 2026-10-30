import { getDb } from "@/lib/db";
import { requireAdmin, ser } from "@/lib/admin-auth";
import { validateConfig } from "@/lib/odds";
import { flags } from "@/lib/flags";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const a = await requireAdmin(req); if (a.res) return a.res;
  const db = getDb();
  const [users, referrals, eligible, refPaid, deposits, wdPending, balances, unbalanced, packs, openAgg] = await Promise.all([
    db.user.count(), db.referral.count(), db.referral.count({ where: { status: "ELIGIBLE" } }),
    db.referralReward.aggregate({ where: { status: "CONFIRMED" }, _sum: { amountCents: true } }),
    db.deposit.aggregate({ where: { status: "CREDITED" }, _sum: { creditedCents: true }, _count: true }),
    db.withdrawal.aggregate({ where: { status: { in: ["PENDING", "PROCESSING"] } }, _sum: { amountCents: true }, _count: true }),
    db.$queryRaw`SELECT a.type::text AS type, COALESCE(SUM(e."amountCents"),0)::bigint AS balance FROM "LedgerAccount" a LEFT JOIN "LedgerEntry" e ON e."accountId"=a.id GROUP BY a.type`,
    db.$queryRaw`SELECT COUNT(*)::int AS n FROM (SELECT "transactionId" FROM "LedgerEntry" GROUP BY "transactionId" HAVING SUM("amountCents") <> 0) t`,
    db.pack.findMany({ orderBy: { sortOrder: "asc" }, include: { configs: { where: { status: "PUBLISHED" }, take: 1, include: { tiers: true } } } }),
    db.packOpening.groupBy({ by: ["packId", "isTestMode"], _count: true, _sum: { priceCents: true, rewardCents: true } }),
  ]);
  const bal = Object.fromEntries(balances.map((b) => [b.type, Number(b.balance)]));
  const liability = packs.map((p) => {
    const c = p.configs[0]; if (!c) return { pack: p.name, status: p.status, published: false };
    const v = validateConfig({ priceCents: Number(c.priceCents), tiers: c.tiers.map((t) => ({ label: t.label, minCents: Number(t.minCents), maxCents: Number(t.maxCents), probabilityPpm: t.probabilityPpm })) });
    return { pack: p.name, status: p.status, published: true, version: c.version, priceCents: Number(c.priceCents), maxLiabilityCents: v.maxLiabilityCents, expectedValueCents: v.expectedValueCents, rtpPct: v.returnToPlayerPct };
  });
  return Response.json(ser({ flags: flags(), users, referrals: { total: referrals, eligible, paidCents: refPaid._sum.amountCents ?? 0 },
    deposits: { count: deposits._count, creditedCents: deposits._sum.creditedCents ?? 0 }, withdrawalsOpen: { count: wdPending._count, cents: wdPending._sum.amountCents ?? 0 },
    owedToUsersCents: (bal.USER_AVAILABLE ?? 0) + (bal.USER_WITHDRAWAL_RESERVED ?? 0), rewardPoolCents: bal.PLATFORM_REWARD_POOL ?? 0, treasuryCents: bal.PLATFORM_TREASURY ?? 0, feesCents: bal.PLATFORM_FEES ?? 0,
    unbalancedTransactions: unbalanced[0].n, liability, openings: openAgg }));
}
