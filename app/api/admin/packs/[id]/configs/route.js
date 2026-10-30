import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-auth";
import { validateConfig } from "@/lib/odds";
export const dynamic = "force-dynamic";
// Configs are immutable once saved: any change is a NEW version (auditable history). Publishing is a separate step.
const Tier = z.object({ label: z.string().min(1).max(60), minCents: z.number().int().min(0), maxCents: z.number().int().min(0), probabilityPpm: z.number().int().min(0).max(1_000_000) });
const Body = z.object({ priceCents: z.number().int().positive(), tiers: z.array(Tier).min(1).max(30) });
export async function POST(req, { params }) {
  const a = await requireAdmin(req, "SUPER_ADMIN"); if (a.res) return a.res;
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const v = validateConfig(p.data);
  if (!v.ok) return Response.json({ error: "invalid_config", errors: v.errors }, { status: 422 });
  const db = getDb();
  const cfg = await db.$transaction(async (tx) => {
    const pack = await tx.pack.findUnique({ where: { id: params.id } }); if (!pack) throw Object.assign(new Error("not_found"), { status: 404 });
    const last = await tx.rewardConfigurationVersion.aggregate({ where: { packId: pack.id }, _max: { version: true } });
    const c = await tx.rewardConfigurationVersion.create({ data: { packId: pack.id, version: (last._max.version ?? 0) + 1, priceCents: BigInt(p.data.priceCents), status: "VALIDATED", expectedValueCents: v.expectedValueCents, maxLiabilityCents: BigInt(v.maxLiabilityCents),
      tiers: { create: p.data.tiers.map((t, i) => ({ label: t.label, minCents: BigInt(t.minCents), maxCents: BigInt(t.maxCents), probabilityPpm: t.probabilityPpm, sortOrder: i })) } } });
    await audit(tx, a.admin, req, "config.create", "RewardConfigurationVersion", c.id, null, { packId: pack.id, version: c.version, ...p.data });
    return c;
  }).catch((e) => e);
  if (cfg instanceof Error) return Response.json({ error: cfg.message }, { status: cfg.status ?? 500 });
  return Response.json({ id: cfg.id, version: cfg.version });
}
