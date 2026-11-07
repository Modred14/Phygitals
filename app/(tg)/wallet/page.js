"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import BackBar from "@/components/BackBar";
import Money from "@/components/Money";
import { useMe } from "@/components/AuthProvider";
import { fmt } from "@/lib/format";
import { api, haptic } from "@/lib/client";
import { I } from "@/components/Icons";

const LIMIT = 50; // the transactions API returns the latest 50 entries

export default function WalletPage() {
  const { me, refresh } = useMe();
  const [spin, setSpin] = useState(false);
  const wd = me.flags.withdrawals;
  const [tx, setTx] = useState(null);
  useEffect(() => { api("/api/transactions").then((d) => setTx(d.entries)).catch(() => setTx([])); }, [me.balanceCents]);

  // Money in / out for the current month, from integer cents (no float money).
  const now = new Date();
  const month = (tx ?? []).filter((t) => { const d = new Date(t.createdAt); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
  const inCents = month.reduce((a, t) => (t.amountCents > 0 ? a + t.amountCents : a), 0);
  const outCents = month.reduce((a, t) => (t.amountCents < 0 ? a - t.amountCents : a), 0);
  const oldest = tx?.length ? new Date(tx[tx.length - 1].createdAt) : null;
  const partial = Boolean(tx && tx.length >= LIMIT && oldest && oldest.getFullYear() === now.getFullYear() && oldest.getMonth() === now.getMonth());

  return (
    <div className="page enter">
      <BackBar title="Wallet" right={<button className="icon-btn" aria-label="Refresh" onClick={async () => { setSpin(true); await refresh().catch(() => {}); setSpin(false); haptic(); }}><span style={{ display: "grid", animation: spin ? "spin .8s linear infinite" : "none" }}>{I.refresh}</span></button>} />

      <section className="wallet-hero rise" style={{ "--i": 0 }}>
        <span className="wallet-tag">{I.wallet} Phygitals wallet</span>
        <div className="wallet-lbl">Available balance</div>
        <div className="balance-num"><Money cents={me.balanceCents} initial={0} duration={1100} /></div>
        <div className="w-actions">
          <Link href="/deposit" className="w-btn" onClick={() => haptic("light")}>{I.plus}<span>Add funds</span></Link>
          <Link href={wd ? "/withdraw" : "#"} className="w-btn" aria-disabled={!wd} onClick={(e) => { if (!wd) e.preventDefault(); }}>{I.upload}<span>{wd ? "Withdraw" : "Withdraw soon"}</span></Link>
        </div>
      </section>

      <div className="w-stats rise" style={{ "--i": 1 }}>
        <div className="w-stat"><small>{I.arrowIn} Money in</small><b className="pos">{tx ? fmt(inCents) : "—"}</b></div>
        <div className="w-stat"><small>{I.arrowOut} Money out</small><b className="neg">{tx ? fmt(outCents) : "—"}</b></div>
      </div>
      <p className="note">This month{partial ? ` · based on your latest ${LIMIT} transactions` : ""}</p>

      <div className="label">Balances</div>
      <div className="card list rise" style={{ "--i": 2 }}>
        <div><span className="row gap"><span className="avatar">{I.gift}</span><b>Pack credits</b></span><b className="num">{fmt(0)}</b></div>
        <div><span className="row gap"><span className="avatar" style={{ background: "#2775ca", color: "#fff", border: 0 }}>$</span><b>USDC</b><span className="tag">Solana</span></span><b className="num">{fmt(me.balanceCents)}</b></div>
      </div>

      <div className="label">Recent activity</div>
      <div className="card rise" style={{ "--i": 3 }}>
        {!tx ? <div className="skel" style={{ height: 80 }} /> : !tx.length ? <div className="empty" style={{ padding: 28 }}>Nothing here yet. Add funds to open your first pack.</div> :
          tx.map((t, i) => <div key={t.id} className="rowline" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}><div><b style={{ textTransform: "capitalize" }}>{t.kind.replaceAll("_", " ").toLowerCase()}</b><div className="mut" style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleString()}</div></div><b className={`num ${t.amountCents >= 0 ? "pos" : "neg"}`}>{t.amountCents >= 0 ? "+" : ""}{fmt(t.amountCents)}</b></div>)}
      </div>
    </div>
  );
}
