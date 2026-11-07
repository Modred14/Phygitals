// FILE: components/PlayerCard.js
// Jersey-style collector cards. Solid rarity colour under a glass finish (curved gloss, lit rim), pitch markings, condensed numerals. Generic archetype names only.
import { useId } from "react";
import { cardIdentity, rarityOf } from "@/lib/cards";
import { LogoMark } from "./Logo";
export { cardIdentity, rarityOf };

const DISPLAY = "var(--font-sans),sans-serif";
const SANS = "var(--font-sans),sans-serif";
const PAL = {
  epic: { face: "#07120e", ink: "#8fdcb8", jersey: "#8fdcb8", trim: "#07120e", num: "#07120e", bar: "#8fdcb8", barInk: "#07120e", line: "#8fdcb8", label: "Epic" },
  rare: { face: "#0f4a37", ink: "#e9fff4", jersey: "#05221a", trim: "#0f4a37", num: "#8fdcb8", bar: "#05221a", barInk: "#8fdcb8", line: "#8fdcb8", label: "Rare" },
  common: { face: "#f3f1e8", ink: "#0b3d2e", jersey: "#1f7a5a", trim: "#f3f1e8", num: "#f3f1e8", bar: "#165c43", barInk: "#f3f1e8", line: "#0b3d2e", label: "Common" },
};

const Finish = ({ uid, h = 290, r = 16 }) => (
  <>
    <rect x=".75" y=".75" width="198.5" height={h - 1.5} rx={r - .5} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5"/>
  </>
);

export default function PlayerCard({ rarity = "common", name, number, pos }) {
  const p = PAL[rarity] ?? PAL.common, uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 290" width="100%" role="img" aria-label={`${p.label} card: ${name}`} style={{ display: "block" }}>
      <rect width="200" height="290" rx="16" fill={p.face}/>
      <circle cx="100" cy="150" r="60" fill="none" stroke={p.line} strokeOpacity=".16" strokeWidth="2"/>
      <rect y="149" width="200" height="2" fill={p.line} opacity=".16"/>
      <text x="16" y="64" fontSize="58" fontWeight="800" fill={p.ink} fontFamily={DISPLAY}>{number}</text>
      <text x="18" y="84" fontSize="16" fontWeight="700" fill={p.ink} fontFamily={DISPLAY} letterSpacing=".6">{pos}</text>
      <rect x="120" y="16" width="64" height="22" rx="11" fill={p.ink}/>
      <text x="152" y="31.5" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={p.face} fontFamily={SANS}>{p.label}</text>
      <path d="M62 124L88 112Q100 130 112 112L138 124L164 152L144 170L132 158V234H68V158L56 170L36 152Z" fill={p.jersey}/>
      <path d="M88 112Q100 130 112 112" fill="none" stroke={p.trim} strokeWidth="5" strokeLinecap="round"/>
      <path d="M38 154L55 168M162 154L145 168" stroke={p.trim} strokeWidth="7" strokeLinecap="round"/>
      <text x="100" y="214" textAnchor="middle" fontSize="56" fontWeight="800" fill={p.num} fontFamily={DISPLAY}>{number}</text>
      <path d="M0 246H200V274a16 16 0 0 1-16 16H16A16 16 0 0 1 0 274Z" fill={p.bar}/>
      <text x="100" y="275" textAnchor="middle" fontSize="22" fontWeight="800" fill={p.barInk} fontFamily={DISPLAY} letterSpacing=".5">{name.toUpperCase()}</text>
      <Finish uid={uid} />
    </svg>
  );
}

export function CardBack() {
  const uid = useId().replace(/:/g, "");
  const brand = (process.env.NEXT_PUBLIC_APP_NAME ?? "Phygitals").toUpperCase();
  return (
    <svg viewBox="0 0 200 290" width="100%" aria-hidden="true" style={{ display: "block" }}>
      <rect width="200" height="290" rx="16" fill="#14684c"/>
      <rect x="8" y="8" width="184" height="274" rx="11" fill="none" stroke="#f3f1e8" strokeOpacity=".4" strokeWidth="1.5"/>
      <circle cx="100" cy="145" r="52" fill="none" stroke="#f3f1e8" strokeOpacity=".5" strokeWidth="2"/>
      <rect x="8" y="144" width="184" height="2" fill="#f3f1e8" opacity=".5"/>
      <g transform="translate(76 121) scale(1.5)"><LogoMark size={32} /></g>
      <text x="100" y="262" textAnchor="middle" fontSize="20" fontWeight="800" fill="#f3f1e8" fontFamily={DISPLAY} letterSpacing="1">{brand}</text>
      <Finish uid={uid} />
    </svg>
  );
}