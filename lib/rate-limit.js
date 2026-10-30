// Best-effort per-instance limiter. Replace with a shared store (e.g. Upstash/Redis) before real-money launch.
const hits = new Map();
export function rateLimit(key, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length <= limit;
}
