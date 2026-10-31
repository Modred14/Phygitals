import { rateLimit } from "@/lib/rate-limit";
import { appUrl, secretOk, startPayload, tgCall, welcomeMessage } from "@/lib/telegram-bot";
export const dynamic = "force-dynamic";

// Diagnostics for `npm run check-bot`: reports only whether settings exist, never their values.
export async function GET(req) {
  const url = appUrl(req);
  return Response.json({ ok: true, configured: { token: Boolean(process.env.TELEGRAM_BOT_TOKEN), secret: /^[A-Za-z0-9_-]{16,}$/.test(process.env.TELEGRAM_WEBHOOK_SECRET ?? ""), appUrlHttps: /^https:\/\/[^/]+$/.test((process.env.NEXT_PUBLIC_APP_URL ?? "").trim()) && !(process.env.NEXT_PUBLIC_APP_URL ?? "").includes("your-app.vercel.app"), effectiveUrlOk: url.startsWith("https://") } });
}

// Telegram calls this for every message sent to the bot. Only requests carrying our secret token are accepted.
export async function POST(req) {
  if (!secretOk(req.headers.get("x-telegram-bot-api-secret-token"), process.env.TELEGRAM_WEBHOOK_SECRET)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const cmd = msg?.chat?.type === "private" ? startPayload(msg.text) : null;
  if (cmd && rateLimit(`bot:${msg.chat.id}`, 10)) {
    const url = appUrl(req);
    if (!url.startsWith("https://")) console.error("welcome_skipped: no usable https app URL (set NEXT_PUBLIC_APP_URL)");
    else {
      try { await tgCall("sendMessage", welcomeMessage(msg.chat.id, { payload: cmd.payload, appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs", url })); }
      catch (e) { console.error("welcome_failed", e.message); }
    }
  }
  return Response.json({ ok: true }); // always 200 once authenticated so Telegram doesn't retry
}