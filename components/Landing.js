"use client";
import { useEffect, useState } from "react";
import PackArt from "./PackArt";
import HeroCard from "./HeroCard";
import { fmtWhole } from "@/lib/format";

const FALLBACK = [{ slug: "legend", name: "Legend Pack" }, { slug: "ballon-dor", name: "Ballon d'Or Winner" }, { slug: "prime", name: "Prime Pack" }, { slug: "superstar", name: "Superstar Pack" }];

export default function Landing({ error }) {
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs";
  const [packs, setPacks] = useState(null);
  useEffect(() => { fetch("/api/packs").then((r) => r.json()).then((d) => setPacks(d.packs ?? [])).catch(() => setPacks([])); }, []);
  const list = packs?.length ? packs : FALLBACK;
  return (
    <div className="page" style={{ display: "flex", flexDirection: "column" }}>
      <div className="brand" style={{ textAlign: "center" }}>{name}</div>
      <div className="hero"><HeroCard /></div>
      <h2 style={{ textAlign: "center", fontSize: 30 }}>Collect football stars.</h2>
      <p className="mut" style={{ textAlign: "center", margin: "8px 0 16px" }}>{error ? "We couldn't verify your Telegram session. Reopen the app from the bot." : "Open this app from Telegram to sign in securely."}</p>
      <div className="label" style={{ margin: "6px 0 8px" }}>Packs</div>
      <div className="strip" aria-label="Available packs">
        {list.map((p) => (
          <div key={p.slug} className="strip-item"><PackArt slug={p.slug} name={p.name} width={118} /><b>{p.name}</b>{p.priceCents != null && <span className="mut">{fmtWhole(p.priceCents)}</span>}</div>
        ))}
      </div>
      <a className="btn" style={{ textDecoration: "none", marginTop: 18 }} href={`https://t.me/${bot}`}>Open in Telegram</a>
      <p className="mut" style={{ textAlign: "center", fontSize: 12, marginTop: 16 }}>Must be 18+ to continue. Odds are shown before every purchase.</p>
    </div>
  );
}
