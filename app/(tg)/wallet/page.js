// FILE: app/(tg)/wallet/page.js
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import BackBar from "@/components/BackBar";
import Money from "@/components/Money";
import { useMe } from "@/components/AuthProvider";
import { fmt } from "@/lib/format";
import { api, haptic } from "@/lib/client";
import { I } from "@/components/Icons";

export default function WalletPage() {
  const { me, refresh } = useMe();
  const [spin, setSpin] = useState(false);
  const wd = me.flags.withdrawals;
  const [tx, setTx] = useState(null);
  useEffect(() => { api("/api/transactions").then((d) => setTx(d.entries)).catch(() => setTx([])); }, [me.balanceCents]);
  return (
    <div className="page enter">
      <BackBar title="Wallet" right={<button className="icon-btn" aria-label="Refresh" onClick={async () => { setSpin(true); await refresh().catch(() => {}); setSpin(false); haptic(); }}><span style={{ display: "grid", animation: spin ? "spin .8s linear infinite" : "none" }}>{I.refresh}</span></button>} />
      <div className="hero-balance rise" style={{ "--i": 0 }}>
        <div className="row gap"><span className="avatar" style={{ width: 34, height: 34 }}>$</span><span className="acc" style={{ letterSpacing: ".2em", fontWeight: 750, fontSize: 12 }}>AVAILABLE</span></div>
        <div className="balance-num"><Money cents={me.balanceCents} initial={0} duration={1100} /></div>
      </div>
      <div className="card list rise" style={{ marginTop: 16, "--i": 1 }}>
        <div><span className="row gap"><span className="avatar">⌁</span><b>Pack Credits</b></span><b className="acc num">{fmt(0)}</b></div>
        <div><span className="row gap"><span className="avatar" style={{ background: "#2775ca", color: "#fff", border: 0 }}>$</span><b>USDC</b><span className="tag">Solana</span></span><b className="num">{fmt(me.balanceCents)}</b></div>
      </div>
      <Link href="/deposit" className="btn rise" style={{ marginTop: 16, "--i": 2 }}>{I.plus} Add Funds</Link>
      <div className="card pad rise" style={{ marginTop: 16, "--i": 3 }}>
        <div className="label" style={{ margin: "0 0 12px" }}>● Withdraw</div>
        <div className="row gap">
          <button className="card pad" disabled style={{ flex: 1, background: "var(--s2)" }}><div className="avatar" style={{ margin: "0 auto 8px" }}>{I.bank}</div><b>To Bank</b><div className="mut" style={{ fontSize: 12 }}>Not available</div></button>
          <Link href={wd ? "/withdraw" : "#"} aria-disabled={!wd} onClick={(e) => !wd && e.preventDefault()} className="card pad" style={{ flex: 1, background: "var(--s2)", textAlign: "center", textDecoration: "none", color: "inherit", opacity: wd ? 1 : 0.5 }}><div className="avatar" style={{ margin: "0 auto 8px" }}>{I.send}</div><b>To Wallet</b><div className="mut" style={{ fontSize: 12 }}>{wd ? "Solana" : "Not enabled yet"}</div></Link>
        </div>
      </div>
      <div className="label">Activity</div>
      <div className="card rise" style={{ "--i": 4 }}>
        {!tx ? <div className="skel" style={{ height: 80 }} /> : !tx.length ? <div className="empty" style={{ padding: 28 }}>No transactions yet.</div> :
          tx.map((t, i) => <div key={t.id} className="rowline" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}><div><b style={{ textTransform: "capitalize" }}>{t.kind.replaceAll("_", " ").toLowerCase()}</b><div className="mut" style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleString()}</div></div><b className={`num ${t.amountCents >= 0 ? "acc" : ""}`}>{t.amountCents >= 0 ? "+" : ""}{fmt(t.amountCents)}</b></div>)}
      </div>
    </div>
  );
}