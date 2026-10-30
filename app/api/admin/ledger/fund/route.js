import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-auth";
import { postTransaction, platformAccountId } from "@/lib/ledger";
export const dynamic = "force-dynamic";
// Records operator funding of the reward pool. It must mirror real funds actually deposited; amount, note and admin are audited.
const Body = z.object({ amountCents: z.number().int().positive().max(100_000_000_00), note: z.string().min(5).max(300), confirm: z.literal("FUND") });
export async function POST(req) {
  const a = await requireAdmin(req, "SUPER_ADMIN"); if (a.res) return a.res;
  const p = Body.safeParse(await req.json().catch(() => null)); if (!p.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const db = getDb(), amt = BigInt(p.data.amountCents);
  await db.$transaction(async (tx) => {
    const id = await postTransaction(tx, { kind: "POOL_FUNDING", refType: "Admin", refId: a.admin.id, lines: [{ accountId: await platformAccountId(tx, "EXTERNAL_CHAIN"), amountCents: -amt }, { accountId: await platformAccountId(tx, "PLATFORM_REWARD_POOL"), amountCents: amt }] });
    await audit(tx, a.admin, req, "ledger.fund_pool", "LedgerTransaction", id, null, { amountCents: p.data.amountCents, note: p.data.note });
  });
  return Response.json({ ok: true });
}
