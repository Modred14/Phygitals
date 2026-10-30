import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
const Body = z.object({ status: z.enum(["ACTIVE", "PAUSED"]) });
export async function POST(req, { params }) {
  const a = await requireAdmin(req, "FINANCE"); if (a.res) return a.res;
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const db = getDb(), pack = await db.pack.findUnique({ where: { id: params.id } });
  if (!pack) return Response.json({ error: "not_found" }, { status: 404 });
  if (p.data.status === "ACTIVE" && !pack.activeConfigId) return Response.json({ error: "no_published_config" }, { status: 409 });
  await db.$transaction(async (tx) => { await tx.pack.update({ where: { id: pack.id }, data: { status: p.data.status } }); await audit(tx, a.admin, req, "pack.status", "Pack", pack.id, { status: pack.status }, p.data); });
  return Response.json({ ok: true });
}
