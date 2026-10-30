// Usage: node scripts/create-admin.js you@example.com 'LongPassword' SUPER_ADMIN
const { PrismaClient } = require("@prisma/client");
(async () => {
  const [email, password, role = "SUPER_ADMIN"] = process.argv.slice(2);
  if (!email || !password || password.length < 12) throw new Error("need email and a password of 12+ chars");
  const { hashPassword } = await import("../lib/admin-auth.js");
  const { newSecret, otpauthUri } = await import("../lib/totp.js");
  const { encrypt } = await import("../lib/crypto.js");
  const secret = newSecret(), db = new PrismaClient();
  await db.admin.upsert({ where: { email }, update: { passwordHash: hashPassword(password), totpSecretEnc: encrypt(secret), role, disabledAt: null }, create: { email, passwordHash: hashPassword(password), totpSecretEnc: encrypt(secret), role } });
  console.log("Admin saved. Add this to your authenticator app NOW (shown once):\n" + otpauthUri(email, secret));
  await db.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
