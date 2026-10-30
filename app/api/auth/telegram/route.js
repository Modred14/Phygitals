import { z } from "zod";
import { getDb } from "@/lib/db";
import { verifyInitData } from "@/lib/telegram";
import { upsertTelegramUser } from "@/lib/users";
import { signSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";
const Body = z.object({ initData: z.string().min(10).max(4096), ref: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).optional() });
export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`auth:${ip}`, 20)) return Response.json({ error: "rate_limited" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  try {
    const { user, startParam } = verifyInitData(parsed.data.initData, process.env.TELEGRAM_BOT_TOKEN, Number(process.env.TELEGRAM_INITDATA_MAX_AGE_SECONDS ?? 3600));
    const userId = await upsertTelegramUser(getDb(), user, startParam ?? parsed.data.ref ?? null);
    return Response.json({ token: signSession(userId) });
  } catch {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
}
