"use client";
let token = null;
export const setToken = (t) => { token = t; };
export async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "request_failed"), { status: res.status });
  return data;
}
export const tg = () => (typeof window !== "undefined" ? window.Telegram?.WebApp : undefined);
export const haptic = (kind = "light") => { try { tg()?.HapticFeedback?.impactOccurred(kind); } catch {} };
