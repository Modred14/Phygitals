# Security notes

## Implemented
- **Identity:** Telegram `initData` verified server-side (HMAC with bot token, constant-time compare, max age). Telegram IDs/profile from the client are never trusted. Session is an HMAC-signed bearer token in the `Authorization` header (no cookies in the Mini App, so no CSRF surface).
- **Money:** balances derive only from immutable double-entry ledger rows; DB triggers (see `prisma/sql/ledger_protections.sql`) enforce zero-sum transactions, no edits/deletes, and no negative user balances. All money is integer cents/atomic units (no floats). Per-user row lock on money operations; idempotency keys on pack opening and withdrawals; unique constraints on chain signatures (replay protection).
- **Rewards:** drawn only on the server with `crypto.randomInt`; odds are integer ppm that must total exactly 1,000,000; each opening stores config version, roll, tier and amount. Published configs are immutable (code and DB). No code path adjusts odds per user.
- **Chain verification:** deposits and payouts are credited/completed only after a **finalized** transaction is fetched and checked against expected mint, recipient, amount and memo.
- **Referrals:** reward created only inside the same DB transaction as a verified deposit credit; unique per referred user; held, then re-checked for banned referrer and wallet overlap before payout.
- **Admin:** scrypt password hashes, mandatory TOTP with encrypted-at-rest secrets, strict same-site HttpOnly cookie, custom CSRF header, role checks per route, confirmation phrases for publish/fund/settings, full audit log, login rate limit.
- **Input:** zod validation on every write endpoint; generic error messages; `x-powered-by` disabled.

## Known gaps (fix before real money)
1. In-memory rate limiter → use Redis/Upstash.
2. No account lockout beyond the rate limit; no admin password reset/rotation UI. (Authenticator-code replay is now blocked via `Admin.lastTotpStep`.)
3. Only basic security headers are set (nosniff, HSTS, referrer policy; admin is unframable and uncached). A full CSP is not configured; add one after testing it inside Telegram clients (must allow telegram.org script and Telegram framing).
4. Telegram `initData` replay within its max age is possible by design; keep the max age short.
5. Manual payout process = operational risk; use a multisig/managed signer with dual approval.
6. No automated reconciliation job or alerting yet.
7. No KYC/AML, geo-blocking or age verification beyond a notice.

## Reporting
Add your own security contact before launch.
