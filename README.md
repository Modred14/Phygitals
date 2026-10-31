# Football Packs: Telegram Mini App

Next.js 14 (App Router, JavaScript) · Prisma + Neon Postgres · Telegram Mini Apps · Solana USDC deposits/withdrawals.

**Status: feature-complete for review, NOT cleared for real-money launch.** Read `docs/LAUNCH_CHECKLIST.md`.
Paid openings, withdrawals and referral payouts are OFF by default (`PAID_OPENINGS_ENABLED`, `WITHDRAWALS_ENABLED`, `REFERRAL_REWARDS_ENABLED`).

## What's inside
| Area | Where |
|---|---|
| Telegram app screens (Packs, Collection, Offers, Rewards, Profile, Wallet, Deposit, Withdraw) | `app/(tg)/**` |
| Admin dashboard (password + authenticator 2FA, roles) | `app/admin`, `app/api/admin/**` |
| Reward engine (CSPRNG, exact-100% odds validation) | `lib/reward-engine.js`, `lib/odds.js` |
| Double-entry ledger helpers | `lib/ledger.js` |
| Telegram `initData` verification | `lib/telegram.js` |
| Solana verification (deposits/payouts) | `lib/solana.js` |
| DB-level protections (balanced ledger, immutable rows, frozen odds) | `prisma/sql/ledger_protections.sql` |
| Schema / seed | `prisma/schema.prisma`, `prisma/seed.js` |
| Design reference screenshots | `design-reference/` |

## Local development
```bash
node -v                      # must be >= 22
npm install
cp .env.example .env         # fill in values (see docs/DEPLOYMENT.md)
npx prisma validate
npx prisma migrate dev --name init
# then apply DB protections as a second migration (docs/DEPLOYMENT.md, "Migrations")
npm run db:seed              # DRAFT test packs + platform ledger accounts. No balances, no fake deposits.
npm run create-admin -- you@example.com 'a-long-password' SUPER_ADMIN
npm run dev
npm test && npm run lint && npm run build
```
Opened in a normal browser the Telegram app shows a sign-in screen and **never fakes authentication**. To exercise it, open it from your bot inside Telegram (use an HTTPS tunnel such as `cloudflared` or `ngrok` for local testing and point the Mini App URL at it).
The admin dashboard is at `/admin` and works in any browser.

## Branding
Set `NEXT_PUBLIC_APP_NAME`. The screenshots in `design-reference/` belong to a third-party product; the layout was followed, but its name, logo and artwork were deliberately **not** copied. Replace `components/PackArt.js` with your own licensed artwork.

## Tests
`npm test` runs 22 tests: odds validation and CSPRNG draws, Telegram signature checks, Solana deposit evaluation, withdrawal quotes, TOTP (RFC 6238 vector), password hashing, and the SQL protections on a real Postgres engine (PGlite).

## Prisma version (important)
This project is pinned to **Prisma 5.22.0**. Always run `npm install` first and use the local binary (`npx prisma -v` must print 5.22.x). If `npx` prints Prisma 6/7 it is downloading a newer CLI because `node_modules` is missing; Prisma 7 rejects this schema's `url = env(...)` datasource format. `npm test` validates the schema with Prisma's own validator.
