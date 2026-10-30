// Development seed. Creates DRAFT test configs only; never creates balances or deposits.
const { PrismaClient } = require("@prisma/client");
(async () => {
  const { SEED_PACKS } = await import("./seed-data.js");
  const { validateConfig } = await import("../lib/reward-engine.js");
  const db = new PrismaClient();
  for (const type of ["PLATFORM_TREASURY", "PLATFORM_REWARD_POOL", "PLATFORM_FEES", "PLATFORM_MARKETING", "EXTERNAL_CHAIN"]) {
    if (!(await db.ledgerAccount.findFirst({ where: { type, userId: null } }))) await db.ledgerAccount.create({ data: { type } });
  }
  for (const [i, p] of SEED_PACKS.entries()) {
    const v = validateConfig(p);
    if (!v.ok) throw new Error(`${p.slug}: ${v.errors.join("; ")}`);
    const pack = await db.pack.upsert({ where: { slug: p.slug }, update: {}, create: { slug: p.slug, name: p.name, sortOrder: i, status: "DRAFT" } });
    const exists = await db.rewardConfigurationVersion.findUnique({ where: { packId_version: { packId: pack.id, version: 1 } } });
    if (exists) continue;
    await db.rewardConfigurationVersion.create({ data: {
      packId: pack.id, version: 1, priceCents: BigInt(p.priceCents), status: "VALIDATED", expectedValueCents: v.expectedValueCents, maxLiabilityCents: BigInt(v.maxLiabilityCents),
      tiers: { create: p.tiers.map((t, n) => ({ label: t.label, minCents: BigInt(t.minCents), maxCents: BigInt(t.maxCents), probabilityPpm: t.probabilityPpm, sortOrder: n })) } } });
  }
  console.log("seeded"); await db.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
