import { getDb } from "@/lib/db";
import { requireAdmin, ser } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const a = await requireAdmin(req); if (a.res) return a.res;
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 64), db = getDb();
  const where = q ? { OR: [{ id: q }, { referralCode: q }, { telegram: { username: { contains: q, mode: "insensitive" } } }, ...(/^\d{1,15}$/.test(q) ? [{ telegram: { telegramId: BigInt(q) } }] : [])] } : {};
  const users = await db.user.findMany({ where, orderBy: { createdAt: "desc" }, take: 50, include: { telegram: true } });
  const ids = users.map((u) => u.id);
  const bals = ids.length ? await db.$queryRaw`SELECT a."userId" AS id, COALESCE(SUM(e."amountCents"),0)::bigint AS bal FROM "LedgerAccount" a LEFT JOIN "LedgerEntry" e ON e."accountId"=a.id WHERE a.type='USER_AVAILABLE'::"LedgerAccountType" AND a."userId" = ANY(${ids}::text[]) GROUP BY a."userId"` : [];
  const m = Object.fromEntries(bals.map((b) => [b.id, Number(b.bal)]));
  return Response.json(ser({ users: users.map((u) => ({ id: u.id, username: u.telegram?.username, telegramId: u.telegram?.telegramId, balanceCents: m[u.id] ?? 0, bannedAt: u.bannedAt, createdAt: u.createdAt, referralCode: u.referralCode })) }));
}
