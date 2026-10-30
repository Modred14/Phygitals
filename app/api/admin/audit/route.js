import { getDb } from "@/lib/db";
import { requireAdmin, ser } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const a = await requireAdmin(req, "SUPER_ADMIN"); if (a.res) return a.res;
  const rows = await getDb().auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { admin: { select: { email: true } } } });
  return Response.json(ser({ logs: rows.map((l) => ({ id: l.id, admin: l.admin?.email, action: l.action, entity: l.entity, entityId: l.entityId, before: l.before, after: l.after, ip: l.ip, createdAt: l.createdAt })) }));
}
