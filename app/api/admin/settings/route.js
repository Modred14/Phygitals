import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-auth";
import { loadWithdrawalSettings, loadReferralSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";
const Body = z.object({ withdrawal: z.object({ feeCents: z.number().int().min(0).max(100000), minCents: z.number().int().min(1), maxCents: z.number().int().min(1) }).refine((w) => w.minCents > w.feeCents && w.maxCents >= w.minCents), referral: z.object({ rewardCents: z.number().int().min(0).max(100000), minDepositCents: z.number().int().min(1).max(10000000), holdDays: z.number().int().min(0).max(90) }), confirm: z.literal("SAVE") });
export async function GET(req) {
  const a = await requireAdmin(req, "SUPER_ADMIN"); if (a.res) return a.res;
  const db = getDb(); return Response.json({ withdrawal: await loadWithdrawalSettings(db), referral: await loadReferralSettings(db) });
}
export async function POST(req) {
  const a = await requireAdmin(req, "SUPER_ADMIN"); if (a.res) return a.res;
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const db = getDb(), before = { withdrawal: await loadWithdrawalSettings(db), referral: await loadReferralSettings(db) };
  await db.$transaction(async (tx) => {
    for (const k of ["withdrawal", "referral"]) await tx.appSettings.upsert({ where: { key: k }, update: { value: p.data[k] }, create: { key: k, value: p.data[k] } });
    await audit(tx, a.admin, req, "settings.update", "AppSettings", null, before, { withdrawal: p.data.withdrawal, referral: p.data.referral });
  });
  return Response.json({ ok: true });
}
