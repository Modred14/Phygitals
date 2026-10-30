import { randomUUID } from "node:crypto";

// Balance is always derived from immutable ledger entries, never from an editable column.
export async function getAvailableCents(db, userId) {
  const acct = await db.ledgerAccount.findFirst({ where: { type: "USER_AVAILABLE", userId, currency: "USD" }, select: { id: true } });
  if (!acct) return 0;
  const r = await db.ledgerEntry.aggregate({ where: { accountId: acct.id }, _sum: { amountCents: true } });
  return Number(r._sum.amountCents ?? 0n);
}

// Double-entry invariant: signed amounts of one transaction must sum to exactly zero.
export function assertBalanced(lines) {
  if (!Array.isArray(lines) || lines.length < 2) throw new Error("ledger: need at least two lines");
  let sum = 0n;
  for (const l of lines) {
    if (typeof l.amountCents !== "bigint") throw new Error("ledger: amountCents must be bigint");
    sum += l.amountCents;
  }
  if (sum !== 0n) throw new Error("ledger: unbalanced transaction");
}

// Must be called inside a prisma $transaction client.
export async function postTransaction(tx, { kind, refType, refId, lines }) {
  assertBalanced(lines);
  const transactionId = randomUUID();
  await tx.ledgerEntry.createMany({
    data: lines.map((l) => ({ transactionId, accountId: l.accountId, amountCents: l.amountCents, kind, refType, refId, idempotencyKey: l.idempotencyKey ?? null })),
  });
  return transactionId;
}

// Platform accounts are created by the seed/admin bootstrap; never lazily (avoids duplicate NULL-user rows).
export async function platformAccountId(tx, type) {
  const a = await tx.ledgerAccount.findFirst({ where: { type, userId: null, currency: "USD" }, select: { id: true } });
  if (!a) throw new Error(`platform_account_missing:${type}`);
  return a.id;
}
