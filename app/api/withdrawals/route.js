import { z } from "zod";
import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { flags } from "@/lib/flags";
import { postTransaction, getAvailableCents } from "@/lib/ledger";
import { isValidSolanaAddress, explorerUrl } from "@/lib/solana";
import { quote } from "@/lib/withdrawals";
import { loadWithdrawalSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";
const Body = z.object({ destination: z.string(), amountCents: z.number().int().positive(), idempotencyKey: z.string().uuid() });
const err = (c, s, x = {}) => Response.json({ error: c, ...x }, { status: s });

export async function GET(req) {
  const uid = readSession(req);
  if (!uid) return err("unauthorized", 401);
  const rows = await getDb().withdrawal.findMany({ where: { userId: uid }, orderBy: { createdAt: "desc" }, take: 50 });
  return Response.json({ withdrawals: rows.map((w) => ({ id: w.id, status: w.status, destination: w.destination, amountCents: Number(w.amountCents), platformFeeCents: Number(w.platformFeeCents), failureReason: w.failureReason, signature: w.signature, explorerUrl: w.signature ? explorerUrl(w.signature) : null, createdAt: w.createdAt })) });
}

export async function POST(req) {
  const uid = readSession(req);
  if (!uid) return err("unauthorized", 401);
  if (!flags().withdrawals) return err("withdrawals_disabled", 403);
  if (!rateLimit(`wd:${uid}`, 5)) return err("rate_limited", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return err("bad_request", 400);
  const { destination, amountCents, idempotencyKey } = parsed.data;
  if (!isValidSolanaAddress(destination)) return err("invalid_address", 422);
  const db = getDb();
  const q = quote(amountCents, await loadWithdrawalSettings(db)); // fee is computed server-side; the client can never set it
  if (!q.ok) return err(q.error, 422);
  try {
    const w = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: uid }, select: { bannedAt: true } });
      if (!user || user.bannedAt) throw Object.assign(new Error("unauthorized"), { status: 401 });
      const [acct] = await tx.$queryRaw`SELECT id FROM "LedgerAccount" WHERE "userId" = ${uid} AND type = 'USER_AVAILABLE'::"LedgerAccountType" FOR UPDATE`;
      const prior = await tx.withdrawal.findUnique({ where: { userId_idempotencyKey: { userId: uid, idempotencyKey } } });
      if (prior) return prior;
      if ((await getAvailableCents(tx, uid)) < amountCents) throw Object.assign(new Error("insufficient_balance"), { status: 402 });
      let reserved = await tx.ledgerAccount.findFirst({ where: { type: "USER_WITHDRAWAL_RESERVED", userId: uid }, select: { id: true } });
      if (!reserved) reserved = await tx.ledgerAccount.create({ data: { type: "USER_WITHDRAWAL_RESERVED", userId: uid }, select: { id: true } });
      const created = await tx.withdrawal.create({ data: { userId: uid, destination, amountCents: BigInt(amountCents), platformFeeCents: BigInt(q.platformFeeCents), idempotencyKey } });
      const amt = BigInt(amountCents);
      await postTransaction(tx, { kind: "WITHDRAWAL_RESERVE", refType: "Withdrawal", refId: created.id, lines: [
        { accountId: acct.id, amountCents: -amt, idempotencyKey: `wd:${created.id}:reserve` }, { accountId: reserved.id, amountCents: amt } ] });
      return created;
    }, { timeout: 15000 });
    return Response.json({ id: w.id, status: w.status, amountCents: Number(w.amountCents), platformFeeCents: Number(w.platformFeeCents), receiveCents: q.receiveCents });
  } catch (e) {
    if (e.status) return err(e.message, e.status);
    if (e.code === "P2002") return err("duplicate_request", 409);
    console.error("withdraw_failed", e.message);
    return err("internal_error", 500);
  }
}
