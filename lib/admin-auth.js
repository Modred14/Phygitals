import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./db.js";

export const ROLE_RANK = { SUPPORT: 1, FINANCE: 2, SUPER_ADMIN: 3 };
export const hasRole = (role, min) => (ROLE_RANK[role] ?? 0) >= ROLE_RANK[min];

export function hashPassword(pw) { const salt = randomBytes(16); return `scrypt$${salt.toString("base64url")}$${scryptSync(pw, salt, 64).toString("base64url")}`; }
export function verifyPassword(pw, stored) {
  try { const [, s, h] = stored.split("$"); const a = scryptSync(pw, Buffer.from(s, "base64url"), 64), b = Buffer.from(h, "base64url"); return a.length === b.length && timingSafeEqual(a, b); } catch { return false; }
}

const COOKIE = "admin_session";
const mac = (p) => { const k = process.env.SESSION_SECRET; if (!k || k.length < 24) throw new Error("SESSION_SECRET missing"); return createHmac("sha256", `admin:${k}`).update(p).digest("base64url"); };
export function adminCookie(adminId, ttl = 8 * 3600) {
  const p = Buffer.from(JSON.stringify({ aid: adminId, exp: Math.floor(Date.now() / 1000) + ttl })).toString("base64url");
  return `${COOKIE}=${p}.${mac(p)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ttl}`;
}
export const clearCookie = () => `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
function readCookie(req) {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`).exec(req.headers.get("cookie") ?? "");
  if (!m) return null;
  const [p, sig] = m[1].split("."); if (!p || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(mac(p)); if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const { aid, exp } = JSON.parse(Buffer.from(p, "base64url").toString());
  return exp > Date.now() / 1000 ? aid : null;
}

// Returns { admin } or { res } (an error Response). Mutating requests must carry the custom header (CSRF defence on top of SameSite=Strict).
export async function requireAdmin(req, minRole = "SUPPORT") {
  const deny = (c, s) => ({ res: Response.json({ error: c }, { status: s }) });
  if (req.method !== "GET" && req.headers.get("x-requested-with") !== "admin-ui") return deny("csrf", 403);
  const aid = readCookie(req); if (!aid) return deny("unauthorized", 401);
  const admin = await getDb().admin.findUnique({ where: { id: aid } });
  if (!admin || admin.disabledAt) return deny("unauthorized", 401);
  if (!hasRole(admin.role, minRole)) return deny("forbidden", 403);
  return { admin };
}
export const audit = (db, admin, req, action, entity, entityId, before, after) =>
  db.auditLog.create({ data: { adminId: admin.id, action, entity, entityId, before: before ?? undefined, after: after ?? undefined, ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null } });
export const ser = (v) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x)));
