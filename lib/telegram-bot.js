import { timingSafeEqual } from "node:crypto";

export const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");

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
