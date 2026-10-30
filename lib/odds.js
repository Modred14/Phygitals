// Pure, browser-safe odds validation. Money = integer cents, probability = integer ppm.
export const PPM_TOTAL = 1_000_000;

export function validateConfig({ priceCents, tiers }) {
  const errors = [];
  if (!Number.isSafeInteger(priceCents) || priceCents <= 0) errors.push("priceCents must be a positive integer");
  if (!Array.isArray(tiers) || tiers.length === 0) errors.push("at least one tier required");
  let sum = 0;
  let maxCents = 0;
  let evNumerator = 0;
  for (const t of tiers ?? []) {
    if (![t.minCents, t.maxCents, t.probabilityPpm].every(Number.isSafeInteger)) errors.push(`tier ${t.label}: values must be integers`);
    if (t.minCents < 0 || t.maxCents < t.minCents) errors.push(`tier ${t.label}: invalid range`);
    if (t.probabilityPpm < 0) errors.push(`tier ${t.label}: negative probability`);
    sum += t.probabilityPpm;
    maxCents = Math.max(maxCents, t.maxCents);
    evNumerator += t.probabilityPpm * Math.floor((t.minCents + t.maxCents) / 2);
  }
  if (sum !== PPM_TOTAL) errors.push(`probabilities total ${sum} ppm, must be exactly ${PPM_TOTAL}`);
  const expectedValueCents = evNumerator / PPM_TOTAL;
  return {
    ok: errors.length === 0,
    errors,
    expectedValueCents,
    maxLiabilityCents: maxCents,
    // EV above price means the operator loses money on average; admin must acknowledge explicitly.
    evExceedsPrice: expectedValueCents > priceCents,
    returnToPlayerPct: priceCents > 0 ? (expectedValueCents / priceCents) * 100 : 0,
  };
}

