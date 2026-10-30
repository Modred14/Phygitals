import { randomBytes } from "node:crypto";
export async function upsertTelegramUser(db, tg, startParam) {
  const telegramId = BigInt(tg.id);
  const profile = { username: tg.username ?? null, firstName: tg.first_name ?? null, lastName: tg.last_name ?? null, photoUrl: tg.photo_url ?? null, languageCode: tg.language_code ?? null, lastAuthAt: new Date() };
  const existing = await db.telegramAccount.findUnique({ where: { telegramId } });
  if (existing) {
    await db.telegramAccount.update({ where: { telegramId }, data: profile });
    return existing.userId;
  }
  return db.$transaction(async (tx) => {
    const referrer = startParam ? await tx.user.findUnique({ where: { referralCode: startParam }, select: { id: true } }) : null;
    const user = await tx.user.create({
      data: { referralCode: randomBytes(6).toString("hex"), referredById: referrer?.id ?? null, telegram: { create: { telegramId, ...profile } } },
    });
    const acct = await tx.ledgerAccount.create({ data: { type: "USER_AVAILABLE", userId: user.id } });
    await tx.wallet.create({ data: { userId: user.id, availableAccountId: acct.id } });
    // Self-referral is impossible here (referrer must pre-exist). Reward is NOT credited; it needs a verified qualifying action.
    if (referrer) await tx.referral.create({ data: { referrerId: referrer.id, referredId: user.id } });
    return user.id;
  });
}
