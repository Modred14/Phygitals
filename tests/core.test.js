import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { validateConfig, drawReward, PPM_TOTAL } from "../lib/reward-engine.js";
import { verifyInitData } from "../lib/telegram.js";

const tiers = [
  { id: "a", label: "low", minCents: 100, maxCents: 500, probabilityPpm: 700_000 },
  { id: "b", label: "mid", minCents: 600, maxCents: 2000, probabilityPpm: 299_000 },
  { id: "c", label: "top", minCents: 50000, maxCents: 50000, probabilityPpm: 1_000 },
];

test("probabilities must total exactly 100%", () => {
  assert.equal(validateConfig({ priceCents: 1000, tiers }).ok, true);
  assert.equal(validateConfig({ priceCents: 1000, tiers: [{ ...tiers[0], probabilityPpm: 5 }] }).ok, false);
});

test("flags EV above price", () => {
  assert.equal(validateConfig({ priceCents: 100, tiers }).evExceedsPrice, true);
});

test("draw returns a configured tier within range", () => {
  for (let i = 0; i < 2000; i++) {
    const d = drawReward(tiers);
    const t = tiers.find((x) => x.id === d.tierId);
    assert.ok(d.amountCents >= t.minCents && d.amountCents <= t.maxCents);
    assert.ok(d.roll >= 0 && d.roll < PPM_TOTAL);
  }
});

function sign(fields, token) {
  const dcs = Object.entries(fields).map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  return new URLSearchParams({ ...fields, hash: createHmac("sha256", secret).update(dcs).digest("hex") }).toString();
}

test("initData verification accepts valid, rejects tampered/wrong-token/expired", () => {
  const now = Date.now();
  const fields = { auth_date: String(Math.floor(now / 1000)), user: JSON.stringify({ id: 42, first_name: "A" }) };
  const good = sign(fields, "tok");
  assert.equal(verifyInitData(good, "tok", 3600, now).user.id, 42);
  assert.throws(() => verifyInitData(good.replace("42", "43"), "tok", 3600, now));
  assert.throws(() => verifyInitData(good, "other", 3600, now));
  assert.throws(() => verifyInitData(good, "tok", 3600, now + 7200_000));
});

import { SEED_PACKS } from "../prisma/seed-data.js";
import { fmt, fmtCompact, pct } from "../lib/format.js";
test("seed test configs are valid and below price on average", () => {
  for (const p of SEED_PACKS) {
    const r = validateConfig(p);
    assert.equal(r.ok, true, `${p.slug}: ${r.errors}`);
    assert.equal(r.evExceedsPrice, false, p.slug);
  }
});
test("format helpers use integer math", () => {
  assert.equal(fmt(10), "$0.10"); assert.equal(fmt(123456), "$1,234.56"); assert.equal(fmtCompact(2330000), "$23.3K"); assert.equal(pct(25000), "2.5%");
});

import { assertBalanced } from "../lib/ledger.js";
test("ledger rejects unbalanced or single-line transactions", () => {
  assert.doesNotThrow(() => assertBalanced([{ amountCents: -1000n }, { amountCents: 1000n }]));
  assert.throws(() => assertBalanced([{ amountCents: -1000n }, { amountCents: 999n }]));
  assert.throws(() => assertBalanced([{ amountCents: 0n }]));
  assert.throws(() => assertBalanced([{ amountCents: -1 }, { amountCents: 1 }]));
});
test("draw frequencies roughly match configured odds", () => {
  const N = 40000, c = { a: 0, b: 0, c: 0 };
  for (let i = 0; i < N; i++) c[drawReward(tiers).tierId]++;
  assert.ok(Math.abs(c.a / N - 0.7) < 0.02 && Math.abs(c.b / N - 0.299) < 0.02);
});

import { evaluateDeposit, tokenDeltaAtomic, isValidSolanaAddress, atomicToCents } from "../lib/solana.js";
import { quote } from "../lib/withdrawals.js";
import { parseDollarsToCents } from "../lib/format.js";
const T = "Gv9xGpTreasury1111111111111111111111111111", M = "EPjFWdd5AuqkWA2oBfGC1UFJyvKkoWB6QYkvK3kD8Gde";
const mkTx = ({ err = null, memo = "ref123", pre = "0", post = "5000000", owner = T } = {}) => ({
  slot: 1, meta: { err, preTokenBalances: [{ accountIndex: 3, owner, mint: M, uiTokenAmount: { amount: pre } }], postTokenBalances: [{ accountIndex: 3, owner, mint: M, uiTokenAmount: { amount: post } }] },
  transaction: { message: { instructions: [{ programId: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", parsed: memo }] } },
});
const ctx = { treasury: T, mint: M, reference: "ref123" };
test("deposit evaluation: valid, wrong memo, failed tx, wrong recipient, no transfer", () => {
  const ok = evaluateDeposit(mkTx(), ctx);
  assert.equal(ok.ok, true); assert.equal(atomicToCents(ok.amountAtomic), 500n);
  assert.equal(evaluateDeposit(mkTx({ memo: "other" }), ctx).reason, "reference_mismatch");
  assert.equal(evaluateDeposit(mkTx({ err: {} }), ctx).reason, "tx_failed");
  assert.equal(evaluateDeposit(mkTx({ owner: "someoneElse" }), ctx).reason, "no_transfer_to_treasury");
  assert.equal(evaluateDeposit(mkTx({ pre: "5000000", post: "5000000" }), ctx).reason, "no_transfer_to_treasury");
  assert.equal(evaluateDeposit(null, ctx).reason, "not_found");
  assert.equal(tokenDeltaAtomic(mkTx({ pre: "1000000", post: "3500000" }), T, M), 2500000n);
});
test("solana address validation", () => {
  assert.equal(isValidSolanaAddress(M), true);
  assert.equal(isValidSolanaAddress("not-an-address"), false);
  assert.equal(isValidSolanaAddress(""), false);
});
test("withdrawal quote separates platform fee and enforces limits", () => {
  const q = quote(2000, { feeCents: 300, minCents: 1000, maxCents: 1000000 });
  assert.equal(q.ok, true); assert.equal(q.platformFeeCents, 300); assert.equal(q.receiveCents, 1700);
  assert.equal(quote(500, { feeCents: 300, minCents: 1000, maxCents: 1000000 }).ok, false);
  assert.equal(quote(10.5, { feeCents: 300, minCents: 1, maxCents: 1000000 }).ok, false);
});
test("dollar parsing is strict and integer-only", () => {
  assert.equal(parseDollarsToCents("12.5"), 1250); assert.equal(parseDollarsToCents("0.07"), 7); assert.equal(parseDollarsToCents("3"), 300);
  for (const bad of ["", "-1", "1.234", "1e3", "abc", "1,000"]) assert.equal(parseDollarsToCents(bad), null);
});

import { hotp, verifyTotp, base32encode } from "../lib/totp.js";
import { hashPassword, verifyPassword, hasRole } from "../lib/admin-auth.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { parsePercentToPpm } from "../lib/format.js";
test("TOTP matches RFC 6238 vector and rejects wrong codes", () => {
  const secret = base32encode(Buffer.from("12345678901234567890"));
  assert.equal(hotp(secret, 1, 8), "94287082"); // t=59s
  assert.equal(verifyTotp(secret, "287082", 59_000), true);
  assert.equal(verifyTotp(secret, "000000", 59_000), false);
  assert.equal(verifyTotp(secret, "287082", 59_000 + 300_000), false);
});
test("password hashing and 2FA-secret encryption round-trip", () => {
  const h = hashPassword("correct horse battery"); assert.equal(verifyPassword("correct horse battery", h), true); assert.equal(verifyPassword("nope", h), false);
  process.env.ADMIN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  const e = encrypt("JBSWY3DPEHPK3PXP"); assert.equal(decrypt(e), "JBSWY3DPEHPK3PXP"); assert.throws(() => decrypt(e.slice(0, -2) + "xx"));
});
test("role hierarchy and percent parsing", () => {
  assert.equal(hasRole("FINANCE", "SUPPORT"), true); assert.equal(hasRole("SUPPORT", "FINANCE"), false); assert.equal(hasRole("SUPER_ADMIN", "FINANCE"), true);
  assert.equal(parsePercentToPpm("60"), 600000); assert.equal(parsePercentToPpm("2.5"), 25000); assert.equal(parsePercentToPpm("0.0001"), 1); assert.equal(parsePercentToPpm("100"), 1000000);
  for (const bad of ["101", "-1", "1.23456", "", "abc"]) assert.equal(parsePercentToPpm(bad), null);
});

import { matchTotpStep } from "../lib/totp.js";
import { sendersOf } from "../lib/solana.js";
import { qualifies, maskName } from "../lib/referrals.js";
test("TOTP step is returned so replay can be blocked", () => {
  const secret = base32encode(Buffer.from("12345678901234567890"));
  assert.equal(matchTotpStep(secret, "287082", 59_000), 1); // RFC vector, step 1
  assert.equal(matchTotpStep(secret, "287082", 59_000 + 30_000), 1); // still accepted in window, but same step => caller rejects (step <= last)
  assert.equal(matchTotpStep(secret, "111111", 59_000), null);
});
test("sender detection and referral qualification rules", () => {
  const tx = { meta: { preTokenBalances: [{ accountIndex: 1, owner: "payer", mint: M, uiTokenAmount: { amount: "9000000" } }, { accountIndex: 3, owner: T, mint: M, uiTokenAmount: { amount: "0" } }], postTokenBalances: [{ accountIndex: 1, owner: "payer", mint: M, uiTokenAmount: { amount: "4000000" } }, { accountIndex: 3, owner: T, mint: M, uiTokenAmount: { amount: "5000000" } }] } };
  assert.deepEqual(sendersOf(tx, M), ["payer"]);
  const rules = { rewardCents: 100, minDepositCents: 500, holdDays: 7 };
  assert.equal(qualifies(500, rules), true); assert.equal(qualifies(499, rules), false); assert.equal(qualifies(1000, { ...rules, rewardCents: 0 }), false);
  assert.equal(maskName("EmberChallenger"), "Em••••••"); assert.equal(maskName(null), "Player");
});

import { startPayload, welcomeMessage, secretOk } from "../lib/telegram-bot.js";
test("bot: /start parsing, welcome message with web_app button, webhook secret check", () => {
  assert.deepEqual(startPayload("/start"), { payload: null });
  assert.deepEqual(startPayload("/start@MyBot abc123"), { payload: "abc123" });
  assert.equal(startPayload("hello"), null); assert.equal(startPayload("/startx"), null);
  const m = welcomeMessage(5, { payload: "abc123", appName: "Brand", url: "https://x.app" });
  assert.equal(m.chat_id, 5); assert.match(m.text, /Welcome to Brand/);
  assert.equal(m.reply_markup.inline_keyboard[0][0].text, "Open App");
  assert.equal(m.reply_markup.inline_keyboard[0][0].web_app.url, "https://x.app/?ref=abc123");
  assert.equal(welcomeMessage(5, { payload: "bad code!", appName: "B", url: "https://x.app" }).reply_markup.inline_keyboard[0][0].web_app.url, "https://x.app");
  assert.equal(secretOk("a".repeat(20), "a".repeat(20)), true); assert.equal(secretOk("a".repeat(20), "b".repeat(20)), false); assert.equal(secretOk("", ""), false); assert.equal(secretOk("short", "short"), false);
});
