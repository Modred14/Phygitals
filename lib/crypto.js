import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
const key = () => { const k = Buffer.from(process.env.ADMIN_ENCRYPTION_KEY ?? "", "base64"); if (k.length !== 32) throw new Error("ADMIN_ENCRYPTION_KEY must be 32 bytes (base64)"); return k; };
export function encrypt(text) {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}
export function decrypt(blob) {
  const [iv, tag, enc] = blob.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key(), iv); d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
