// Display-only integer math (no float money).
export function fmt(cents) {
  const c = Math.abs(Math.trunc(Number(cents) || 0));
  return `${cents < 0 ? "-" : ""}$${Math.floor(c / 100).toLocaleString("en-US")}.${String(c % 100).padStart(2, "0")}`;
}
export function fmtWhole(cents) { return `$${Math.floor(Number(cents) / 100).toLocaleString("en-US")}`; }
export function fmtCompact(cents) {
  const d = Math.floor(Number(cents) / 100);
  if (d >= 1000) return `$${(Math.floor(d / 100) / 10).toString().replace(/\.0$/, "")}K`;
  return `$${d}`;
}
export const pct = (ppm) => `${(ppm / 10000).toFixed(2).replace(/\.?0+$/, "")}%`;
// "12.5" -> 1250. Strict, integer-only; returns null if invalid.
export function parseDollarsToCents(s) {
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(String(s).trim());
  return m ? Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || 0) : null;
}

// "60" -> 600000 ppm, "2.5" -> 25000, up to 4 decimals. Strict; null if invalid.
export function parsePercentToPpm(s) {
  const m = /^(\d{1,3})(?:\.(\d{1,4}))?$/.exec(String(s).trim());
  if (!m) return null;
  const v = Number(m[1]) * 10000 + Number((m[2] ?? "").padEnd(4, "0") || 0);
  return v <= 1_000_000 ? v : null;
}
