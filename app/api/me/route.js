import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
import { getAvailableCents } from "@/lib/ledger";
import { flags } from "@/lib/flags";
export const dynamic = "force-dynamic";
export async function GET(req) {
  const uid = readSession(req);
  if (!uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const user = await db.user.findUnique({ where: { id: uid }, include: { telegram: true, referredBy: { include: { telegram: true } } } });
  if (!user || user.bannedAt) return Response.json({ error: "unauthorized" }, { status: 401 });
  const [balanceCents, invited, eligible] = await Promise.all([
    getAvailableCents(db, uid),
    db.referral.count({ where: { referrerId: uid } }),
    db.referral.count({ where: { referrerId: uid, status: "ELIGIBLE" } }),
  ]);
  return Response.json({
    user: { id: user.id, username: user.telegram?.username, firstName: user.telegram?.firstName, referralCode: user.referralCode, referredBy: user.referredBy?.telegram?.username ?? null, joinedAt: user.createdAt },
    balanceCents, referrals: { invited, eligible }, flags: flags(), botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  });
}
