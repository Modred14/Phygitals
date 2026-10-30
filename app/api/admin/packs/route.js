import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin, audit, ser } from "@/lib/admin-auth";
import { validateConfig } from "@/lib/odds";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const a = await requireAdmin(req); if (a.res) return a.res;
  const db = getDb();
  const [packs, pool] = await Promise.all([
    db.pack.findMany({ orderBy: { sortOrder: "asc" }, include: { configs: { orderBy: { version: "desc" }, take: 10, include: { tiers: { orderBy: { sortOrder: "asc" } } } } } }),
    db.$queryRaw`SELECT COALESCE(SUM(e."amountCents"),0)::bigint AS bal FROM "LedgerAccount" a JOIN "LedgerEntry" e ON e."accountId"=a.id WHERE a.type='PLATFORM_REWARD_POOL'::"LedgerAccountType"`,
  ]);
  return Response.json(ser({ rewardPoolCents: Number(pool[0]?.bal ?? 0), packs: packs.map((p) => ({ ...p, configs: p.configs.map((c) => ({ ...c, validation: validateConfig({ priceCents: Number(c.priceCents), tiers: c.tiers.map((t) => ({ label: t.label, minCents: Number(t.minCents), maxCents: Number(t.maxCents), probabilityPpm: t.probabilityPpm })) }) })) })) }));
}
const Body = z.object({ slug: z.string().regex(/^[a-z0-9-]{2,40}$/), name: z.string().min(2).max(60) });
export async function POST(req) {
  const a = await requireAdmin(req, "SUPER_ADMIN"); if (a.res) return a.res;
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const db = getDb();
  try { const pack = await db.$transaction(async (tx) => { const x = await tx.pack.create({ data: { ...p.data, status: "DRAFT", sortOrder: await tx.pack.count() } }); await audit(tx, a.admin, req, "pack.create", "Pack", x.id, null, p.data); return x; }); return Response.json({ id: pack.id }); }
  catch (e) { return Response.json({ error: e.code === "P2002" ? "slug_taken" : "internal_error" }, { status: e.code === "P2002" ? 409 : 500 }); }
}
