import { createHmac, timingSafeEqual } from "node:crypto";
// Stateless bearer token (HMAC). Sent in Authorization header, so no cookies (Telegram iframes block them) and no CSRF surface.
const b64 = (b) => Buffer.from(b).toString("base64url");
function mac(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 24) throw new Error("SESSION_SECRET missing or too short");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
export function signSession(userId, ttlSeconds = 60 * 60 * 12) {
  const payload = b64(JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${payload}.${mac(payload)}`;
}
export function readSession(request) {
  const h = request.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(mac(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
  return exp > Date.now() / 1000 ? uid : null;
}
