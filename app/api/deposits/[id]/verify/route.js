import { z } from "zod";
import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { postTransaction, platformAccountId, getAvailableCents } from "@/lib/ledger";
import { SIG_RE, fetchFinalizedTx, evaluateDeposit, atomicToCents, sendersOf } from "@/lib/solana";
import { flags } from "@/lib/flags";
import { loadReferralSettings } from "@/lib/settings";
import { qualifies } from "@/lib/referrals";
export const dynamic = "force-dynamic";
const Body = z.object({ signature: z.string().regex(SIG_RE) });
const err = (c, s, x = {}) => Response.json({ error: c, ...x }, { status: s });

export async function POST(req, { params }) {
  const uid = readSession(req);
  if (!uid) return err("unauthorized", 401);
  if (!rateLimit(`depv:${uid}`, 12)) return err("rate_limited", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("bad_request", 400);
  const { signature } = parsed.data;
  const db = getDb();
  const dep = await db.deposit.findFirst({ where: { id: params.id, userId: uid } });
  if (!dep) return err("not_found", 404);
  if (dep.status === "CREDITED") return Response.json({ status: "CREDITED", balanceCents: await getAvailableCents(db, uid) });

  let tx;
  try { tx = await fetchFinalizedTx(signature); } catch { return err("rpc_unavailable", 503); }
  if (!tx) return err("not_finalized_yet", 202); // not found or not yet finalized; safe to retry later

  const check = evaluateDeposit(tx, { treasury: process.env.SOLANA_DEPOSIT_TREASURY_ADDRESS, mint: process.env.SOLANA_USDC_MINT, reference: dep.reference });
  if (!check.ok) return err(check.reason, 422);
  const cents = atomicToCents(check.amountAtomic);
  if (cents <= 0n) return err("amount_too_small", 422);

  try {
    await db.$transaction(async (tx2) => {
      const [locked] = await tx2.$queryRaw`SELECT status FROM "Deposit" WHERE id = ${dep.id} FOR UPDATE`;
      if (locked.status !== "AWAITING_PAYMENT") throw Object.assign(new Error("already_processed"), { status: 409 });
      // Unique(signature) is the replay guard: the same chain tx can never be credited twice, to any deposit.
      await tx2.blockchainTransaction.create({ data: { network: "solana", signature, status: "FINALIZED", direction: "IN", slot: BigInt(tx.slot), rawSummary: { amountAtomic: check.amountAtomic.toString(), depositId: dep.id, senders: sendersOf(tx, process.env.SOLANA_USDC_MINT) } } });
      await tx2.deposit.update({ where: { id: dep.id }, data: { status: "CREDITED", chainTxId: signature, receivedAmountAtomic: check.amountAtomic, creditedCents: cents, creditedAt: new Date() } });
      const [acct] = await tx2.$queryRaw`SELECT id FROM "LedgerAccount" WHERE "userId" = ${uid} AND type = 'USER_AVAILABLE'::"LedgerAccountType"`;
      const ext = await platformAccountId(tx2, "EXTERNAL_CHAIN");
      await postTransaction(tx2, { kind: "DEPOSIT", refType: "Deposit", refId: dep.id, lines: [
        { accountId: ext, amountCents: -cents }, { accountId: acct.id, amountCents: cents, idempotencyKey: `deposit:${dep.id}` } ] });
      // Referral qualification: a VERIFIED, credited deposit is the qualifying action. Reward stays PENDING (not spendable) until the hold ends.
      if (flags().referralRewards) {
        const ref = await tx2.referral.findUnique({ where: { referredId: uid } });
        const rs = await loadReferralSettings(tx2);
        if (ref && ref.status === "PENDING" && qualifies(Number(cents), rs)) {
          await tx2.referral.update({ where: { id: ref.id }, data: { status: "ELIGIBLE", qualifyingEvent: `deposit:${dep.id}` } });
          await tx2.referralReward.create({ data: { referralId: ref.id, amountCents: BigInt(rs.rewardCents) } }); // unique(referralId): never paid twice
        }
      }
    });
  } catch (e) {
    if (e.status) return err(e.message, e.status);
    if (e.code === "P2002") return err("signature_already_used", 409);
    console.error("deposit_credit_failed", e.message);
    return err("internal_error", 500);
  }
  return Response.json({ status: "CREDITED", creditedCents: Number(cents), balanceCents: await getAvailableCents(db, uid) });
}
