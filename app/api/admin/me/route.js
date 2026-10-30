import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET(req) { const a = await requireAdmin(req); if (a.res) return a.res; return Response.json({ email: a.admin.email, role: a.admin.role }); }
