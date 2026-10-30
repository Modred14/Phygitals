"use client";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-client";
import { fmt, parseDollarsToCents, parsePercentToPpm, pct } from "@/lib/format";
import { validateConfig } from "@/lib/odds";

const RANK = { SUPPORT: 1, FINANCE: 2, SUPER_ADMIN: 3 };
const TABS = [["overview", "Overview", "SUPPORT"], ["users", "Users", "SUPPORT"], ["packs", "Packs & odds", "SUPPORT"], ["withdrawals", "Withdrawals", "FINANCE"], ["deposits", "Deposits", "FINANCE"], ["referrals", "Referrals", "FINANCE"], ["ledger", "Ledger", "FINANCE"], ["audit", "Audit log", "SUPER_ADMIN"], ["settings", "Settings", "SUPER_ADMIN"]];
const errText = (e) => e.data?.errors?.join("; ") ?? e.message;

function useLoad(path, deps = []) {
  const [d, setD] = useState(null), [e, setE] = useState(null);
  const reload = useCallback(() => adminApi(path).then((x) => { setD(x); setE(null); }).catch(setE), [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, [reload, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return [d, e, reload];
}
const Table = ({ cols, rows, empty = "Nothing here." }) => (
  <div className="card scroll">{!rows?.length ? <div className="empty" style={{ padding: 24 }}>{empty}</div> :
    <table className="tbl"><thead><tr>{cols.map((c) => <th key={c[0]}>{c[0]}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={r.id ?? i}>{cols.map((c) => <td key={c[0]}>{c[1](r)}</td>)}</tr>)}</tbody></table>}</div>
);
const Err = ({ e }) => (e ? <p className="bad" role="alert">{errText(e)}</p> : null);
const when = (d) => new Date(d).toLocaleString();

function Login({ onDone }) {
  const [f, setF] = useState({ email: "", password: "", totp: "" }), [err, setErr] = useState(null), [busy, setBusy] = useState(false);
  async function go(ev) { ev.preventDefault(); if (busy) return; setBusy(true); setErr(null); try { onDone(await adminApi("/api/admin/login", { method: "POST", body: f })); } catch (e) { setErr(e.status === 429 ? "Too many attempts. Wait 10 minutes." : "Invalid credentials."); } finally { setBusy(false); } }
  return (
    <div className="page"><h1 style={{ marginTop: 60 }}>Admin sign in</h1>
      <form onSubmit={go} style={{ display: "grid", gap: 10 }}>
        <input className="in" type="email" placeholder="Email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <input className="in" type="password" placeholder="Password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        <input className="in" inputMode="numeric" maxLength={6} placeholder="6-digit authenticator code" autoComplete="one-time-code" value={f.totp} onChange={(e) => setF({ ...f, totp: e.target.value.replace(/\D/g, "") })} required />
        <button className="btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>{err && <p className="bad" role="alert">{err}</p>}
      </form></div>
  );
}

function Overview() {
  const [d, e] = useLoad("/api/admin/overview");
  if (e) return <Err e={e} />; if (!d) return <div className="skel" style={{ height: 200 }} />;
  const K = ({ t, v, bad }) => <div className="card pad kpi"><span className="mut">{t}</span><b className={bad ? "bad" : ""}>{v}</b></div>;
  return (<>
    {d.unbalancedTransactions > 0 && <div className="banner">⚠ {d.unbalancedTransactions} ledger transaction(s) do not sum to zero. Investigate before any payout.</div>}
    <div className="banner" style={{ margin: "12px 0", background: "transparent" }}>Paid openings: <b>{d.flags.paidOpenings ? "ON" : "OFF (test mode)"}</b> · Withdrawals: <b>{d.flags.withdrawals ? "ON" : "OFF"}</b> · Referral rewards: <b>{d.flags.referralRewards ? "ON" : "OFF"}</b> <span className="mut">(environment flags)</span></div>
    <div className="grid">
      <K t="Users" v={d.users} /><K t="Credited deposits" v={`${d.deposits.count} · ${fmt(d.deposits.creditedCents)}`} />
      <K t="Open withdrawals" v={`${d.withdrawalsOpen.count} · ${fmt(d.withdrawalsOpen.cents)}`} /><K t="Owed to users" v={fmt(d.owedToUsersCents)} />
      <K t="Reward pool (ledger)" v={fmt(d.rewardPoolCents)} bad={d.rewardPoolCents < 0} /><K t="Treasury (ledger)" v={fmt(d.treasuryCents)} />
      <K t="Fees collected" v={fmt(d.feesCents)} /><K t="Referrals (eligible/total)" v={`${d.referrals.eligible}/${d.referrals.total} · paid ${fmt(d.referrals.paidCents)}`} />
    </div>
    <h2 style={{ margin: "24px 0 10px" }}>Reward liability by pack</h2>
    <Table rows={d.liability} cols={[["Pack", (r) => r.pack], ["Status", (r) => r.status], ["Published", (r) => (r.published ? `v${r.version}` : "—")], ["Price", (r) => (r.published ? fmt(r.priceCents) : "—")], ["Max single payout", (r) => (r.published ? fmt(r.maxLiabilityCents) : "—")], ["Expected payout", (r) => (r.published ? fmt(Math.round(r.expectedValueCents)) : "—")], ["Return to player", (r) => (r.published ? <span className={r.rtpPct > 100 ? "bad" : ""}>{r.rtpPct.toFixed(1)}%</span> : "—")]]} />
  </>);
}

function Users({ role }) {
  const [q, setQ] = useState(""), [qq, setQq] = useState(""), [d, e, reload] = useLoad(`/api/admin/users?q=${encodeURIComponent(qq)}`), [err, setErr] = useState(null);
  async function act(u, action) { const reason = window.prompt(`Reason to ${action} ${u.username ?? u.id}?`); if (!reason) return; try { await adminApi(`/api/admin/users/${u.id}`, { method: "POST", body: { action, reason } }); reload(); } catch (x) { setErr(x); } }
  return (<>
    <form onSubmit={(ev) => { ev.preventDefault(); setQq(q); }} className="row gap" style={{ marginBottom: 12 }}><input className="in" style={{ flex: 1 }} placeholder="Search username, Telegram ID, user ID or code" value={q} onChange={(x) => setQ(x.target.value)} /><button className="btn sm">Search</button></form>
    <Err e={e || err} />
    <Table rows={d?.users} cols={[["User", (u) => <>{u.username ? `@${u.username}` : "—"}<div className="mut">{u.id}</div></>], ["Telegram ID", (u) => String(u.telegramId ?? "")], ["Balance", (u) => fmt(u.balanceCents)], ["Joined", (u) => when(u.createdAt)], ["Status", (u) => (u.bannedAt ? <span className="bad">Banned</span> : "Active")],
      ["", (u) => RANK[role] >= 2 && <button className="chip" onClick={() => act(u, u.bannedAt ? "unban" : "ban")}>{u.bannedAt ? "Unban" : "Ban"}</button>]]} />
  </>);
}

function TierEditor({ pack, seed, rewardPool, onSaved }) {
  const [price, setPrice] = useState(seed ? String(Number(seed.priceCents) / 100) : ""), [err, setErr] = useState(null);
  const [tiers, setTiers] = useState(seed ? seed.tiers.map((t) => ({ label: t.label, min: String(Number(t.minCents) / 100), max: String(Number(t.maxCents) / 100), pct: String(t.probabilityPpm / 10000) })) : [{ label: "", min: "", max: "", pct: "" }]);
  const parsed = tiers.map((t) => ({ label: t.label.trim(), minCents: parseDollarsToCents(t.min), maxCents: parseDollarsToCents(t.max), probabilityPpm: parsePercentToPpm(t.pct) }));
  const priceCents = parseDollarsToCents(price), bad = priceCents == null || parsed.some((t) => !t.label || t.minCents == null || t.maxCents == null || t.probabilityPpm == null);
  const v = !bad ? validateConfig({ priceCents, tiers: parsed }) : null;
  const upd = (i, k, val) => setTiers(tiers.map((t, j) => (j === i ? { ...t, [k]: val } : t)));
  async function save() { setErr(null); try { await adminApi(`/api/admin/packs/${pack.id}/configs`, { method: "POST", body: { priceCents, tiers: parsed } }); onSaved(); } catch (e) { setErr(e); } }
  return (
    <div className="card pad" style={{ marginTop: 10 }}>
      <b>New version for {pack.name}</b>
      <div className="row gap" style={{ margin: "10px 0" }}><span className="mut">Price $</span><input className="in" style={{ width: 110 }} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      {tiers.map((t, i) => (
        <div key={i} className="row gap" style={{ marginBottom: 6, flexWrap: "wrap" }}>
          <input className="in" style={{ flex: 2, minWidth: 120 }} placeholder="Tier label" value={t.label} onChange={(e) => upd(i, "label", e.target.value)} />
          <input className="in" style={{ width: 90 }} placeholder="Min $" value={t.min} onChange={(e) => upd(i, "min", e.target.value)} />
          <input className="in" style={{ width: 90 }} placeholder="Max $" value={t.max} onChange={(e) => upd(i, "max", e.target.value)} />
          <input className="in" style={{ width: 90 }} placeholder="Odds %" value={t.pct} onChange={(e) => upd(i, "pct", e.target.value)} />
          <button className="chip" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} aria-label="Remove tier">✕</button>
        </div>))}
      <button className="chip" onClick={() => setTiers([...tiers, { label: "", min: "", max: "", pct: "" }])}>+ Add tier</button>
      <p className={v?.ok ? "ok" : "bad"} role="status">{bad ? "Fill every field with valid numbers (odds up to 4 decimals)." : v.ok ? `Odds total 100%. Return to player ${v.returnToPlayerPct.toFixed(1)}% · max single payout ${fmt(v.maxLiabilityCents)}${v.evExceedsPrice ? " · EXPECTED PAYOUT EXCEEDS PRICE" : ""}` : v.errors.join("; ")}</p>
      <Err e={err} />
      <button className="btn sm" disabled={!v?.ok} onClick={save}>Save as new version</button>
    </div>
  );
}

function Publish({ cfg, pool, onDone }) {
  const v = cfg.validation, unfunded = pool < v.maxLiabilityCents;
  const [ackEv, setAckEv] = useState(false), [ackFund, setAckFund] = useState(false), [word, setWord] = useState(""), [err, setErr] = useState(null);
  async function go() { setErr(null); try { await adminApi(`/api/admin/configs/${cfg.id}/publish`, { method: "POST", body: { confirm: "PUBLISH", acknowledgeEvExceedsPrice: ackEv, acknowledgeUnfundedLiability: ackFund } }); onDone(); } catch (e) { setErr(e); } }
  return (
    <div className="banner" style={{ marginTop: 8 }}>
      <b>Publishing v{cfg.version} makes these odds live to users.</b>
      <div style={{ fontWeight: 400, margin: "8px 0" }}>Return to player {v.returnToPlayerPct.toFixed(1)}% · max single payout {fmt(v.maxLiabilityCents)} · reward pool {fmt(pool)}</div>
      {v.evExceedsPrice && <label style={{ display: "block", margin: "6px 0" }}><input type="checkbox" checked={ackEv} onChange={(e) => setAckEv(e.target.checked)} /> I understand the expected payout exceeds the pack price (the operator loses money on average).</label>}
      {unfunded && <label style={{ display: "block", margin: "6px 0" }}><input type="checkbox" checked={ackFund} onChange={(e) => setAckFund(e.target.checked)} /> I understand the reward pool does not cover the maximum single payout.</label>}
      <div className="row gap" style={{ marginTop: 8 }}><input className="in" placeholder='Type PUBLISH' value={word} onChange={(e) => setWord(e.target.value)} /><button className="btn sm" disabled={word !== "PUBLISH" || (v.evExceedsPrice && !ackEv) || (unfunded && !ackFund)} onClick={go}>Publish</button></div>
      <Err e={err} />
    </div>
  );
}

function Packs({ role }) {
  const [d, e, reload] = useLoad("/api/admin/packs"), [edit, setEdit] = useState(null), [pub, setPub] = useState(null), [np, setNp] = useState({ slug: "", name: "" }), [err, setErr] = useState(null);
  if (e) return <Err e={e} />; if (!d) return <div className="skel" style={{ height: 200 }} />;
  const sa = role === "SUPER_ADMIN";
  async function setStatus(p, status) { try { await adminApi(`/api/admin/packs/${p.id}/status`, { method: "POST", body: { status } }); reload(); } catch (x) { setErr(x); } }
  return (<>
    <Err e={err} />
    {d.packs.map((p) => (
      <div key={p.id} className="card pad" style={{ marginBottom: 14 }}>
        <div className="row sp"><h2>{p.name} <span className="tag">{p.status}</span></h2>
          <span className="row gap">{RANK[role] >= 2 && p.status === "ACTIVE" && <button className="chip" onClick={() => setStatus(p, "PAUSED")}>Pause</button>}{RANK[role] >= 2 && p.status === "PAUSED" && <button className="chip" onClick={() => setStatus(p, "ACTIVE")}>Resume</button>}{sa && <button className="chip" onClick={() => setEdit({ pack: p, seed: null })}>New version</button>}</span></div>
        <Table rows={p.configs} empty="No versions yet." cols={[["Ver", (c) => `v${c.version}`], ["Status", (c) => c.status], ["Price", (c) => fmt(Number(c.priceCents))], ["Return to player", (c) => `${c.validation.returnToPlayerPct.toFixed(1)}%`], ["Tiers", (c) => c.tiers.map((t) => `${t.label} ${pct(t.probabilityPpm)}`).join(" · ")],
          ["", (c) => sa && <span className="row gap">{c.status === "VALIDATED" && <button className="chip" onClick={() => setPub(pub === c.id ? null : c.id)}>Publish…</button>}<button className="chip" onClick={() => setEdit({ pack: p, seed: c })}>Copy to draft</button></span>]]} />
        {p.configs.filter((c) => c.id === pub).map((c) => <Publish key={c.id} cfg={c} pool={d.rewardPoolCents} onDone={() => { setPub(null); reload(); }} />)}
        {edit?.pack.id === p.id && <TierEditor key={edit.seed?.id ?? "new"} pack={p} seed={edit.seed} rewardPool={d.rewardPoolCents} onSaved={() => { setEdit(null); reload(); }} />}
      </div>))}
    {sa && <form className="card pad row gap" onSubmit={async (ev) => { ev.preventDefault(); try { await adminApi("/api/admin/packs", { method: "POST", body: np }); setNp({ slug: "", name: "" }); reload(); } catch (x) { setErr(x); } }}>
      <input className="in" placeholder="slug (a-z, 0-9, -)" value={np.slug} onChange={(x) => setNp({ ...np, slug: x.target.value })} /><input className="in" placeholder="Pack name" value={np.name} onChange={(x) => setNp({ ...np, name: x.target.value })} /><button className="btn sm">Create pack</button></form>}
  </>);
}

function Withdrawals() {
  const [st, setSt] = useState("PENDING"), [d, e, reload] = useLoad(`/api/admin/withdrawals?status=${st}`, [st]), [err, setErr] = useState(null);
  async function act(w, body, ask) { if (ask && !window.confirm(ask)) return; try { await adminApi(`/api/admin/withdrawals/${w.id}`, { method: "POST", body }); reload(); } catch (x) { setErr(x); } }
  return (<>
    <div className="row gap" style={{ marginBottom: 12 }}>{["PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((s) => <button key={s} className={`chip ${st === s ? "on" : ""}`} style={st === s ? { background: "#2b2b2b" } : {}} onClick={() => setSt(s)}>{s}</button>)}</div>
    <Err e={e || err} />
    <Table rows={d?.withdrawals} cols={[["User", (w) => w.user], ["Amount", (w) => fmt(w.amountCents)], ["Fee", (w) => fmt(w.platformFeeCents)], ["Send", (w) => <b>{fmt(w.amountCents - w.platformFeeCents)} USDC</b>], ["Destination", (w) => <span style={{ fontFamily: "monospace" }}>{w.destination}</span>], ["Requested", (w) => when(w.createdAt)], ["Tx", (w) => w.explorerUrl ? <a className="acc" href={w.explorerUrl} target="_blank" rel="noreferrer">view</a> : "—"],
      ["Actions", (w) => <span className="row gap">
        {w.status === "PENDING" && <button className="chip" onClick={() => act(w, { action: "approve" }, `Approve ${fmt(w.amountCents)} to ${w.destination}?`)}>Approve</button>}
        {(w.status === "PENDING" || w.status === "PROCESSING") && <button className="chip" onClick={() => { const signature = window.prompt("Paste the payout transaction signature. It is verified on-chain before completing."); if (signature) act(w, { action: "complete", signature: signature.trim() }); }}>Complete</button>}
        {(w.status === "PENDING" || w.status === "PROCESSING") && <button className="chip" onClick={() => { const reason = window.prompt("Reason for failing (funds are returned to the user)"); if (reason) act(w, { action: "fail", reason }); }}>Fail & refund</button>}</span>]]} />
  </>);
}

const Deposits = () => { const [d, e] = useLoad("/api/admin/deposits"); return <><Err e={e} /><Table rows={d?.deposits} cols={[["User", (x) => x.user], ["Status", (x) => x.status], ["Credited", (x) => (x.creditedCents != null ? fmt(x.creditedCents) : "—")], ["Reference", (x) => <span style={{ fontFamily: "monospace" }}>{x.reference}</span>], ["Chain tx", (x) => x.chainTxId?.slice(0, 14) ?? "—"], ["Created", (x) => when(x.createdAt)]]} /></>; };

function Referrals() {
  const [d, e, reload] = useLoad("/api/admin/referrals"), [msg, setMsg] = useState(null);
  async function confirmDue() { if (!window.confirm("Pay all referral rewards whose hold period has ended? Shared-wallet and banned referrers are revoked instead.")) return; try { const r = await adminApi("/api/admin/referrals/confirm", { method: "POST", body: {} }); setMsg(`Confirmed ${r.confirmed}, revoked ${r.revoked}, skipped ${r.skipped}.`); reload(); } catch (x) { setMsg(x.message === "referral_rewards_disabled" ? "Referral rewards are disabled (REFERRAL_REWARDS_ENABLED=false)." : errText(x)); } }
  return (<>
    <div className="row gap" style={{ marginBottom: 12 }}><button className="btn sm" onClick={confirmDue}>Confirm due rewards</button>{msg && <span role="status">{msg}</span>}</div>
    <Err e={e} />
    <Table rows={d?.referrals} cols={[["Referrer", (r) => r.referrer], ["Referred", (r) => r.referred], ["Status", (r) => r.status], ["Reward", (r) => (r.rewardStatus ? `${r.rewardStatus} ${fmt(r.rewardCents)}` : "—")], ["Reason", (r) => r.reason ?? "—"], ["Event", (r) => r.event ?? "—"], ["Created", (r) => when(r.createdAt)]]} />
  </>);
}

function Ledger({ role }) {
  const [uid, setUid] = useState(""), [uq, setUq] = useState(""), [d, e, reload] = useLoad(`/api/admin/ledger?userId=${encodeURIComponent(uq)}`), [f, setF] = useState({ amt: "", note: "", word: "" }), [err, setErr] = useState(null);
  async function fund() { const cents = parseDollarsToCents(f.amt); if (cents == null) return setErr({ message: "Invalid amount" }); try { await adminApi("/api/admin/ledger/fund", { method: "POST", body: { amountCents: cents, note: f.note, confirm: "FUND" } }); setF({ amt: "", note: "", word: "" }); setErr(null); reload(); } catch (x) { setErr(x); } }
  return (<>
    {role === "SUPER_ADMIN" && <div className="card pad" style={{ marginBottom: 14 }}><b>Record reward-pool funding</b><p className="mut" style={{ fontSize: 13 }}>Only record funds you have actually deposited. This is audited.</p>
      <div className="row gap" style={{ flexWrap: "wrap" }}><input className="in" style={{ width: 120 }} placeholder="Amount $" value={f.amt} onChange={(x) => setF({ ...f, amt: x.target.value })} /><input className="in" style={{ flex: 1, minWidth: 160 }} placeholder="Note (e.g. tx reference)" value={f.note} onChange={(x) => setF({ ...f, note: x.target.value })} /><input className="in" style={{ width: 110 }} placeholder="Type FUND" value={f.word} onChange={(x) => setF({ ...f, word: x.target.value })} /><button className="btn sm" disabled={f.word !== "FUND" || f.note.length < 5} onClick={fund}>Record</button></div></div>}
    <form onSubmit={(ev) => { ev.preventDefault(); setUq(uid); }} className="row gap" style={{ marginBottom: 12 }}><input className="in" style={{ flex: 1 }} placeholder="Filter by user ID (blank = latest 200 entries)" value={uid} onChange={(x) => setUid(x.target.value)} /><button className="btn sm">Filter</button></form>
    <Err e={e || err} />
    <Table rows={d?.entries} cols={[["When", (x) => when(x.createdAt)], ["Account", (x) => x.account], ["Kind", (x) => x.kind], ["Amount", (x) => <span className={x.amountCents >= 0 ? "ok" : ""}>{fmt(x.amountCents)}</span>], ["Tx", (x) => <span style={{ fontFamily: "monospace" }}>{x.transactionId.slice(0, 8)}</span>], ["Ref", (x) => (x.refType ? `${x.refType} ${x.refId?.slice(0, 8) ?? ""}` : "—")]]} />
  </>);
}

const Audit = () => { const [d, e] = useLoad("/api/admin/audit"); return <><Err e={e} /><Table rows={d?.logs} cols={[["When", (x) => when(x.createdAt)], ["Admin", (x) => x.admin ?? "—"], ["Action", (x) => x.action], ["Entity", (x) => `${x.entity} ${x.entityId?.slice(0, 8) ?? ""}`], ["Details", (x) => <code style={{ fontSize: 11 }}>{JSON.stringify(x.after)?.slice(0, 160)}</code>], ["IP", (x) => x.ip ?? "—"]]} /></>; };

function Settings() {
  const [d, e, reload] = useLoad("/api/admin/settings"), [f, setF] = useState(null), [msg, setMsg] = useState(null);
  useEffect(() => { if (d) setF({ fee: String(d.withdrawal.feeCents / 100), min: String(d.withdrawal.minCents / 100), max: String(d.withdrawal.maxCents / 100), ref: String(d.referral.rewardCents / 100), refMin: String(d.referral.minDepositCents / 100), refHold: String(d.referral.holdDays) }); }, [d]);
  if (e) return <Err e={e} />; if (!f) return <div className="skel" style={{ height: 160 }} />;
  const c = { fee: parseDollarsToCents(f.fee), min: parseDollarsToCents(f.min), max: parseDollarsToCents(f.max), ref: parseDollarsToCents(f.ref), refMin: parseDollarsToCents(f.refMin), refHold: /^\d{1,2}$/.test(f.refHold) ? Number(f.refHold) : null }, ok = Object.values(c).every((x) => x != null) && c.refMin > 0;
  async function save() { if (!window.confirm("Save settings? Withdrawal fees apply to new requests immediately.")) return; try { await adminApi("/api/admin/settings", { method: "POST", body: { withdrawal: { feeCents: c.fee, minCents: c.min, maxCents: c.max }, referral: { rewardCents: c.ref, minDepositCents: c.refMin, holdDays: c.refHold }, confirm: "SAVE" } }); setMsg("Saved."); reload(); } catch (x) { setMsg(errText(x)); } }
  const F = (k, label) => <label style={{ display: "grid", gap: 4 }}><span className="mut">{label}</span><input className="in" value={f[k]} onChange={(x) => setF({ ...f, [k]: x.target.value })} /></label>;
  return (<div className="card pad" style={{ display: "grid", gap: 12, maxWidth: 420 }}>{F("fee", "Withdrawal processing fee ($, our fee, not a blockchain fee)")}{F("min", "Minimum withdrawal ($)")}{F("max", "Maximum withdrawal ($)")}{F("ref", "Referral reward per eligible user ($)")}{F("refMin", "Referral: minimum verified deposit by the referred user ($)")}{F("refHold", "Referral: hold period before payout (days)")}
    <p className="mut" style={{ fontSize: 12 }}>Launch switches (paid openings, withdrawals, referral payouts) are environment variables so that they cannot be flipped from a compromised browser session.</p>
    <button className="btn sm" disabled={!ok} onClick={save}>Save settings</button>{msg && <p role="status">{msg}</p>}</div>);
}

export default function AdminPage() {
  const [me, setMe] = useState(undefined), [tab, setTab] = useState("overview");
  useEffect(() => { adminApi("/api/admin/me").then(setMe).catch(() => setMe(null)); }, []);
  if (me === undefined) return <div className="page"><div className="skel" style={{ height: 120 }} /></div>;
  if (!me) return <Login onDone={setMe} />;
  const tabs = TABS.filter((t) => RANK[me.role] >= RANK[t[2]]);
  const View = { overview: Overview, users: Users, packs: Packs, withdrawals: Withdrawals, deposits: Deposits, referrals: Referrals, ledger: Ledger, audit: Audit, settings: Settings }[tab];
  return (
    <div className="admin">
      <div className="row sp"><h1 style={{ fontSize: 26, margin: 0 }}>Admin</h1><span className="row gap"><span className="mut">{me.email} · {me.role}</span><button className="chip" onClick={async () => { await adminApi("/api/admin/logout", { method: "POST" }).catch(() => {}); setMe(null); }}>Sign out</button></span></div>
      <div className="tabs" role="tablist">{tabs.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{label}</button>)}</div>
      <View role={me.role} />
    </div>
  );
}
