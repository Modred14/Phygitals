// FILE: components/Landing.js
"use client";
import { useEffect, useState } from "react";
import PackArt from "./PackArt";
import PlayerCard from "./PlayerCard";
import { fmtWhole } from "@/lib/format";

const FALLBACK = [{ slug: "legend", name: "Legend Pack" }, { slug: "ballon-dor", name: "Ballon d'Or Winner" }, { slug: "prime", name: "Prime Pack" }, { slug: "superstar", name: "Superstar Pack" }];

export default function Landing({ error }) {
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs";
  const [packs, setPacks] = useState(null);
  useEffect(() => { fetch("/api/packs").then((r) => r.json()).then((d) => setPacks(d.packs ?? [])).catch(() => setPacks([])); }, []);
  const list = packs?.length ? packs : FALLBACK;
  return (
    <div className="land">
      <header className="land-top"><div className="brand">{name}</div><span className="chip">18+</span></header>

      <section className="land-hero">
        <svg className="pitch" viewBox="0 0 520 360" fill="none" aria-hidden="true"><circle cx="260" cy="180" r="124" stroke="rgba(255,255,255,.16)" strokeWidth="2"/><rect y="179" width="520" height="2" fill="rgba(255,255,255,.16)"/><circle cx="260" cy="180" r="5" fill="rgba(255,255,255,.16)"/></svg>
        <h1 className="land-h1">Open the pack. Pull the star.</h1>
        <p className="land-sub">Football player cards in four packs. Every pack lists its odds before you buy.</p>
        <div className="fan" aria-hidden="true">
          <div className="fan-card" style={{ "--end": "translate(-58px,16px) rotate(-11deg)", "--d": ".1s" }}><PlayerCard rarity="common" name="Rising Winger" number={7} pos="RW" /></div>
          <div className="fan-card" style={{ "--end": "translate(58px,16px) rotate(11deg)", "--d": ".25s" }}><PlayerCard rarity="epic" name="Iconic Striker" number={9} pos="ST" /></div>
          <div className="fan-card" style={{ "--end": "translate(0,-4px)", "--d": ".4s", zIndex: 2 }}><PlayerCard rarity="rare" name="Elite Playmaker" number={10} pos="CAM" /></div>
        </div>
        <p className="cap">Illustrative cards</p>
      </section>

      <a className="btn" style={{ marginTop: 18 }} href={`https://t.me/${bot}`}>Open in Telegram</a>
      <p className="mut" style={{ textAlign: "center", fontSize: 13.5, margin: "10px 0 0" }}>{error ? "We couldn't verify your Telegram session. Reopen the app from the bot." : "Sign in happens inside Telegram."}</p>

      <section className="land-section">
        <h2>Packs</h2>
        <div className="strip" aria-label="Available packs" style={{ marginTop: 12 }}>
          {list.map((p) => (
            <div key={p.slug} className="strip-item"><PackArt slug={p.slug} name={p.name} width={112} /><b>{p.name.replace(" Pack", "")}</b>{p.priceCents != null && <span className="mut">{fmtWhole(p.priceCents)}</span>}</div>
          ))}
        </div>
      </section>
      <p className="legal">Must be 18+ to continue. Odds are shown before every purchase.</p>
    </div>
  );
}