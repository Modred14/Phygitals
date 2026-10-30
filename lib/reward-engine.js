// Server-only reward engine (CSPRNG).
import { randomInt } from "node:crypto";
import { PPM_TOTAL, validateConfig } from "./odds.js";
export { PPM_TOTAL, validateConfig };

// CSPRNG only. Persist {configVersionId, roll, tierId, amountCents} in the same transaction as the charge.
export function drawReward(tiers) {
  const roll = randomInt(0, PPM_TOTAL);
  let acc = 0;
  for (const t of tiers) {
    acc += t.probabilityPpm;
    if (roll < acc) {
      const amountCents = t.minCents === t.maxCents ? t.minCents : randomInt(t.minCents, t.maxCents + 1);
      return { tierId: t.id, roll, amountCents };
    }
  }
  throw new Error("unreachable: tiers did not sum to PPM_TOTAL");
}
