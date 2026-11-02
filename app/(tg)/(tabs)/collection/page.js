// FILE: app/(tg)/(tabs)/collection/page.js
"use client";
import { useEffect, useState } from "react";
import PlayerCard, { cardIdentity, rarityOf } from "@/components/PlayerCard";
import { api } from "@/lib/client";
import { fmt } from "@/lib/format";
import { I } from "@/components/Icons";

export default function Collection() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api("/api/openings").then((d) => setRows(d.openings)).catch(() => setRows([])); }, []);
  if (!rows) return <div className="inside-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 300, borderRadius: 22 }} />)}</div>;
  if (!rows.length) return (
    <div className="empty"><div className="empty-art">{I.grid}</div><h2 style={{ color: "#fff", marginBottom: 6 }}>No pulls yet</h2><p style={{ margin: 0 }}>Open a pack and your cards will appear here.</p></div>
  );
  const best = Math.max(...rows.map((r) => r.rewardCents));
  return (
    <>
      <h1 style={{ fontSize: 30 }}>Collection</h1>
      <div className="sum"><div><small>Packs opened</small><b>{rows.length}</b></div><div><small>Best pull</small><b className="acc">{fmt(best)}</b></div></div>
      <div className="inside-grid">
        {rows.map((o, i) => {
          const r = rarityOf(o.rewardCents, o.priceCents), id = cardIdentity(o.slug, o.tierLabel, r);
          return (
            <div key={o.id} className="pcard" style={{ "--i": Math.min(i, 10) }}>
              <div className="art" data-rarity={r}><PlayerCard rarity={r} {...id} /></div>
              <div className="meta">
                <div className="pname">{id.name} #{id.number}{o.testMode && <span className="tag">TEST</span>}</div>
                <div className="pval num">{fmt(o.rewardCents)}</div>
                <div className="pchance">{o.pack} · {new Date(o.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}