"use client";
import { useEffect, useRef, useState } from "react";
import BackBar from "@/components/BackBar";
import { useMe } from "@/components/AuthProvider";
import { api, haptic } from "@/lib/client";
import { fmt, parseDollarsToCents } from "@/lib/format";

const ERR = { invalid_address: "That isn't a valid Solana address.", insufficient_balance: "Not enough available balance.", amount_out_of_range: "Amount is outside the allowed range.", amount_below_fee: "Amount must be larger than the processing fee.", withdrawals_disabled: "Withdrawals aren't enabled yet.", rate_limited: "Too many attempts. Wait a moment.", duplicate_request: "That request is already being processed." };
const STATUS = { PENDING: "Pending review", PROCESSING: "Processing", COMPLETED: "Completed", FAILED: "Failed (funds returned)", CANCELLED: "Cancelled" };

export default function WithdrawPage() {
  const { me, refresh } = useMe();
  const [addr, setAddr] = useState(""), [amt, setAmt] = useState(""), [q, setQ] = useState(null);
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(null), [list, setList] = useState(null);
  const key = useRef(crypto.randomUUID());
  const cents = parseDollarsToCents(amt);
  const load = () => api("/api/withdrawals").then((d) => setList(d.withdrawals)).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  useEffect(() => { setQ(null); if (cents == null) return; const t = setTimeout(() => api(`/api/withdrawals/quote?amountCents=${cents}`).then(setQ).catch(() => {}), 300); return () => clearTimeout(t); }, [cents]);

  async function submit() {
    if (busy || !q?.ok) return; setBusy(true); setMsg(null);
    try {
      await api("/api/withdrawals", { method: "POST", body: JSON.stringify({ destination: addr.trim(), amountCents: cents, idempotencyKey: key.current }) });
      key.current = crypto.randomUUID(); setAmt(""); setMsg({ ok: true, text: "Withdrawal requested. Funds are reserved until it's processed." }); haptic("medium");
      await Promise.all([refresh(), load()]);
    } catch (e) { setMsg({ ok: false, text: ERR[e.message] ?? "Couldn't submit. Your balance wasn't changed unless it appears below." }); }
    finally { setBusy(false); }
  }
  if (!me.flags.withdrawals) return <div className="page"><BackBar title="Withdraw" /><div className="empty">Withdrawals aren&apos;t enabled yet.</div></div>;
  return (
    <div className="page">
      <BackBar title="Withdraw" />
      <p className="mut">Available: <b style={{ color: "#fff" }}>{fmt(me.balanceCents)}</b></p>
      <div className="label">Solana wallet address</div>
      <input className="field" style={{ width: "100%", color: "#fff" }} value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Paste address" aria-label="Solana address" autoCapitalize="off" autoCorrect="off" />
      <div className="label">Amount (USD)</div>
      <input className="field" style={{ width: "100%", color: "#fff", fontFamily: "inherit", fontSize: 22 }} inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" aria-label="Amount in dollars" />
      {q && (q.ok ? (
        <div className="card list" style={{ marginTop: 14 }}>
          <div><span className="mut">Network</span><b>{q.network} · {q.asset}</b></div>
          <div><span className="mut">Processing fee <small>(ours, not a blockchain fee)</small></span><b>{fmt(q.platformFeeCents)}</b></div>
          <div><span className="mut">Solana network fee</span><b>Covered by us</b></div>
          <div><span className="mut">You receive</span><b className="acc">{fmt(q.receiveCents)}</b></div>
          <div><span className="mut">Timing</span><b style={{ textAlign: "right", fontSize: 14 }}>{q.eta}</b></div>
        </div>
      ) : <p style={{ color: "#ff8a80" }}>{ERR[q.error] ?? "Invalid amount."}{q.minCents ? ` Minimum ${fmt(q.minCents)}.` : ""}</p>)}
      <button className="btn" style={{ marginTop: 16 }} disabled={busy || !q?.ok || !addr.trim()} onClick={submit}>{busy ? "Submitting…" : "Confirm withdrawal"}</button>
      {msg && <p role="status" style={{ color: msg.ok ? "var(--acc)" : "#ff8a80" }}>{msg.text}</p>}
      <div className="label">Your withdrawals</div>
      <div className="card">
        {!list ? <div className="skel" style={{ height: 70 }} /> : !list.length ? <div className="empty" style={{ padding: 24 }}>No withdrawals yet.</div> : list.map((w) => (
          <div key={w.id} className="rowline"><div><b>{fmt(w.amountCents)}</b><div className="mut" style={{ fontSize: 12 }}>{STATUS[w.status]}{w.failureReason ? ` · ${w.failureReason}` : ""}</div>{w.explorerUrl && <a href={w.explorerUrl} target="_blank" rel="noreferrer" className="acc" style={{ fontSize: 12 }}>View on explorer</a>}</div><span className="mut" style={{ fontSize: 12 }}>{new Date(w.createdAt).toLocaleDateString()}</span></div>
        ))}
      </div>
    </div>
  );
}
