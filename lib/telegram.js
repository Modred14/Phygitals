import { createHmac, timingSafeEqual } from "node:crypto";

// Verifies Telegram Mini App initData per official docs. Returns the parsed user or throws.
export function verifyInitData(initData, botToken, maxAgeSeconds = 3600, now = Date.now()) {
  if (!initData || !botToken) throw new Error("missing initData or bot token");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("missing hash");
  params.delete("hash");
  const dataCheckString = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secret).update(dataCheckString).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new Error("invalid signature");
  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || now / 1000 - authDate > maxAgeSeconds) throw new Error("initData expired");
  const user = JSON.parse(params.get("user") ?? "null");
  if (!user?.id) throw new Error("missing user");
  return { user, startParam: params.get("start_param") ?? null, authDate };
}
