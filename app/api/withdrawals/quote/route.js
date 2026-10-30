import { readSession } from "@/lib/session";
import { quote } from "@/lib/withdrawals";
import { getDb } from "@/lib/db";
import { loadWithdrawalSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";
export async function GET(req) {
  if (!readSession(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const a = Number(new URL(req.url).searchParams.get("amountCents"));
  return Response.json(quote(a, await loadWithdrawalSettings(getDb())));
}
