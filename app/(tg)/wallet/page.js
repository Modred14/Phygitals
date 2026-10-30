"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import BackBar from "@/components/BackBar";
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
    <div className="page">
      <BackBar title="Wallet" right={<button className="icon-btn" aria-label="Refresh" onClick={async () => { setSpin(true); await refresh().catch(() => {}); setSpin(false); haptic(); }}>{spin ? "…" : I.refresh}</button>} />
      <div className="card pad" style={{ background: "linear-gradient(135deg,#123326,#161616 70%)", height: 176 }}>
        <div className="row gap"><span className="avatar" style={{ width: 34, height: 34 }}>$</span><span className="acc" style={{ letterSpacing: ".18em", fontWeight: 700, fontSize: 13 }}>AVAILABLE</span></div>
        <div style={{ fontSize: 52, fontWeight: 800, marginTop: 14, letterSpacing: "-.03em" }}>{fmt(me.balanceCents)}</div>
      </div>
      <div className="card list" style={{ marginTop: 16 }}>
        <div><span className="row gap"><span className="avatar">⌁</span><b>Pack Credits</b></span><b className="acc">{fmt(0)}</b></div>
        <div><span className="row gap"><span className="avatar" style={{ background: "#2775ca", color: "#fff" }}>$</span><b>USDC</b><span className="tag">Solana</span></span><b>{fmt(me.balanceCents)}</b></div>
      </div>
      <Link href="/deposit" className="btn" style={{ marginTop: 16, textDecoration: "none" }}>{I.plus} Add Funds</Link>
      <div className="card pad" style={{ marginTop: 16 }}>
        <div className="label" style={{ margin: "0 0 10px" }}>● Withdraw</div>
        <div className="row gap">
          <button className="card pad" disabled style={{ flex: 1, background: "#1d1d1d" }}><div className="avatar" style={{ margin: "0 auto 8px" }}>{I.bank}</div><b>To Bank</b><div className="mut" style={{ fontSize: 12 }}>Not available</div></button>
          <Link href={wd ? "/withdraw" : "#"} aria-disabled={!wd} onClick={(e) => !wd && e.preventDefault()} className="card pad" style={{ flex: 1, background: "#1d1d1d", textAlign: "center", textDecoration: "none", color: "inherit", opacity: wd ? 1 : .5 }}><div className="avatar" style={{ margin: "0 auto 8px" }}>{I.send}</div><b>To Wallet</b><div className="mut" style={{ fontSize: 12 }}>{wd ? "Solana" : "Not enabled yet"}</div></Link>
        </div>
      </div>
      <div className="label">Activity</div>
      <div className="card">
        {!tx ? <div className="skel" style={{ height: 80 }} /> : !tx.length ? <div className="empty" style={{ padding: 24 }}>No transactions yet.</div> :
          tx.map((t) => <div key={t.id} className="rowline"><div><b>{t.kind.replaceAll("_", " ").toLowerCase()}</b><div className="mut" style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleString()}</div></div><b className={t.amountCents >= 0 ? "acc" : ""}>{t.amountCents >= 0 ? "+" : ""}{fmt(t.amountCents)}</b></div>)}
      </div>
    </div>
  );
}
