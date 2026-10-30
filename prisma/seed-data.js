// TEST distributions only. Real odds must be set and published by an administrator. All money in cents, odds in ppm.
export const SEED_PACKS = [
  { slug: "legend", name: "Legend Pack", priceCents: 10000, tiers: [
    ["$10–$50", 1000, 5000, 600000], ["$51–$99", 5100, 9900, 250000], ["$100–$300", 10000, 30000, 120000], ["$600–$700", 60000, 70000, 25000], ["$701–$1,000", 70100, 100000, 5000] ] },
  { slug: "ballon-dor", name: "Ballon d'Or Winner", priceCents: 7000, tiers: [
    ["$7–$35", 700, 3500, 600000], ["$36–$69", 3600, 6900, 250000], ["$70–$200", 7000, 20000, 120000], ["$500–$600", 50000, 60000, 25000], ["$601–$700", 60100, 70000, 5000] ] },
  { slug: "prime", name: "Prime Pack", priceCents: 5000, tiers: [
    ["$5–$25", 500, 2500, 600000], ["$26–$49", 2600, 4900, 250000], ["$50–$150", 5000, 15000, 120000], ["$300–$400", 30000, 40000, 25000], ["$401–$500", 40100, 50000, 5000] ] },
  { slug: "superstar", name: "Superstar Pack", priceCents: 1000, tiers: [
    ["$1–$5", 100, 500, 640000], ["$6–$9", 600, 900, 250000], ["$10–$20", 1000, 2000, 100000], ["$200–$300", 20000, 30000, 10000] ] },
].map((p) => ({ ...p, tiers: p.tiers.map(([label, minCents, maxCents, probabilityPpm], i) => ({ id: `${p.slug}-${i}`, label, minCents, maxCents, probabilityPpm })) }));
