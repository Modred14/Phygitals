import { getDb } from "@/lib/db";
import { flags } from "@/lib/flags";
export const dynamic = "force-dynamic";
// Public: odds must be visible before purchase. Live mode only shows PUBLISHED configs; otherwise latest config is shown labelled test mode.
export async function GET() {
  const live = flags().paidOpenings;
  const packs = await getDb().pack.findMany({
    where: live ? { status: "ACTIVE" } : {}, orderBy: { sortOrder: "asc" },
    include: { configs: { where: live ? { status: "PUBLISHED" } : {}, orderBy: { version: "desc" }, take: 1, include: { tiers: { orderBy: { sortOrder: "asc" } } } } },
  });
  return Response.json({
    testMode: !live,
    packs: packs.filter((p) => p.configs[0]).map((p) => {
      const c = p.configs[0];
      const mins = c.tiers.map((t) => Number(t.minCents)), maxs = c.tiers.map((t) => Number(t.maxCents));
      return { id: p.id, slug: p.slug, name: p.name, configVersion: c.version, priceCents: Number(c.priceCents), minCents: Math.min(...mins), maxCents: Math.max(...maxs),
        tiers: c.tiers.map((t) => ({ id: t.id, label: t.label, minCents: Number(t.minCents), maxCents: Number(t.maxCents), probabilityPpm: t.probabilityPpm })) };
    }),
  });
}
