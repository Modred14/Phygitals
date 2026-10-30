import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import { readSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";
// Creates a deposit intent. Balance is credited ONLY after server-side chain verification (separate verifier job), never here.
export async function POST(req) {
  const uid = readSession(req);
  if (!uid) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`dep:${uid}`, 10)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const address = process.env.SOLANA_DEPOSIT_TREASURY_ADDRESS, mint = process.env.SOLANA_USDC_MINT;
  if (!address || address === "replace-me") return Response.json({ error: "deposits_not_configured" }, { status: 503 });
  const d = await getDb().deposit.create({ data: { userId: uid, asset: "USDC", network: "solana", address, reference: randomBytes(8).toString("hex") } });
  return Response.json({ id: d.id, address, mint, asset: "USDC", network: "Solana", reference: d.reference });
}
