# Deployment guide (Vercel + Neon + Telegram + Solana)

## 1. Neon (PostgreSQL)
1. Create a project and database. Region close to your Vercel region.
2. Copy two connection strings: **pooled** (host contains `-pooler`) → `DATABASE_URL`; **direct** → `DIRECT_URL` (used by migrations).
3. Turn on point-in-time recovery / longest available history retention. Create a **separate branch** for staging and test everything there first.

## 2. Migrations
Prisma was not runnable in the authoring sandbox, so **no generated init migration is included**. Generate it yourself:
```bash
npx prisma validate
npx prisma migrate dev --name init          # local/staging DB, creates prisma/migrations/<ts>_init
npx prisma migrate dev --create-only --name ledger_protections
# paste the contents of prisma/sql/ledger_protections.sql into the new migration.sql, then:
npx prisma migrate dev
```
Commit `prisma/migrations/`. In production only ever run `npx prisma migrate deploy` (also `npm run db:deploy`).
`ledger_protections.sql` was tested on Postgres (PGlite) against stub tables; re-run `npm test` after any schema rename, and confirm it applies cleanly to the real generated schema.
Then seed once: `npm run db:seed` (creates DRAFT test packs and the platform ledger accounts that live purchases need: treasury, reward pool, fees, external-chain).

## 3. Secrets (generate fresh values for production)
| Variable | Notes |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Neon strings |
| `TELEGRAM_BOT_TOKEN` | from BotFather. Server only; never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | without `@` |
| `NEXT_PUBLIC_APP_NAME` | your brand |
| `TELEGRAM_INITDATA_MAX_AGE_SECONDS` | default 3600 |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `ADMIN_ENCRYPTION_KEY` | `openssl rand -base64 32` (exactly 32 bytes). **Losing it locks every admin out of 2FA.** Store it in a password manager. |
| `SOLANA_CLUSTER`, `SOLANA_RPC_URL` | use a **paid/dedicated RPC** (Helius, QuickNode, Triton). The public RPC is rate-limited. |
| `SOLANA_DEPOSIT_TREASURY_ADDRESS` | public address only, preferably a multisig |
| `SOLANA_USDC_MINT` | mainnet USDC is `EPjFWdd5AuqkWA2oBfGC1UFJyvKkoWB6QYkvK3kD8Gde`; use the right mint on devnet |
| `PAID_OPENINGS_ENABLED`, `WITHDRAWALS_ENABLED`, `REFERRAL_REWARDS_ENABLED` | keep `false` until the launch checklist is signed off |
| `WITHDRAWAL_FEE_CENTS/MIN/MAX` | defaults; the admin Settings tab overrides them from the database |

**Never** put a payout private key, seed phrase or keypair in any environment variable of this app. Payouts are sent from your own wallet/signing service; the app only verifies them on-chain.

## 4. Vercel
1. Import the repo; framework preset Next.js; Node 22.
2. Add the variables above to Production (and Preview with *staging* values only).
3. Build command is already `prisma generate && next build`. Run `npm run db:deploy` from CI or locally against `DIRECT_URL` **before** promoting a deployment that changes the schema.
4. Attach your custom domain (HTTPS is automatic). Confirm `https://YOUR_DOMAIN/api/health` returns `{"ok":true}`.
5. Add a monitor (UptimeRobot/BetterStack) on `/api/health`.

## 5. Telegram bot + Mini App (BotFather)
1. `/newbot` → name and username → copy the token into `TELEGRAM_BOT_TOKEN`.
2. `/mybots` → your bot → **Bot Settings → Configure Mini App** (or Menu Button) → set the URL to `https://YOUR_DOMAIN/`. This is what makes referral links of the form
   `https://t.me/YOUR_BOT_USERNAME?startapp=REFERRAL_CODE` open the app; the code arrives as `start_param` inside signed `initData` and is validated server-side.
3. Optional: `/newapp` to create a named Direct Link Mini App (`https://t.me/BOT/short_name?startapp=CODE`). If you use this form instead, update the link built in `app/(tg)/(tabs)/rewards/page.js`.
4. Test in Telegram on Android, iOS, Desktop and Web. Verify: sign-in works, Back button works, safe-area padding on notched phones, haptics, referral link opens the app and records the referral.

### 5b. Welcome message + "Open App" button (bot webhook)
Pressing **Start** only works once the bot is connected to this app:
1. Deploy to Vercel first (Telegram cannot reach `localhost`). Set `NEXT_PUBLIC_APP_URL` (your public `https://` URL, no trailing slash), `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` (`openssl rand -hex 24`) in Vercel, then **redeploy** (NEXT_PUBLIC values are baked in at build time).
2. Put the same three values in your local `.env`, then run `npm run set-webhook`. It registers `/api/telegram/webhook`, the `/start` command and the menu button.
3. Open the bot and send `/start`: you should get the welcome message with an **Open App** button. If not, re-run the script and read its "last error", and check Vercel function logs.
Referral links `https://t.me/BOT?start=CODE` also work: the code is passed to the app as `?ref=CODE`.

## 6. First admin
```bash
DATABASE_URL=... DIRECT_URL=... ADMIN_ENCRYPTION_KEY=... SESSION_SECRET=... \
  node scripts/create-admin.js you@example.com 'a-very-long-password' SUPER_ADMIN
```
Add the printed `otpauth://` link to an authenticator app immediately (shown once). Sign in at `/admin`.

## 7. Deposits & withdrawals on Solana
- **Deposits:** user sends USDC to the treasury with the per-deposit reference as the transaction **memo**, then pastes the signature in the app. The server fetches the **finalized** transaction and checks: success, USDC received by the treasury, memo equals the reference, signature never used before. Test on devnet first (devnet USDC mint + `SOLANA_CLUSTER=devnet`).
- **Withdrawals:** user request reserves funds in the ledger. A FINANCE admin approves, sends the USDC from your wallet/signing service, then pastes the signature in Admin → Withdrawals → *Complete*. The server verifies the destination received at least (amount − fee) before marking it completed. *Fail & refund* releases the reserve.
- Keep the payout wallet funded with SOL for network fees. The platform fee is yours and is labelled as such in the UI; never describe it as a blockchain fee.

## 8. Backups & recovery
- Neon PITR is your primary safety net. Rehearse a restore to a new branch **before** launch and record the steps and time taken.
- Take a scheduled logical dump (`pg_dump`) of `LedgerEntry`, `LedgerAccount`, `Deposit`, `Withdrawal`, `PackOpening`, `AuditLog` to storage outside Neon (encrypted).
- Reconcile weekly: ledger treasury/pool balances vs real wallet balances; Admin → Overview shows any unbalanced transactions (must be 0).
- Rotate `SESSION_SECRET` (invalidates all sessions) if compromise is suspected. Do **not** rotate `ADMIN_ENCRYPTION_KEY` without re-enrolling every admin's 2FA.

## 9. Known limitations to plan around
- Rate limiting is in-memory per instance; add a shared store (Upstash Redis) before real traffic.
- No background deposit scanner; users paste signatures.
- Payouts are manual (no automatic signing service).
- Referrals use a DEFAULT rule that I chose, not one you specified: a referred user's first **verified deposit ≥ minimum** qualifies the referral, the reward then stays PENDING for a hold period, and a FINANCE admin runs *Admin → Referrals → Confirm due rewards* to pay it (revoked if the referrer is banned or both accounts share a wallet). Change amount/minimum/hold in Admin → Settings, or change the rule in `lib/referrals.js`. Payouts require `REFERRAL_REWARDS_ENABLED=true`. Seed/admin must create the `PLATFORM_MARKETING` ledger account (the seed does).
- Because the Prisma schema gained fields (`Admin.lastTotpStep`, `ReferralReward.reason`, enum `PLATFORM_MARKETING`) after earlier zips, always generate migrations from the **current** schema.
