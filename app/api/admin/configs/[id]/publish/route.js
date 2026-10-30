import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-auth";
import { validateConfig } from "@/lib/odds";
export const dynamic = "force-dynamic";
// Publishing is the ONLY way odds go live. It re-validates server-side, forces explicit acknowledgements for risky configs,
// retires the previous version, and is fully audited. There is no per-user override anywhere.
const Body = z.object({ confirm: z.literal("PUBLISH"), acknowledgeEvExceedsPrice: z.boolean().default(false), acknowledgeUnfundedLiability: z.boolean().default(false) });
export async function POST(req, { params }) {
  const a = await requireAdmin(req, "SUPER_ADMIN"); if (a.res) return a.res;
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const db = getDb();
  try {
    const out = await db.$transaction(async (tx) => {
      const cfg = await tx.rewardConfigurationVersion.findUnique({ where: { id: params.id }, include: { tiers: true } });
      if (!cfg) throw Object.assign(new Error("not_found"), { status: 404 });
      if (cfg.status === "PUBLISHED" || cfg.status === "RETIRED") throw Object.assign(new Error("invalid_state"), { status: 409 });
      await tx.$queryRaw`SELECT id FROM "Pack" WHERE id = ${cfg.packId} FOR UPDATE`;
      const v = validateConfig({ priceCents: Number(cfg.priceCents), tiers: cfg.tiers.map((t) => ({ label: t.label, minCents: Number(t.minCents), maxCents: Number(t.maxCents), probabilityPpm: t.probabilityPpm })) });
      if (!v.ok) throw Object.assign(new Error("invalid_config"), { status: 422, errors: v.errors });
      if (v.evExceedsPrice && !p.data.acknowledgeEvExceedsPrice) throw Object.assign(new Error("ack_required_ev_exceeds_price"), { status: 422, returnToPlayerPct: v.returnToPlayerPct });
      const [{ bal }] = await tx.$queryRaw`SELECT COALESCE(SUM(e."amountCents"),0)::bigint AS bal FROM "LedgerAccount" a JOIN "LedgerEntry" e ON e."accountId"=a.id WHERE a.type='PLATFORM_REWARD_POOL'::"LedgerAccountType"`;
      if (Number(bal) < v.maxLiabilityCents && !p.data.acknowledgeUnfundedLiability) throw Object.assign(new Error("ack_required_unfunded_liability"), { status: 422, poolCents: Number(bal), maxLiabilityCents: v.maxLiabilityCents });
      const prev = await tx.rewardConfigurationVersion.findFirst({ where: { packId: cfg.packId, status: "PUBLISHED" } });
      if (prev) await tx.rewardConfigurationVersion.update({ where: { id: prev.id }, data: { status: "RETIRED" } });
      await tx.rewardConfigurationVersion.update({ where: { id: cfg.id }, data: { status: "PUBLISHED", publishedAt: new Date(), publishedBy: a.admin.id, evAcknowledgedBy: p.data.acknowledgeEvExceedsPrice ? a.admin.id : null } });
      await tx.pack.update({ where: { id: cfg.packId }, data: { activeConfigId: cfg.id, status: "ACTIVE" } });
      await audit(tx, a.admin, req, "config.publish", "RewardConfigurationVersion", cfg.id, { previous: prev?.id ?? null }, { version: cfg.version, rtpPct: v.returnToPlayerPct, maxLiabilityCents: v.maxLiabilityCents, acks: p.data });
      return { version: cfg.version };
    });
    return Response.json({ ok: true, ...out });
  } catch (e) { return Response.json({ error: e.message, ...(e.errors ? { errors: e.errors } : {}), ...(e.returnToPlayerPct ? { returnToPlayerPct: e.returnToPlayerPct } : {}), ...(e.poolCents !== undefined ? { poolCents: e.poolCents, maxLiabilityCents: e.maxLiabilityCents } : {}) }, { status: e.status ?? 500 }); }
}
