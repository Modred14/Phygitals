// Diagnoses why /start shows no welcome message. Prints no secrets.   Usage: npm run check-bot
try { process.loadEnvFile(); } catch {}
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, NEXT_PUBLIC_APP_URL } = process.env;
const base = (NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
const ok = (m) => console.log("  OK   " + m), bad = (m) => console.log("  FAIL " + m), hint = (m) => console.log("       -> " + m);
(async () => {
  console.log("1) Local .env");
  token ? ok("TELEGRAM_BOT_TOKEN is set") : bad("TELEGRAM_BOT_TOKEN missing");
  secret && secret.length >= 16 && /^[A-Za-z0-9_-]+$/.test(secret) ? ok("TELEGRAM_WEBHOOK_SECRET looks valid") : bad("TELEGRAM_WEBHOOK_SECRET missing/invalid (16+ chars, letters digits _ -)");
  /^https:\/\/[^/]+$/.test(base) && !/your-app\.vercel\.app/.test(base) ? ok(`NEXT_PUBLIC_APP_URL = ${base}`) : (bad(`NEXT_PUBLIC_APP_URL is "${base || "empty"}" (must be your real https URL, no trailing slash, not the placeholder)`));
  if (!token) return;
  const call = async (m) => (await fetch(`https://api.telegram.org/bot${token}/${m}`)).json();

  console.log("\n2) Telegram bot token");
  const me = await call("getMe");
  if (!me.ok) { bad("Telegram rejected the token: " + me.description); hint("Get the current token from BotFather (/mybots -> your bot -> API Token). If you revoked it, update .env AND Vercel."); return; }
  ok(`Token valid for @${me.result.username}`);
  if (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME && process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME.toLowerCase() !== me.result.username.toLowerCase()) bad(`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is "${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}" but the token belongs to @${me.result.username}`);

  console.log("\n3) Webhook registered with Telegram");
  const wi = (await call("getWebhookInfo")).result ?? {};
  const want = `${base}/api/telegram/webhook`;
  if (!wi.url) { bad("No webhook is set."); hint("Run: npm run set-webhook (after fixing the FAIL lines above)."); }
  else if (wi.url !== want) { bad(`Webhook points to ${wi.url} but your NEXT_PUBLIC_APP_URL expects ${want}`); hint("Run: npm run set-webhook"); }
  else ok("Webhook URL matches: " + wi.url);
  console.log(`       pending updates: ${wi.pending_update_count ?? 0}`);
  if (wi.last_error_message) {
    bad(`Telegram's last delivery error: "${wi.last_error_message}" (${wi.last_error_date ? new Date(wi.last_error_date * 1000).toISOString() : "?"})`);
    const e = wi.last_error_message;
    if (/401/.test(e)) hint("401: the app rejected the request. TELEGRAM_WEBHOOK_SECRET on Vercel differs from the one used in set-webhook (or is missing), OR Vercel Deployment Protection is blocking it. Fix Vercel env, REDEPLOY, then run npm run set-webhook again.");
    else if (/404/.test(e)) hint("404: that URL has no webhook route. The domain is wrong or the latest code isn't deployed.");
    else if (/resolve|DNS|Connection|timed out|SSL|certificate/i.test(e)) hint("Telegram can't reach the host. Check the domain spelling and that the deployment is live over https.");
    else if (/500|502|503/.test(e)) hint("The app crashed on delivery. Check Vercel > Logs for errors.");
  } else if (wi.url) ok("No delivery errors reported by Telegram");

  console.log("\n4) Your deployed site");
  if (!/^https:\/\//.test(base)) return bad("skipped (NEXT_PUBLIC_APP_URL not valid)");
  try {
    const r = await fetch(`${base}/api/telegram/webhook`), t = await r.text();
    if (r.status === 200 && t.includes('"configured"')) {
      const c = JSON.parse(t).configured;
      ok("Deployed app reachable");
      c.token ? ok("Vercel has TELEGRAM_BOT_TOKEN") : bad("Vercel is MISSING TELEGRAM_BOT_TOKEN");
      c.secret ? ok("Vercel has a valid TELEGRAM_WEBHOOK_SECRET") : bad("Vercel is MISSING/INVALID TELEGRAM_WEBHOOK_SECRET");
      c.appUrlHttps ? ok("Vercel NEXT_PUBLIC_APP_URL is a valid https URL") : (c.effectiveUrlOk ? console.log("  WARN Vercel NEXT_PUBLIC_APP_URL is missing; the bot is using this site's own address instead (works, but add the variable too)") : bad("Vercel has no usable app URL: the welcome button cannot be built"));
      if (!c.token || !c.secret || !c.effectiveUrlOk) hint("Add the missing variables in Vercel > Settings > Environment Variables (Production), then REDEPLOY.");
      if (c.effectiveUrlOk === undefined) hint("The deployed code is older than this check. Push the latest code so the fix is live.");
    } else { bad(`Deployed site answered HTTP ${r.status} without the diagnostics response`); hint(r.status === 401 || /vercel/i.test(t) && /authenticat/i.test(t) ? "Vercel Deployment Protection is on for this URL. Use the production domain or disable protection." : "The latest code may not be deployed to this URL."); }
  } catch (e) { bad("Could not reach " + base + " (" + e.message + ")"); hint("Is the site deployed and is the URL spelled correctly?"); }
})().catch((e) => { console.error("check failed:", e.message); process.exit(1); });