// Registers the bot webhook, the /start command and the menu button. Run AFTER the app is deployed on a public https URL:
//   npm run set-webhook
try { process.loadEnvFile(); } catch {}
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_APP_NAME } = process.env;
const base = (NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
(async () => {
  const problems = [];
  if (!token) problems.push("TELEGRAM_BOT_TOKEN is missing or empty (copy it from BotFather)");
  else if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) problems.push("TELEGRAM_BOT_TOKEN doesn't look right (expected something like 123456789:AAH... with no spaces or quotes inside)");
  if (!secret) problems.push("TELEGRAM_WEBHOOK_SECRET is missing or empty (add a line TELEGRAM_WEBHOOK_SECRET=... to .env)");
  else if (secret.length < 16 || !/^[A-Za-z0-9_-]+$/.test(secret)) problems.push("TELEGRAM_WEBHOOK_SECRET must be 16+ characters using only letters, digits, _ and - (no + or spaces). Generate one: node -e \"console.log(require('crypto').randomBytes(24).toString('hex'))\"");
  if (problems.length) throw new Error("Check your .env file (in the project root, named exactly .env):\n - " + problems.join("\n - "));
  if (!base.startsWith("https://")) throw new Error("NEXT_PUBLIC_APP_URL must be your public https URL, e.g. https://your-app.vercel.app (localhost will not work)");
  const call = async (m, b) => { const r = await (await fetch(`https://api.telegram.org/bot${token}/${m}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b ?? {}) })).json(); if (!r.ok) throw new Error(`${m}: ${r.description}`); return r.result; };
  await call("setWebhook", { url: `${base}/api/telegram/webhook`, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
  await call("setMyCommands", { commands: [{ command: "start", description: "Open the app" }] });
  await call("setChatMenuButton", { menu_button: { type: "web_app", text: "Open App", web_app: { url: base } } });
  const info = await call("getWebhookInfo");
  console.log("Webhook set:", info.url, "| pending updates:", info.pending_update_count, "| last error:", info.last_error_message ?? "none");
  console.log(`Now open your bot in Telegram and send /start (app name shown: ${NEXT_PUBLIC_APP_NAME ?? "Football Packs"}).`);
})().catch((e) => { console.error("Failed:", e.message); process.exit(1); });
