// FILE: components/OpenPackModal.js
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PackArt from "./PackArt";
import Money from "./Money";
import PlayerCard, { CardBack, cardIdentity, rarityOf } from "./PlayerCard";
import { api, haptic, hapticsOn, tg } from "@/lib/client";
import { fmt } from "@/lib/format";

const MESSAGES = { insufficient_balance: "Not enough balance.", rate_limited: "Too many attempts. Wait a moment.", pack_unavailable: "This pack isn't available right now.", duplicate_request: "That request is already being processed." };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// One orchestrated moment: the pack swells and shakes while the server draws, the top tears off, a card rises, flips and the value counts up.
export default function OpenPackModal({ pack, onClose, onDone }) {
  const [stage, setStage] = useState("shake"); // shake | tear | reveal | error
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);
  const key = useRef(crypto.randomUUID()); // one key per attempt; retries reuse it so a retry can never double-charge
  const started = useRef(false), alive = useRef(true);

  async function run() {
    setStage("shake"); setError(null);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    try {
      const [data] = await Promise.all([api(`/api/packs/${pack.slug}/open`, { method: "POST", body: JSON.stringify({ idempotencyKey: key.current }) }), wait(reduce ? 0 : 1200)]);
      if (!alive.current) return;
      setRes(data); onDone?.();
      if (!reduce) { setStage("tear"); haptic("heavy"); await wait(1000); if (!alive.current) return; }
      setStage("reveal");
      try { if (hapticsOn()) tg()?.HapticFeedback?.notificationOccurred("success"); } catch {}
    } catch (e) {
      if (!alive.current) return;
      setError({ code: e.message }); setStage("error");
      if (e.message === "insufficient_balance") key.current = crypto.randomUUID();
      haptic("light");
    }
  }
  useEffect(() => { alive.current = true; if (!started.current) { started.current = true; run(); } return () => { alive.current = false; }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rarity = res ? rarityOf(res.opening.rewardCents, res.opening.priceCents) : "common";
  const id = res ? cardIdentity(pack.slug, res.opening.tierLabel, rarity) : null;
  return (
    <div className="sheet-bg" style={{ alignItems: "center", background: "rgba(4,28,20,.96)" }} role="dialog" aria-modal="true" aria-label={`Opening ${pack.name}`}>
      <div style={{ width: "100%", maxWidth: 420, padding: 22, textAlign: "center" }}>
        {stage === "shake" && (<>
          <div className="pk-stage"><div className="pk-swell"><div className="pk-jit"><PackArt slug={pack.slug} name={pack.name} width={230} /></div></div></div>
          <p className="mut" role="status" style={{ margin: 0 }}>Opening your pack…</p>
        </>)}
        {stage === "tear" && (<>
          <div className="pk-stage"><div className="pk-rise"><CardBack /></div><PackArt slug={pack.slug} name={pack.name} width={230} torn /></div>
          <p className="mut" role="status" style={{ margin: 0 }}>Opening your pack…</p>
        </>)}
        {stage === "reveal" && res && (<>
          <div className="flash" aria-hidden="true" />
          <div className="flip"><div className="flip-in">
            <div className="face front"><PlayerCard rarity={rarity} {...id} /></div>
            <div className="face back"><CardBack /></div>
          </div></div>
          <div className="reveal-info">
            {res.opening.testMode && <span className="tag" style={{ marginLeft: 0 }}>Test result · no real money</span>}
            <div className="mut" style={{ marginTop: 10, fontSize: 14 }}>{pack.name} · {res.opening.tierLabel}</div>
            <div className="reveal-amt acc"><Money cents={res.opening.rewardCents} initial={0} duration={1100} /></div>
            <p className="mut" style={{ fontSize: 13, margin: "4px 0 0" }}>{res.opening.testMode ? "Test openings don't change your balance." : `Paid ${fmt(res.opening.priceCents)} · New balance ${fmt(res.balanceCents)}`}</p>
            <button className="btn" style={{ marginTop: 18 }} onClick={onClose}>Done</button>
          </div>
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