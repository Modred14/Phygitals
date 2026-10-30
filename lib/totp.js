import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const base32encode = (buf) => { let bits = "", out = ""; for (const b of buf) bits += b.toString(2).padStart(8, "0"); for (let i = 0; i < bits.length; i += 5) out += A[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)]; return out; };
export const base32decode = (s) => { let bits = ""; for (const ch of s.replace(/=+$/, "").toUpperCase()) bits += A.indexOf(ch).toString(2).padStart(5, "0"); const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); };
export const newSecret = () => base32encode(randomBytes(20));
export function hotp(secretB32, counter, digits = 6) {
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32decode(secretB32)).update(buf).digest();
  const o = h[h.length - 1] & 15, n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digits).padStart(digits, "0");
}
// Returns the matching 30s step number or null. Callers must persist it and reject steps <= the last accepted one (replay).
export function matchTotpStep(secretB32, code, now = Date.now(), window = 1) {
  if (!/^\d{6}$/.test(code ?? "")) return null;
  const step = Math.floor(now / 30000); let hit = null;
  for (let i = -window; i <= window; i++) { const a = Buffer.from(hotp(secretB32, step + i)), b = Buffer.from(code); if (a.length === b.length && timingSafeEqual(a, b)) hit = step + i; }
  return hit;
}
export const verifyTotp = (secretB32, code, now, window) => matchTotpStep(secretB32, code, now, window) !== null;
export const otpauthUri = (email, secret) => `otpauth://totp/${encodeURIComponent(process.env.NEXT_PUBLIC_APP_NAME ?? "Admin")}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_NAME ?? "Admin")}`;
