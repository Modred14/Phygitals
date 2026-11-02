// FILE: components/OpenPackModal.js
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PackArt from "./PackArt";
import Money from "./Money";
import PlayerCard, { cardIdentity } from "./PlayerCard";
import { api, haptic, hapticsOn, tg } from "@/lib/client";
import { fmt } from "@/lib/format";

const MESSAGES = { insufficient_balance: "Not enough balance.", rate_limited: "Too many attempts. Wait a moment.", pack_unavailable: "This pack isn't available right now.", duplicate_request: "That request is already being processed." };
const rarityOf = (reward, price) => (reward >= price * 3 ? "epic" : reward >= price ? "rare" : "common");
const PARTS = Array.from({ length: 22 }, (_, i) => { const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.2, r = 90 + (i * 37) % 90; return { x: Math.round(Math.cos(a) * r), y: Math.round(Math.sin(a) * r) - 30, d: (i % 6) * 40 }; });

export default function OpenPackModal({ pack, onClose, onDone }) {
  const [stage, setStage] = useState("opening"); // opening | reveal | error
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);
  const key = useRef(crypto.randomUUID()); // one key per attempt; retries reuse it so a retry can never double-charge
  const started = useRef(false);

  async function run() {
    setStage("opening"); setError(null);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    try {
      const [data] = await Promise.all([
        api(`/api/packs/${pack.slug}/open`, { method: "POST", body: JSON.stringify({ idempotencyKey: key.current }) }),
        new Promise((r) => setTimeout(r, reduce ? 0 : 1900)),
      ]);
      setRes(data); setStage("reveal"); onDone?.();
      const r = rarityOf(data.opening.rewardCents, data.opening.priceCents);
      try { if (hapticsOn()) r === "common" ? tg()?.HapticFeedback?.impactOccurred("medium") : tg()?.HapticFeedback?.notificationOccurred("success"); } catch {}
    } catch (e) {
      setError({ code: e.message }); setStage("error");
      if (e.message === "insufficient_balance") key.current = crypto.randomUUID();
      haptic("light");
    }
  }
  useEffect(() => { if (!started.current) { started.current = true; run(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rarity = res ? rarityOf(res.opening.rewardCents, res.opening.priceCents) : "common";
  const colors = rarity === "epic" ? ["#f2c14e", "#fff1b8", "#ffd86b"] : ["#3ee0a0", "#b7ffe0", "#0c9a69"];
  return (
    <div className="sheet-bg" style={{ alignItems: "center", background: "rgba(2,4,4,.9)" }} role="dialog" aria-modal="true" aria-label={`Opening ${pack.name}`}>
      <div style={{ width: "100%", maxWidth: 420, padding: 22, textAlign: "center", position: "relative" }}>
        {stage === "opening" && (<>
          <div className="stage-open"><div className="shake"><PackArt slug={pack.slug} name={pack.name} width={230} /></div></div>
          <p className="mut" role="status" style={{ marginTop: 18 }}>Opening your pack…</p>
        </>)}
        {stage === "reveal" && res && (<>
          {rarity !== "common" && <div className="burst" aria-hidden="true">{PARTS.map((p, i) => <i key={i} style={{ "--x": `${p.x}px`, "--y": `${p.y}px`, "--d": `${p.d}ms`, "--c": colors[i % 3] }} />)}</div>}
          <div className="reveal" data-rarity={rarity}>
            {res.opening.testMode && <span className="tag" style={{ marginLeft: 0 }}>TEST RESULT · NO REAL MONEY</span>}
            <div className="reveal-card"><PlayerCard rarity={rarity} {...cardIdentity(pack.slug, res.opening.tierLabel, rarity)} /></div>
            <div className="mut" style={{ marginTop: 6, letterSpacing: ".18em", fontSize: 11.5, fontWeight: 700 }}>{pack.name.toUpperCase()}</div>
            <h2 style={{ fontSize: 21, margin: "10px 0 0" }}>{res.opening.tierLabel}</h2>
            <div className="reveal-amt acc" style={{ fontSize: 44 }}><Money cents={res.opening.rewardCents} initial={0} duration={1100} /></div>
            <p className="mut" style={{ fontSize: 13, margin: 0 }}>{res.opening.testMode ? "Test openings don't change your balance." : `Paid ${fmt(res.opening.priceCents)} · New balance ${fmt(res.balanceCents)}`}</p>
          </div>
          <button className="btn" style={{ marginTop: 18 }} onClick={onClose}>Done</button>
        </>)}
        {stage === "error" && (<>
          <div className="card pad swap"><h2>{error.code === "insufficient_balance" ? "Add funds to continue" : "Couldn't open pack"}</h2>
            <p className="mut" style={{ marginBottom: 0 }}>{MESSAGES[error.code] ?? "Something went wrong. You were not charged twice; retrying is safe."}</p></div>
          {error.code === "insufficient_balance" ? <Link href="/deposit" className="btn" style={{ marginTop: 14 }}>Add funds</Link> : <button className="btn" style={{ marginTop: 14 }} onClick={run}>Try again</button>}
          <button className="btn dark" style={{ marginTop: 10 }} onClick={onClose}>Cancel</button>
        </>)}
      </div>
    </div>
  );
}