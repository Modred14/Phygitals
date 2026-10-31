import { timingSafeEqual } from "node:crypto";

const goodUrl = (u) => /^https:\/\/[^/\s]+$/.test(u) && !u.includes("your-app.vercel.app");
// Public https URL of the app. Prefers env (NEXT_PUBLIC_APP_URL, then APP_URL); if neither is usable, falls back to the
// domain this very request arrived on (Telegram only calls the webhook over https at the address we registered, and the
// request is already authenticated by the secret token), so a missing env var can't silently break the welcome button.
export function resolveAppUrl(env = process.env, headers = null) {
  for (const v of [env.NEXT_PUBLIC_APP_URL, env.APP_URL]) { const u = (v ?? "").trim().replace(/\/+$/, ""); if (goodUrl(u)) return u; }
  const host = headers?.get?.("x-forwarded-host") ?? headers?.get?.("host");
  const u = host && /^[A-Za-z0-9.-]+(:\d+)?$/.test(host) ? `https://${host}` : "";
  return goodUrl(u) ? u : "";
}
export const appUrl = (req) => resolveAppUrl(process.env, req?.headers);

// "/start", "/start@MyBot", "/start CODE" -> { payload }. Anything else -> null.
export function startPayload(text) {
  const m = /^\/start(?:@\w+)?(?:\s+(\S{1,64}))?\s*$/.exec(text ?? "");
  return m ? { payload: m[1] ?? null } : null;
}

// Builds the sendMessage body: a welcome text and one inline button that opens the Mini App.
export function welcomeMessage(chatId, { payload, appName, url }) {
  const ref = payload && /^[A-Za-z0-9_-]{1,64}$/.test(payload) ? payload : null;
  const webUrl = ref ? `${url}/?ref=${encodeURIComponent(ref)}` : url;
  return {
    chat_id: chatId,
    text: `Welcome to ${appName}! 🏆\n\nOpen football player packs, build your collection and invite friends.\n\nTap the button below to open the app. You must be 18+ to continue.`,
    reply_markup: { inline_keyboard: [[{ text: "Open App", web_app: { url: webUrl } }]] },
  };
}

// Constant-time check of Telegram's X-Telegram-Bot-Api-Secret-Token header.
export function secretOk(given, want) {
  const a = Buffer.from(given ?? ""), b = Buffer.from(want ?? "");
  return b.length >= 16 && a.length === b.length && timingSafeEqual(a, b);
}

export async function tgCall(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(`telegram_${method}_failed:${data.description ?? res.status}`);
  return data.result;
}