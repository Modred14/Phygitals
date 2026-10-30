# Production launch checklist

Do not enable real-money features until **every** box in sections A–C is ticked and a named person has signed off.

## A. Legal & platform (blocking)
- [ ] Qualified legal advice obtained for each target jurisdiction on **paid chance-based rewards** (gambling / lottery / loot-box rules). A pack whose rewards can exceed its price and is bought with real money may be regulated as gambling, with licensing, age-verification and geo-blocking duties. Geo-block where unlicensed.
- [ ] Crypto custody / money-transmission / AML-KYC / sanctions obligations assessed for holding user balances and paying out in USDC.
- [ ] Telegram Mini App and Bot Platform terms reviewed for paid-chance mechanics and payments.
- [ ] 18+ gate and Terms of Service / Privacy Policy published and linked in the app (the sign-in screen currently only states 18+).
- [ ] No unauthorized use of real players' names, likenesses, club or competition marks. Artwork and any player cards are licensed or original.
- [ ] Third-party branding from the reference screenshots removed.

## B. Economics & odds
- [ ] Every pack's odds entered in Admin → Packs & odds, saved as a version, reviewed by a second person.
- [ ] Return-to-player and maximum single payout understood for each pack. Any config whose expected payout exceeds price was a deliberate, documented decision (the admin UI forces an explicit acknowledgement).
- [ ] Reward pool funded with real money covering the worst-case exposure you accept (Overview → liability). Pool balance in the ledger reconciled to the real wallet.
- [ ] Published odds shown to users before purchase (the "What's inside / Odds" sheet) and match the live version.
- [ ] Referral rules reviewed and approved (default implemented: verified first deposit ≥ minimum, hold period, wallet-overlap and banned-referrer checks; add per-referrer caps if desired). Check promotions/affiliate rules in your jurisdictions. Keep `REFERRAL_REWARDS_ENABLED=false` until approved.

## C. Security & operations
- [ ] Migrations generated, committed, applied; `ledger_protections.sql` applied and verified (try an unbalanced insert on staging; it must fail).
- [ ] All secrets freshly generated; none committed; Vercel env scoped correctly; no payout private key anywhere in the app.
- [ ] Admin accounts created with 2FA; least-privilege roles; no shared accounts.
- [ ] Dedicated Solana RPC; devnet end-to-end test of deposit → open pack → withdraw → admin complete → fail & refund.
- [ ] Shared-store rate limiting in place; consider WAF / Vercel firewall for `/api/*` and `/admin`.
- [ ] Independent security review / pen-test of auth, ledger, withdrawal and admin paths.
- [ ] Backup restore rehearsed; weekly reconciliation scheduled; on-call and incident runbook (pause packs, disable withdrawals by env flag, freeze user).
- [ ] Monitoring and alerts: `/api/health`, 5xx rate, unbalanced-ledger count > 0, pending withdrawals older than SLA.
- [ ] Load test of `POST /api/packs/:slug/open` and deposit verification; confirm no double-charge under concurrent identical requests.
- [ ] Customer support process, dispute handling and responsible-play tools (limits, self-exclusion) decided.

## D. Staged rollout
1. Staging on Neon branch + Solana devnet, test mode only.
2. Production with all three flags `false` (test mode) to verify Telegram/domain/auth.
3. Enable `PAID_OPENINGS_ENABLED` for a small allow-listed group with low pack prices and a small funded pool.
4. Enable `WITHDRAWALS_ENABLED` with low limits, manual approval of every payout, daily reconciliation.
5. Increase limits gradually. Keep the kill switches (env flags + Pause pack) tested.

## What is verified vs not (as delivered)
Verified in the authoring sandbox: unit tests (odds, CSPRNG draws, Telegram signature, Solana deposit evaluation, quotes, TOTP, hashing), SQL protections on PGlite, production build and lint.
**Not verified:** Prisma validate/migrate (engine download blocked), anything against a live Neon database, Solana RPC calls, running inside real Telegram clients, visual match to the screenshots on devices, load behavior.
