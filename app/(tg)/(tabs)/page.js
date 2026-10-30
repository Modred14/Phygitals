"use client";
import { useEffect, useRef, useState } from "react";
import PackArt from "@/components/PackArt";
import { api, haptic } from "@/lib/client";
import { fmt, fmtWhole, fmtCompact, pct } from "@/lib/format";
import { I } from "@/components/Icons";
import OpenPackModal from "@/components/OpenPackModal";
import { useMe } from "@/components/AuthProvider";

export default function PacksPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [idx, setIdx] = useState(0);
  const [odds, setOdds] = useState(false);
  const [opening, setOpening] = useState(false);
  const { me, refresh } = useMe();
  const ref = useRef(null);

  useEffect(() => { api("/api/packs").then(setData).catch(() => setErr(true)); }, []);

  if (err) return <div className="empty">Couldn&apos;t load packs. Pull to retry.</div>;
  if (!data) return <div className="skel" style={{ height: 520 }} />;
  if (!data.packs.length) return <div className="empty">No packs are available right now. Check back soon.</div>;

  const onScroll = (e) => {
    const el = e.currentTarget, c = el.scrollLeft + el.clientWidth / 2;
    let best = 0, d = Infinity;
    [...el.children].forEach((ch, i) => { const dd = Math.abs(ch.offsetLeft + ch.offsetWidth / 2 - c); if (dd < d) { d = dd; best = i; } });
    if (best !== idx) { setIdx(best); haptic("light"); }
  };
  const p = data.packs[idx];

  return (
    <>
      {data.testMode && <div className="banner test">Test mode: no real money is used and no payouts are made.</div>}
      <div className="carousel" ref={ref} onScroll={onScroll}>
        {data.packs.map((k, i) => (
          <div key={k.id} className={`slide ${i === idx ? "on" : ""}`}><PackArt slug={k.slug} name={k.name} width={230} /></div>
        ))}
      </div>
      <div className="dots" aria-hidden="true">{data.packs.map((k, i) => <i key={k.id} className={i === idx ? "on" : ""} />)}</div>
      <h2 style={{ textAlign: "center", fontSize: 26 }}>{p.name}</h2>
      <div style={{ display: "grid", placeItems: "center", margin: "12px 0" }}>
        <button className="chip" onClick={() => setOdds(true)}>What&apos;s inside {I.chev}</button>
      </div>
      <div className="stats">
        <div><small>Min Value</small><b>{fmtWhole(p.minCents)}</b></div>
        <div><small>Max Pull</small><b style={{ fontSize: 22 }}>{fmtCompact(p.maxCents)}</b></div>
        <div><small>Odds</small><button className="acc" style={{ color: "#ddd", fontWeight: 700 }} onClick={() => setOdds(true)}>View →</button></div>
      </div>
      <button className="btn" onClick={() => { haptic("medium"); setOpening(true); }}>Buy for {fmtWhole(p.priceCents)}</button>
      {!data.testMode && me.balanceCents < p.priceCents && <p className="mut" style={{ textAlign: "center", fontSize: 13 }}>You need {fmt(p.priceCents - me.balanceCents)} more to open this pack.</p>}
      {opening && <OpenPackModal pack={p} onClose={() => setOpening(false)} onDone={() => refresh().catch(() => {})} />}

      {odds && (
        <div className="sheet-bg" onClick={() => setOdds(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${p.name} odds`}>
            <h2>{p.name} odds</h2>
            <p className="mut" style={{ fontSize: 13 }}>Config v{p.configVersion}. Price {fmt(p.priceCents)}. Outcomes are drawn on our servers with a cryptographic random generator.</p>
            <div className="list card" style={{ marginTop: 12 }}>
              {p.tiers.map((t) => (
                <div key={t.id}><div><b>{t.label}</b><div className="mut" style={{ fontSize: 13 }}>{fmt(t.minCents)}{t.maxCents !== t.minCents ? ` – ${fmt(t.maxCents)}` : ""}</div></div><b>{pct(t.probabilityPpm)}</b></div>
              ))}
            </div>
            <button className="btn dark" style={{ marginTop: 16 }} onClick={() => setOdds(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
