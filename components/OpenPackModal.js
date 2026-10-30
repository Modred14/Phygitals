"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PackArt from "./PackArt";
import { api, haptic } from "@/lib/client";
import { fmt } from "@/lib/format";

const MESSAGES = { insufficient_balance: "Not enough balance.", rate_limited: "Too many attempts. Wait a moment.", pack_unavailable: "This pack isn't available right now.", duplicate_request: "That request is already being processed." };

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
        new Promise((r) => setTimeout(r, reduce ? 0 : 1800)),
      ]);
      setRes(data); setStage("reveal"); haptic("heavy"); onDone?.();
    } catch (e) {
      setError({ code: e.message, shortfall: null }); setStage("error");
      if (e.message === "insufficient_balance") key.current = crypto.randomUUID();
    }
  }
  useEffect(() => { if (!started.current) { started.current = true; run(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="sheet-bg" style={{ alignItems: "center", background: "rgba(0,0,0,.88)" }} role="dialog" aria-modal="true" aria-label={`Opening ${pack.name}`}>
      <div style={{ width: "100%", maxWidth: 420, padding: 20, textAlign: "center" }}>
        {stage === "opening" && (<>
          <div className="shake"><PackArt slug={pack.slug} name={pack.name} width={220} /></div>
          <p className="mut" role="status">Opening your pack…</p>
        </>)}
        {stage === "reveal" && res && (<>
          <div className="reveal card" style={{ padding: 28, background: "linear-gradient(160deg,#16382b,#121212)" }}>
            {res.opening.testMode && <span className="tag" style={{ marginLeft: 0 }}>TEST RESULT · NO REAL MONEY</span>}
            <div className="mut" style={{ marginTop: 14, letterSpacing: ".14em", fontSize: 12 }}>{pack.name.toUpperCase()}</div>
            <h2 style={{ fontSize: 22, margin: "8px 0" }}>{res.opening.tierLabel}</h2>
            <div style={{ fontSize: 54, fontWeight: 800 }} className="acc">{fmt(res.opening.rewardCents)}</div>
            <p className="mut" style={{ fontSize: 13 }}>{res.opening.testMode ? "Test openings don't change your balance." : `Paid ${fmt(res.opening.priceCents)} · New balance ${fmt(res.balanceCents)}`}</p>
          </div>
          <button className="btn" style={{ marginTop: 16 }} onClick={onClose}>Done</button>
        </>)}
        {stage === "error" && (<>
          <div className="card pad"><h2>{error.code === "insufficient_balance" ? "Add funds to continue" : "Couldn't open pack"}</h2>
            <p className="mut">{MESSAGES[error.code] ?? "Something went wrong. You were not charged twice; retrying is safe."}</p></div>
          {error.code === "insufficient_balance" ? <Link href="/deposit" className="btn" style={{ marginTop: 14, textDecoration: "none" }}>Add funds</Link> : <button className="btn" style={{ marginTop: 14 }} onClick={run}>Try again</button>}
          <button className="btn dark" style={{ marginTop: 10 }} onClick={onClose}>Cancel</button>
        </>)}
      </div>
    </div>
  );
}
