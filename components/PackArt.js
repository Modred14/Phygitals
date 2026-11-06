// FILE: components/PackArt.js
// Glass holo-foil pack artwork: a tinted foil body under a frosted sheen, iridescent sweep, lit rim and a glass info panel.
// Crimped ends and the tear line keep the original geometry so the shake -> tear animation is unchanged. Original design (no third-party IP).
import { useId } from "react";

const PACKS = {
  legend: { light: "#fff1a6", face: "#ffd23f", dark: "#d9a900", ink: "#1a1400", lines: ["LEGEND"] },
  "ballon-dor": { light: "#ffffff", face: "#f3f1e8", dark: "#c9c5b2", ink: "#0b3d2e", lines: ["BALLON", "D'OR"] },
  prime: { light: "#ff9a9d", face: "#e5484d", dark: "#b53539", ink: "#fff4ef", lines: ["PRIME"] },
  superstar: { light: "#86adff", face: "#2f6fed", dark: "#2456bd", ink: "#f3f6ff", lines: ["SUPER", "STAR"] },
};
const DISPLAY = "'Barlow Condensed','Arial Narrow',sans-serif";

// zig-zag edge points from x=260 to x=0 (shared by both halves of a torn pack)
const TEAR = Array.from({ length: 22 }, (_, i) => [260 - i * 12, i % 2 ? 86 : 76]).concat([[0, 76]]);
const pts = TEAR.map(([x, y]) => `L${x} ${y}`).join(" ");
const crimp = (y0, y1, up) => { let d = `M14 ${up ? y1 : y0}`; d += ` V${up ? y0 + 8 : y1 - 8}`; for (let x = 14; x < 246; x += 10) d += ` L${x + 5} ${up ? y0 : y1} L${x + 10} ${up ? y0 + 8 : y1 - 8}`; return `${d} V${up ? y1 : y0} Z`; };

export default function PackArt({ slug, name, width = 260, torn = false }) {
  const uid = useId().replace(/:/g, "");
  const g = (k) => `${k}-${uid}`, u = (k) => `url(#${g(k)})`;
  const c = PACKS[slug] ?? PACKS.superstar, n = c.lines.length, last = 100 + (n - 1) * 58;
  const art = (
    <g>
      <path d={crimp(10, 40, true)} fill={u("crimpT")}/>
      <path d={crimp(380, 410, false)} fill={u("crimpB")}/>
      <path d="M14 38H246" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5"/>
      <path d="M14 382H246" stroke="#fff" strokeOpacity=".3" strokeWidth="1.5"/>
      <rect x="14" y="40" width="232" height="340" fill={u("face")}/>
      <circle cx="130" cy="236" r="66" fill="none" stroke={c.ink} strokeOpacity=".16" strokeWidth="2"/>
      <rect x="14" y="235" width="232" height="2" fill={c.ink} opacity=".16"/>
      <polygon points="14,318 246,262 246,380 14,380" fill={u("shade")}/>
      <rect x="14" y="40" width="232" height="340" fill={u("holo")}/>
      <polygon points="14,40 168,40 14,252" fill={u("glare")}/>
      {c.lines.map((t, i) => <text key={t} x="26" y={100 + i * 58} fontSize="64" fontWeight="800" fontStyle="italic" fill={c.ink} fontFamily={DISPLAY}>{t}</text>)}
      <text x="28" y={last + 24} fontSize="12" fill={c.ink} opacity=".78" fontFamily="'Hanken Grotesk Variable',sans-serif">Football player cards</text>
      <rect x="24" y="294" width="212" height="76" rx="20" fill={u("panel")} stroke="#fff" strokeOpacity=".55" strokeWidth="1.2"/>
      <path d="M44 295.5H216" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round"/>
      <text x="40" y="340" fontSize="21" fontWeight="700" fill={c.ink} fontFamily={DISPLAY}>Series 2026</text>
      <circle cx="203" cy="332" r="24" fill="#f6f5ee" fillOpacity=".92" stroke="#fff" strokeWidth="1.5"/>
      <path d="M203 318l11 8.2-4.2 12.8h-13.6L192 326.2z" fill="#1a1400"/>
      <path d="M203 318v-5.5M214 326.2l6.4-2.7M209.8 339l4.6 6.4M196.2 339l-4.6 6.4M192 326.2l-6.4-2.7" stroke="#1a1400" strokeWidth="2.4" strokeLinecap="round"/>
      <rect x="14.75" y="40" width="230.5" height="340" fill="none" stroke={u("rim")} strokeWidth="1.5"/>
    </g>
  );
  return (
    <svg width={width} viewBox="0 0 260 420" role="img" aria-label={`${name} artwork`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={g("face")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.light}/><stop offset=".5" stopColor={c.face}/><stop offset="1" stopColor={c.dark}/></linearGradient>
        <linearGradient id={g("crimpT")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.light}/><stop offset="1" stopColor={c.dark}/></linearGradient>
        <linearGradient id={g("crimpB")} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={c.dark}/><stop offset="1" stopColor={c.face}/></linearGradient>
        <linearGradient id={g("shade")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.dark} stopOpacity=".05"/><stop offset="1" stopColor={c.dark} stopOpacity=".75"/></linearGradient>
        <linearGradient id={g("holo")} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#6ef5ff" stopOpacity="0"/><stop offset=".3" stopColor="#7dffd8" stopOpacity=".26"/><stop offset=".5" stopColor="#ffffff" stopOpacity=".34"/><stop offset=".7" stopColor="#ff9bf0" stopOpacity=".24"/><stop offset="1" stopColor="#ffe27a" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={g("glare")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55"/><stop offset="1" stopColor="#fff" stopOpacity=".04"/></linearGradient>
        <linearGradient id={g("panel")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".38"/><stop offset="1" stopColor="#fff" stopOpacity=".12"/></linearGradient>
        <linearGradient id={g("rim")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".95"/><stop offset=".45" stopColor="#fff" stopOpacity=".12"/><stop offset="1" stopColor="#fff" stopOpacity=".5"/></linearGradient>
        {torn && <>
          <clipPath id={g("top")}><path d={`M-40 -60 H300 V76 ${pts} H-40 Z`}/></clipPath>
          <clipPath id={g("bot")}><path d={`M-40 480 H300 V76 ${pts} H-40 Z`}/></clipPath>
        </>}
      </defs>
      {torn ? (
        <>
          <g clipPath={u("bot")} className="pk-body">{art}</g>
          <g clipPath={u("top")} className="pk-top">{art}</g>
        </>
      ) : art}
    </svg>
  );
}
