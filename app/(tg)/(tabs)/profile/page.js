// FILE: app/(tg)/(tabs)/profile/page.js
/* eslint-disable @next/next/no-img-element -- Telegram avatar is an external URL */
"use client";
import Link from "next/link";
import { useState } from "react";
import { useMe } from "@/components/AuthProvider";
import Money from "@/components/Money";
import { I } from "@/components/Icons";
import { fmt } from "@/lib/format";
import { haptic, hapticsOn, setHaptics } from "@/lib/client";

export default function Profile() {
  const { me } = useMe();
  const [img, setImg] = useState(Boolean(me.user.photoUrl));
  const [hap, setHap] = useState(() => hapticsOn());
  const [copied, setCopied] = useState(false);
  const name = me.user.firstName ?? me.user.username ?? "Player";
  const since = new Date(me.user.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const copy = async () => { try { await navigator.clipboard.writeText(me.user.referralCode); setCopied(true); setTimeout(() => setCopied(false), 1500); haptic(); } catch {} };
  const toggle = () => { const next = !hap; setHap(next); setHaptics(next); if (next) haptic("medium"); };

  return (
    <>
      <div className="profile-hero rise" style={{ "--i": 0 }}>
        <div className="ring"><div className="avatar-xl">
          {img ? <img src={me.user.photoUrl} alt="" referrerPolicy="no-referrer" onError={() => setImg(false)} /> : name[0].toUpperCase()}
        </div></div>
        <h2 style={{ fontSize: 24 }}>{name}</h2>
        <div className="mut" style={{ marginTop: 4 }}>{me.user.username ? `@${me.user.username}` : "Telegram account"}</div>
        <div style={{ marginTop: 12 }}><span className="chip" style={{ cursor: "default" }}>{I.shield} Member since {since}</span></div>
      </div>

      <div className="tiles rise" style={{ "--i": 1 }}>
        <div className="tile"><small>Balance</small><b><Money cents={me.balanceCents} /></b></div>
        <div className="tile"><small>Packs opened</small><b>{me.stats.openings}</b></div>
        <div className="tile"><small>Best pull</small><b className={me.stats.openings ? "acc" : ""}>{me.stats.openings ? fmt(me.stats.bestPullCents) : "—"}</b></div>
      </div>

      <div className="label">Shortcuts</div>
      <div className="card menu rise" style={{ "--i": 2 }}>
        <Link href="/wallet" className="menu-row"><span className="ic">{I.wallet}</span><span className="tx"><b>Wallet</b><span>Balance, deposits and withdrawals</span></span><span className="go">{I.right}</span></Link>
        <Link href="/collection" className="menu-row"><span className="ic">{I.grid}</span><span className="tx"><b>Pack history</b><span>{me.stats.openings} {me.stats.openings === 1 ? "pack" : "packs"} opened</span></span><span className="go">{I.right}</span></Link>
        <Link href="/rewards" className="menu-row"><span className="ic">{I.users}</span><span className="tx"><b>Invite friends</b><span>{me.referrals.invited} invited</span></span><span className="go">{I.right}</span></Link>
      </div>

      <div className="label">Preferences</div>
      <div className="card menu rise" style={{ "--i": 3 }}>
        <div className="menu-row"><span className="ic">{I.gift}</span><span className="tx"><b>Haptic feedback</b><span>Vibrations on taps and reveals</span></span><button className="switch" role="switch" aria-checked={hap} aria-label="Haptic feedback" onClick={toggle} /></div>
        <div className="menu-row"><span className="ic">{I.copy}</span><span className="tx"><b>Your invite code</b><span className="num" style={{ fontFamily: "ui-monospace,monospace" }}>{me.user.referralCode}</span></span><button className="chip" onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>
      </div>

      <div className="card pad rise" style={{ marginTop: 16, "--i": 4 }}>
        <div className="row gap" style={{ alignItems: "flex-start" }}><span className="ic avatar" style={{ width: 40, height: 40 }}>{I.shield}</span>
          <p className="mut" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>You must be 18 or older to use this app. Odds are shown before every purchase and outcomes are drawn on our servers. Only play with money you can afford to lose.</p></div>
      </div>
    </>
  );
}