// FILE: lib/cards.js
// Pure helpers for the illustrated cards. Names are generic archetypes, never real people.
export const rarityOf = (rewardCents, priceCents) => (rewardCents >= priceCents * 3 ? "epic" : rewardCents >= priceCents ? "rare" : "common");

const POOLS = { epic: ["Legendary", "Iconic", "Immortal"], rare: ["Elite", "Veteran", "Prime"], common: ["Rookie", "Rising", "Academy"] };
const ROLES = ["Striker", "Playmaker", "Winger", "Captain", "Sweeper", "Maestro", "Keeper"];
const POS = { Striker: "ST", Playmaker: "CAM", Winger: "RW", Captain: "CM", Sweeper: "CB", Maestro: "CM", Keeper: "GK" };
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// Deterministic: the same pack tier always shows the same card everywhere in the app. (Unsigned shifts only: no negatives.)
export function cardIdentity(slug, tierLabel, rarity) {
  const h = hash(`${slug}|${tierLabel}`), role = ROLES[h % ROLES.length], pool = POOLS[rarity] ?? POOLS.common;
  return { name: `${pool[(h >>> 3) % pool.length]} ${role}`, number: ((h >>> 6) % 98) + 1, pos: POS[role] };
}