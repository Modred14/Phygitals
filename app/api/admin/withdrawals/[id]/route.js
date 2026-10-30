import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-auth";
import { postTransaction, platformAccountId } from "@/lib/ledger";
import { SIG_RE, fetchFinalizedTx, tokenDeltaAtomic, centsToAtomic } from "@/lib/solana";
import { CAN_SETTLE } from "@/lib/withdrawals";
export const dynamic = "force-dynamic";
// FINANCE+ only. Every action writes an AuditLog row.
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("complete"), signature: z.string().regex(SIG_RE) }),
  z.object({ action: z.literal("fail"), reason: z.string().min(3).max(300) }),
]);
const err = (c, s, x = {}) => Response.json({ error: c, ...x }, { status: s });

export async function POST(req, { params }) {
  const a = await requireAdmin(req, "FINANCE"); if (a.res) return a.res;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("bad_request", 400);
  const b = parsed.data, db = getDb();
  const w0 = await db.withdrawal.findUnique({ where: { id: params.id } });
  if (!w0) return err("not_found", 404);

  // On-chain proof BEFORE we ever mark success: payout must have reached the destination in the right amount.
  let proof = null;
  if (b.action === "complete") {
    let tx; try { tx = await fetchFinalizedTx(b.signature); } catch { return err("rpc_unavailable", 503); }
    if (!tx?.meta || tx.meta.err) return err("tx_not_confirmed_or_failed", 422);
    const got = tokenDeltaAtomic(tx, w0.destination, process.env.SOLANA_USDC_MINT);
    const need = centsToAtomic(w0.amountCents - w0.platformFeeCents);
    if (got < need) return err("payout_amount_mismatch", 422);
    proof = { slot: BigInt(tx.slot), got: got.toString() };
  }

  try {
    await db.$transaction(async (tx) => {
      const [row] = await tx.$queryRaw`SELECT status FROM "Withdrawal" WHERE id = ${w0.id} FOR UPDATE`;
      if (!CAN_SETTLE.has(row.status)) throw Object.assign(new Error("invalid_state"), { status: 409 });
      const reserved = await tx.ledgerAccount.findFirst({ where: { type: "USER_WITHDRAWAL_RESERVED", userId: w0.userId }, select: { id: true } });
      const amt = w0.amountCents, fee = w0.platformFeeCents;
      if (b.action === "approve") {
        await tx.withdrawal.update({ where: { id: w0.id }, data: { status: "PROCESSING" } });
      } else if (b.action === "complete") {
        await tx.blockchainTransaction.create({ data: { network: "solana", signature: b.signature, status: "FINALIZED", direction: "OUT", slot: proof.slot, rawSummary: { withdrawalId: w0.id, delivered: proof.got } } });
        await tx.withdrawal.update({ where: { id: w0.id }, data: { status: "COMPLETED", signature: b.signature } });
        const lines = [{ accountId: reserved.id, amountCents: -amt }, { accountId: await platformAccountId(tx, "EXTERNAL_CHAIN"), amountCents: amt - fee }];
        if (fee > 0n) lines.push({ accountId: await platformAccountId(tx, "PLATFORM_FEES"), amountCents: fee });
        await postTransaction(tx, { kind: "WITHDRAWAL_COMPLETE", refType: "Withdrawal", refId: w0.id, lines });
      } else {
        const [acct] = await tx.$queryRaw`SELECT id FROM "LedgerAccount" WHERE "userId" = ${w0.userId} AND type = 'USER_AVAILABLE'::"LedgerAccountType" FOR UPDATE`;
        await tx.withdrawal.update({ where: { id: w0.id }, data: { status: "FAILED", failureReason: b.reason } });
        await postTransaction(tx, { kind: "WITHDRAWAL_RELEASE", refType: "Withdrawal", refId: w0.id, lines: [{ accountId: reserved.id, amountCents: -amt }, { accountId: acct.id, amountCents: amt }] });
      }
      await audit(tx, a.admin, req, `withdrawal.${b.action}`, "Withdrawal", w0.id, { status: row.status }, { action: b.action });
    }, { timeout: 15000 });
  } catch (e) {
    if (e.status) return err(e.message, e.status);
    if (e.code === "P2002") return err("signature_already_used", 409);
    console.error("admin_withdrawal_failed", e.message);
    return err("internal_error", 500);
  }
  return Response.json({ ok: true });
}
