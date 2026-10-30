import { z } from "zod";
import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { flags } from "@/lib/flags";
import { drawReward, validateConfig } from "@/lib/reward-engine";
import { postTransaction, platformAccountId, getAvailableCents } from "@/lib/ledger";
export const dynamic = "force-dynamic";

const Body = z.object({ idempotencyKey: z.string().uuid() });
const err = (code, status, extra = {}) => Response.json({ error: code, ...extra }, { status });
const view = (o, tierLabel) => ({ id: o.id, packId: o.packId, tierLabel, priceCents: Number(o.priceCents), rewardCents: Number(o.rewardCents), testMode: o.isTestMode, createdAt: o.createdAt });

export async function POST(req, { params }) {
  const uid = readSession(req);
  if (!uid) return err("unauthorized", 401);
  if (!rateLimit(`open:${uid}`, 20)) return err("rate_limited", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("bad_request", 400);
  const { idempotencyKey } = parsed.data;
  const live = flags().paidOpenings;
  const db = getDb();

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: uid }, select: { id: true, bannedAt: true } });
      if (!user || user.bannedAt) throw Object.assign(new Error("unauthorized"), { status: 401 });

      // Serialise this user's money operations: row-lock their ledger account for the rest of the transaction.
      const [acct] = await tx.$queryRaw`SELECT id FROM "LedgerAccount" WHERE "userId" = ${uid} AND type = 'USER_AVAILABLE'::"LedgerAccountType" FOR UPDATE`;
      if (!acct) throw Object.assign(new Error("no_account"), { status: 409 });

      // Idempotency: replaying the same key returns the original outcome and never charges twice.
      const prior = await tx.packOpening.findUnique({ where: { userId_idempotencyKey: { userId: uid, idempotencyKey } }, include: { tier: true } });
      if (prior) return { opening: view(prior, prior.tier.label), replay: true };

      const pack = await tx.pack.findUnique({ where: { slug: params.slug } });
      if (!pack) throw Object.assign(new Error("not_found"), { status: 404 });
      if (live && pack.status !== "ACTIVE") throw Object.assign(new Error("pack_unavailable"), { status: 409 });

      const config = await tx.rewardConfigurationVersion.findFirst({
        where: { packId: pack.id, ...(live ? { status: "PUBLISHED" } : {}) }, orderBy: { version: "desc" }, include: { tiers: { orderBy: { sortOrder: "asc" } } },
      });
      if (!config) throw Object.assign(new Error("pack_unavailable"), { status: 409 });

      const tiers = config.tiers.map((t) => ({ id: t.id, label: t.label, minCents: Number(t.minCents), maxCents: Number(t.maxCents), probabilityPpm: t.probabilityPpm }));
      // Refuse to draw from a config whose odds don't total exactly 100% (defence in depth; admin publish also validates).
      if (!validateConfig({ priceCents: Number(config.priceCents), tiers }).ok) throw Object.assign(new Error("pack_unavailable"), { status: 409 });

      const price = config.priceCents;
      if (live) {
        const bal = await getAvailableCents(tx, uid);
        if (BigInt(bal) < price) throw Object.assign(new Error("insufficient_balance"), { status: 402, shortfallCents: Number(price - BigInt(bal)) });
      }

      const draw = drawReward(tiers); // server-side CSPRNG only
      const opening = await tx.packOpening.create({
        data: { userId: uid, packId: pack.id, configId: config.id, tierId: draw.tierId, idempotencyKey, priceCents: price, rewardCents: BigInt(draw.amountCents), roll: draw.roll, isTestMode: !live },
      });

      if (live) {
        const treasury = await platformAccountId(tx, "PLATFORM_TREASURY");
        const pool = await platformAccountId(tx, "PLATFORM_REWARD_POOL");
        await postTransaction(tx, { kind: "PACK_PURCHASE", refType: "PackOpening", refId: opening.id, lines: [
          { accountId: acct.id, amountCents: -price, idempotencyKey: `open:${uid}:${idempotencyKey}:buy` },
          { accountId: treasury, amountCents: price } ] });
        if (draw.amountCents > 0) await postTransaction(tx, { kind: "PACK_REWARD", refType: "PackOpening", refId: opening.id, lines: [
          { accountId: pool, amountCents: -BigInt(draw.amountCents) },
          { accountId: acct.id, amountCents: BigInt(draw.amountCents), idempotencyKey: `open:${uid}:${idempotencyKey}:reward` } ] });
      }
      return { opening: view(opening, tiers.find((t) => t.id === draw.tierId).label), replay: false };
    }, { isolationLevel: "ReadCommitted", timeout: 15000 });

    return Response.json({ ...result, balanceCents: await getAvailableCents(db, uid) });
  } catch (e) {
    if (e.status) return err(e.message, e.status, e.shortfallCents ? { shortfallCents: e.shortfallCents } : {});
    if (e.code === "P2002") return err("duplicate_request", 409); // concurrent replay hit the unique constraint
    console.error("open_pack_failed", e.message);
    return err("internal_error", 500);
  }
}
