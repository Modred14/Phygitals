// FILE: app/(tg)/deposit/page.js
"use client";
import { useState } from "react";
import BackBar from "@/components/BackBar";
import { api, haptic } from "@/lib/client";
import { useMe } from "@/components/AuthProvider";
import { I } from "@/components/Icons";

export default function DepositPage() {
  const { refresh } = useMe();
  const [dep, setDep] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState("");
  const [sig, setSig] = useState("");
  const [vmsg, setVmsg] = useState(null);
  const [vbusy, setVbusy] = useState(false);
  const VERR = { not_finalized_yet: "Not finalized yet. Wait a minute and try again.", reference_mismatch: "The transfer's memo doesn't match your reference.", no_transfer_to_treasury: "No USDC transfer to our address was found in that transaction.", tx_failed: "That transaction failed on-chain.", signature_already_used: "That transaction was already credited.", amount_too_small: "Amount too small to credit.", rpc_unavailable: "Network check unavailable. Try again shortly." };
  async function verify() {
    if (vbusy || !sig.trim()) return; setVbusy(true); setVmsg(null);
    try { const r = await api(`/api/deposits/${dep.id}/verify`, { method: "POST", body: JSON.stringify({ signature: sig.trim() }) }); setVmsg({ ok: true, text: "Deposit confirmed and credited." }); haptic("medium"); await refresh().catch(() => {}); }
    catch (e) { setVmsg({ ok: false, text: VERR[e.message] ?? "Couldn't verify that transaction." }); }
    finally { setVbusy(false); }
  }

  async function create() {
    if (busy) return; setBusy(true); setErr("");
    try { setDep(await api("/api/deposits", { method: "POST", body: "{}" })); haptic("medium"); }
    catch (e) { setErr(e.message === "deposits_not_configured" ? "Deposits aren't configured yet." : "Couldn't create a deposit address. Try again."); }
    finally { setBusy(false); }
  }
  const copy = async (k, v) => { try { await navigator.clipboard.writeText(v); setCopied(k); setTimeout(() => setCopied(""), 1500); haptic(); } catch {} };

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column" }}>
      <BackBar title="Deposit" />
      <h1 style={{ marginTop: 18 }}>Add funds</h1>
      <p className="mut">Pick a network and token, then generate a deposit address.</p>
      <div className="label">Network</div>
      <div className="sel"><span className="avatar" style={{ background: "#9945ff", color: "#fff" }}>≡</span><div><b style={{ fontSize: 18 }}>Solana</b><div className="mut" style={{ fontSize: 14 }}>Solana · low fees</div></div></div>
      <div className="label">Token</div>
      <div className="sel"><span className="avatar" style={{ background: "#2775ca", color: "#fff" }}>$</span><div><b style={{ fontSize: 18 }}>USD Coin</b><div className="mut" style={{ fontSize: 14 }}>USDC · Stablecoin</div></div></div>

      {dep && (
        <div style={{ marginTop: 20 }}>
          <div className="label">Send USDC on Solana to</div>
          <div className="field">{dep.address}</div>
          <button className="btn dark sm" style={{ marginTop: 10, width: "100%" }} onClick={() => copy("a", dep.address)}>{I.copy} {copied === "a" ? "Copied" : "Copy address"}</button>
          <div className="label">Reference (include as memo)</div>
          <div className="field">{dep.reference}</div>
          <button className="btn dark sm" style={{ marginTop: 10, width: "100%" }} onClick={() => copy("r", dep.reference)}>{I.copy} {copied === "r" ? "Copied" : "Copy reference"}</button>
          <div className="label">After sending, paste the transaction signature</div>
          <input className="field" style={{ width: "100%", color: "#fff" }} value={sig} onChange={(e) => setSig(e.target.value)} placeholder="Transaction signature" aria-label="Transaction signature" autoCapitalize="off" autoCorrect="off" />
          <button className="btn" style={{ marginTop: 10, height: 48 }} onClick={verify} disabled={vbusy || !sig.trim()}>{vbusy ? "Verifying…" : "Verify deposit"}</button>
          {vmsg && <p role="status" style={{ color: vmsg.ok ? "var(--acc)" : "#ff8a80" }}>{vmsg.text}</p>}
          <p className="mut" style={{ fontSize: 13 }}>Only send USDC on Solana. Your balance updates after the transfer is confirmed on-chain and verified by our servers. Other tokens or networks may be lost.</p>
        </div>
      )}
      {err && <p role="alert" style={{ color: "#ff8a80" }}>{err}</p>}
      <div style={{ flex: 1 }} />
      {!dep && <button className="btn dark" onClick={create} disabled={busy} style={{ height: 64 }}>{busy ? "Generating…" : "Show deposit address"}</button>}
    </div>
  );
}