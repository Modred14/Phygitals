import { z } from "zod";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword, hashPassword, adminCookie } from "@/lib/admin-auth";
import { matchTotpStep } from "@/lib/totp";
import { decrypt } from "@/lib/crypto";
export const dynamic = "force-dynamic";
const Body = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200), totp: z.string().length(6) });
let DUMMY;
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const p = Body.safeParse(await req.json().catch(() => null));
  const fail = () => Response.json({ error: "invalid_credentials" }, { status: 401 });
  if (!p.success) return fail();
  if (!rateLimit(`adm:${ip}:${p.data.email.toLowerCase()}`, 5, 10 * 60_000)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const admin = await getDb().admin.findUnique({ where: { email: p.data.email } });
  DUMMY ??= hashPassword("dummy-password-for-timing");
  const pwOk = verifyPassword(p.data.password, admin?.passwordHash ?? DUMMY); // same work for unknown emails
  if (!admin || admin.disabledAt || !pwOk || !admin.totpSecretEnc) return fail();
  const step = matchTotpStep(decrypt(admin.totpSecretEnc), p.data.totp);
  if (step === null) return fail();
  // Atomic replay guard: only succeeds if this step is newer than the last accepted one.
  const claimed = await getDb().admin.updateMany({ where: { id: admin.id, OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: step } }] }, data: { lastTotpStep: step } });
  if (claimed.count !== 1) return fail();
  await getDb().auditLog.create({ data: { adminId: admin.id, action: "admin.login", entity: "Admin", entityId: admin.id, ip } });
  return Response.json({ email: admin.email, role: admin.role }, { headers: { "Set-Cookie": adminCookie(admin.id) } });
}
