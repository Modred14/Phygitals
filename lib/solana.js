import { Connection, PublicKey } from "@solana/web3.js";

export const MEMO_PROGRAMS = new Set(["MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFHNo"]);
export const SIG_RE = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;
export const USDC_DECIMALS = 6;
export const ATOMIC_PER_CENT = 10_000n; // 1 USDC = 100 cents = 1_000_000 atomic

export function isValidSolanaAddress(s) {
  if (typeof s !== "string" || s.length < 32 || s.length > 44) return false;
  try { return new PublicKey(s).toBytes().length === 32; } catch { return false; }
}
export const centsToAtomic = (c) => BigInt(c) * ATOMIC_PER_CENT;
export const atomicToCents = (a) => a / ATOMIC_PER_CENT; // floors; sub-cent dust is not credited

export function getConnection() { return new Connection(process.env.SOLANA_RPC_URL, "finalized"); }
export async function fetchFinalizedTx(signature) {
  return getConnection().getParsedTransaction(signature, { commitment: "finalized", maxSupportedTransactionVersion: 0 });
}
export function explorerUrl(signature) {
  const c = process.env.SOLANA_CLUSTER;
  return `https://solscan.io/tx/${signature}${c && c !== "mainnet-beta" ? `?cluster=${c}` : ""}`;
}

// Net token delta (atomic units) received by `owner` for `mint`, from the tx's own balance metadata.
export function tokenDeltaAtomic(tx, owner, mint) {
  const pre = tx?.meta?.preTokenBalances ?? [], post = tx?.meta?.postTokenBalances ?? [];
  let delta = 0n;
  for (const p of post) {
    if (p.owner !== owner || p.mint !== mint) continue;
    const before = pre.find((x) => x.accountIndex === p.accountIndex);
    delta += BigInt(p.uiTokenAmount.amount) - BigInt(before?.uiTokenAmount?.amount ?? "0");
  }
  return delta;
}
// Wallet owners whose balance of `mint` decreased in this tx (the payer side). Used for referral wallet-overlap checks.
export function sendersOf(tx, mint) {
  const pre = tx?.meta?.preTokenBalances ?? [], post = tx?.meta?.postTokenBalances ?? [], out = new Set();
  for (const b of pre) {
    if (b.mint !== mint || !b.owner) continue;
    const after = post.find((x) => x.accountIndex === b.accountIndex);
    if (BigInt(b.uiTokenAmount.amount) > BigInt(after?.uiTokenAmount?.amount ?? "0")) out.add(b.owner);
  }
  return [...out];
}
export function memosOf(tx) {
  return (tx?.transaction?.message?.instructions ?? []).filter((i) => MEMO_PROGRAMS.has(i.programId?.toString?.() ?? i.programId) && typeof i.parsed === "string").map((i) => i.parsed);
}

// Pure check: did this finalized tx deliver USDC to the treasury carrying our reference?
export function evaluateDeposit(tx, { treasury, mint, reference }) {
  if (!tx || !tx.meta) return { ok: false, reason: "not_found" };
  if (tx.meta.err) return { ok: false, reason: "tx_failed" };
  const amountAtomic = tokenDeltaAtomic(tx, treasury, mint);
  if (amountAtomic <= 0n) return { ok: false, reason: "no_transfer_to_treasury" };
  if (!memosOf(tx).some((m) => m.trim() === reference)) return { ok: false, reason: "reference_mismatch" };
  return { ok: true, amountAtomic };
}
