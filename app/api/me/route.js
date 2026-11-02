// FILE: app/api/me/route.js
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
  const [balanceCents, invited, eligible, opened] = await Promise.all([
    getAvailableCents(db, uid),
    db.referral.count({ where: { referrerId: uid } }),
    db.referral.count({ where: { referrerId: uid, status: "ELIGIBLE" } }),
    db.packOpening.aggregate({ where: { userId: uid }, _count: true, _max: { rewardCents: true } }),
  ]);
  return Response.json({
    user: { id: user.id, username: user.telegram?.username, firstName: user.telegram?.firstName, photoUrl: user.telegram?.photoUrl ?? null, referralCode: user.referralCode, referredBy: user.referredBy?.telegram?.username ?? null, joinedAt: user.createdAt },
    balanceCents, referrals: { invited, eligible }, stats: { openings: opened._count, bestPullCents: Number(opened._max.rewardCents ?? 0n) }, flags: flags(), botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  });
}