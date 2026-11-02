// FILE: app/(tg)/(tabs)/page.js
"use client";
import { useEffect, useRef, useState } from "react";
import PackArt, { packGlow } from "@/components/PackArt";
import OpenPackModal from "@/components/OpenPackModal";
import PackContents from "@/components/PackContents";
import { useMe } from "@/components/AuthProvider";
import { api, haptic } from "@/lib/client";
import { fmt, fmtWhole, fmtCompact } from "@/lib/format";
import { I } from "@/components/Icons";

export default function PacksPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [idx, setIdx] = useState(0);
  const [odds, setOdds] = useState(false);
  const [opening, setOpening] = useState(false);
  const { me, refresh } = useMe();
  const ref = useRef(null);

  useEffect(() => { api("/api/packs").then(setData).catch(() => setErr(true)); }, []);

  if (err) return <div className="empty">Couldn&apos;t load packs. Please try again.</div>;
  if (!data) return (<><div className="skel" style={{ height: 380, borderRadius: 28 }} /><div className="skel" style={{ height: 40, marginTop: 18, width: "60%", marginInline: "auto" }} /><div className="skel" style={{ height: 84, marginTop: 18 }} /></>);
  if (!data.packs.length) return <div className="empty">No packs are available right now. Check back soon.</div>;

  const onScroll = (e) => {
    const el = e.currentTarget, c = el.scrollLeft + el.clientWidth / 2;
    let best = 0, d = Infinity;
    [...el.children].forEach((ch, i) => { const dd = Math.abs(ch.offsetLeft + ch.offsetWidth / 2 - c); if (dd < d) { d = dd; best = i; } });
    if (best !== idx) { setIdx(best); haptic("light"); }
  };
  const goTo = (i) => { const el = ref.current, ch = el?.children[i]; if (ch) el.scrollTo({ left: ch.offsetLeft + ch.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" }); };
  const p = data.packs[idx];
  const short = !data.testMode && me.balanceCents < p.priceCents;

  return (
    <>
      {data.testMode && <div className="banner test">Test mode · no real money is used and no payouts are made.</div>}
      <div className="stage" style={{ "--pack-glow": packGlow(p.slug) }}>
        <div className="carousel" ref={ref} onScroll={onScroll}>
          {data.packs.map((k, i) => (
            <div key={k.id} className={`slide ${i === idx ? "on" : ""}`} onClick={() => goTo(i)}><PackArt slug={k.slug} name={k.name} width={226} /></div>
          ))}
        </div>
      </div>
      <div className="dots" role="tablist" aria-label="Packs">{data.packs.map((k, i) => <i key={k.id} className={i === idx ? "on" : ""} />)}</div>

      <div key={p.id} className="swap">
        <h2 className="pack-title">{p.name}</h2>
        <p className="pack-sub">Pull rewards from {fmtWhole(p.minCents)} up to {fmtCompact(p.maxCents)}</p>
        <div style={{ display: "grid", placeItems: "center" }}><button className="chip" onClick={() => { haptic("light"); setOdds(true); }}>What&apos;s inside {I.chev}</button></div>
        <div className="stats">
          <div><small>Min value</small><b>{fmtWhole(p.minCents)}</b></div>
          <div><small>Max pull</small><b>{fmtCompact(p.maxCents)}</b></div>
          <div><small>Odds</small><button onClick={() => { haptic("light"); setOdds(true); }}><b style={{ fontSize: 16 }}>View →</b></button></div>
        </div>
      </div>

      <button className="btn" onClick={() => { haptic("medium"); setOpening(true); }}>Buy for {fmtWhole(p.priceCents)}</button>
      {short && <p className="mut" style={{ textAlign: "center", fontSize: 13, margin: "12px 0 0" }}>You need {fmt(p.priceCents - me.balanceCents)} more to open this pack.</p>}
      {opening && <OpenPackModal pack={p} onClose={() => setOpening(false)} onDone={() => refresh().catch(() => {})} />}

      {odds && <PackContents pack={p} onClose={() => setOdds(false)} />}
    </>
  );
}