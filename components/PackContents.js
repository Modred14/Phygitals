// FILE: components/PackContents.js
"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PlayerCard, { cardIdentity, rarityOf } from "./PlayerCard";
import { I } from "./Icons";
import { fmt, pct } from "@/lib/format";
import { haptic, tg } from "@/lib/client";

// Full-screen "What's inside". Each card is one reward tier with its REAL published odds, so nothing shown can't be won.
export default function PackContents({ pack, onClose }) {
  const cb = useRef(onClose); cb.current = onClose;
  useEffect(() => {
    const close = () => cb.current();
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const key = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    const b = tg()?.BackButton; b?.show(); b?.onClick(close);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); b?.offClick(close); b?.hide(); };
  }, []);
  const tiers = [...pack.tiers].sort((a, b) => b.maxCents - a.maxCents);
  return createPortal(
    <div className="inside" role="dialog" aria-modal="true" aria-label={`${pack.name} contents`}>
      <div className="inside-head rise"><h1>{pack.name}</h1><p>What&apos;s Inside</p></div>
      <div className="inside-grid">
        {tiers.map((t, i) => {
          const r = rarityOf((t.minCents + t.maxCents) / 2, pack.priceCents), id = cardIdentity(pack.slug, t.label, r);
          return (
            <div key={t.id} className="pcard" style={{ "--i": Math.min(i, 10) }}>
              <div className="art" data-rarity={r}><PlayerCard rarity={r} {...id} /></div>
              <div className="meta">
                <div className="pname">{id.name} #{id.number}</div>
                <div className="pval num">{fmt(t.minCents)}{t.maxCents !== t.minCents ? ` – ${fmt(t.maxCents)}` : ""}</div>
                <div className="pchance"><span className="num">{pct(t.probabilityPpm)}</span> chance</div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="inside-note">Cards illustrate reward tiers. Config v{pack.configVersion} · price {fmt(pack.priceCents)}. Outcomes are drawn on our servers with a cryptographic random generator.</p>
      <button className="close-fab" onClick={() => { haptic("light"); onClose(); }}>{I.close} Close</button>
    </div>,
    document.body,
  );
}