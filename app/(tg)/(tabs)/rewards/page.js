"use client";
import { useEffect, useState } from "react";
import { useMe } from "@/components/AuthProvider";
import { api, haptic, tg } from "@/lib/client";
import { fmt } from "@/lib/format";
import { I } from "@/components/Icons";

export default function RewardsPage() {
  const { me } = useMe();
  const [copied, setCopied] = useState("");
  const [rf, setRf] = useState(null);
  useEffect(() => { api("/api/referrals").then(setRf).catch(() => setRf(null)); }, []);
  const ST = { PENDING: "Waiting for first deposit", ELIGIBLE: "Qualified", REJECTED: "Not eligible" };
  const RS = { PENDING: "Pending", CONFIRMED: "Paid", REVOKED: "Not paid" };
  const link = `https://t.me/${me.botUsername}?startapp=${me.user.referralCode}`;
  const copy = async (k, v) => { try { await navigator.clipboard.writeText(v); setCopied(k); setTimeout(() => setCopied(""), 1500); haptic(); } catch {} };
  const share = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join me and open football player packs!")}`;
    tg()?.openTelegramLink ? tg().openTelegramLink(url) : window.open(url, "_blank");
  };
  return (
    <>
      <h1 style={{ textAlign: "center", fontSize: 30, margin: "16px 0" }}>Invite Friends</h1>
      {!me.flags.referralRewards && <div className="banner" style={{ display: "flex", gap: 12 }}><span style={{ display: "grid", flex: "none" }}>{I.shield}</span><span>Referral credits are temporarily disabled. Check back soon!</span></div>}
      {me.user.referredBy && (
        <div className="card pad row gap" style={{ marginTop: 14 }}><span className="avatar">@</span><div><b>@{me.user.referredBy} referred you</b><div className="mut" style={{ fontSize: 14 }}>You joined with their invite on {new Date(me.user.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div></div></div>
      )}
      <div className="card pad" style={{ marginTop: 14 }}>
        <div className="label" style={{ margin: "0 0 10px" }}>Your invite link</div>
        <div className="field row sp" style={{ fontFamily: "inherit" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</span><button aria-label="Copy link" onClick={() => copy("l", link)}>{copied === "l" ? "✓" : I.copy}</button></div>
        <button className="btn" style={{ marginTop: 14 }} onClick={share}>{I.share} Invite friends</button>
        <div className="row sp" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}><span className="mut">Your code</span><span className="row gap"><b className="acc" style={{ fontFamily: "ui-monospace,monospace", fontSize: 18 }}>{me.user.referralCode}</b><button aria-label="Copy code" onClick={() => copy("c", me.user.referralCode)}>{copied === "c" ? "✓" : I.copy}</button></span></div>
      </div>
      <div className="card pad" style={{ marginTop: 14, textAlign: "center" }}>
        <div className="avatar" style={{ margin: "0 auto 8px" }}>{I.users}</div>
        <b style={{ fontSize: 22 }}>{me.referrals.invited}</b><div className="mut">Invited</div>
      </div>
      {rf && (<>
        <div className="card pad" style={{ marginTop: 14 }}>
          <div className="label" style={{ margin: "0 0 8px" }}>How it works</div>
          <p className="mut" style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>You earn {fmt(rf.rules.rewardCents)} when a friend you invite makes a verified deposit of at least {fmt(rf.rules.minDepositCents)}. Rewards stay pending for {rf.rules.holdDays} days, then are added to your balance after an automatic check. Pending rewards can&apos;t be withdrawn. Self-referrals and accounts sharing a wallet don&apos;t qualify.</p>
          <div className="row sp" style={{ marginTop: 12 }}><span className="mut">Pending</span><b>{fmt(rf.pendingCents)}</b></div>
          <div className="row sp" style={{ marginTop: 6 }}><span className="mut">Paid</span><b className="acc">{fmt(rf.confirmedCents)}</b></div>
        </div>
        {rf.referrals.length > 0 && <div className="card" style={{ marginTop: 14 }}>{rf.referrals.map((r) => (
          <div key={r.id} className="rowline"><div><b>{r.name}</b><div className="mut" style={{ fontSize: 12 }}>{ST[r.status]} · {new Date(r.createdAt).toLocaleDateString()}</div></div><span className="mut" style={{ fontSize: 13 }}>{r.rewardStatus ? `${RS[r.rewardStatus]} ${fmt(r.rewardCents)}` : "—"}</span></div>))}</div>}
      </>)}
    </>
  );
}
