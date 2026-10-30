import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const uid = readSession(req);
  if (!uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const rows = await getDb().packOpening.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" }, take: 50, include: { pack: true, tier: true } });
  return Response.json({ openings: rows.map((o) => ({ id: o.id, pack: o.pack.name, slug: o.pack.slug, tierLabel: o.tier.label, priceCents: Number(o.priceCents), rewardCents: Number(o.rewardCents), testMode: o.isTestMode, createdAt: o.createdAt })) });
}
