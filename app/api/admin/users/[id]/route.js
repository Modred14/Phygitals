import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
const Body = z.object({ action: z.enum(["ban", "unban"]), reason: z.string().min(3).max(300) });
export async function POST(req, { params }) {
  const a = await requireAdmin(req, "FINANCE"); if (a.res) return a.res;
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const db = getDb(), u = await db.user.findUnique({ where: { id: params.id } });
  if (!u) return Response.json({ error: "not_found" }, { status: 404 });
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: u.id }, data: { bannedAt: p.data.action === "ban" ? new Date() : null } });
    await audit(tx, a.admin, req, `user.${p.data.action}`, "User", u.id, { bannedAt: u.bannedAt }, { reason: p.data.reason });
  });
  return Response.json({ ok: true });
}
