// FILE: components/PlayerCard.js
// Flat jersey-style collector cards. Solid colour blocks, pitch markings, condensed numerals. No gradients. Generic archetype names only.
import { cardIdentity, rarityOf } from "@/lib/cards";
export { cardIdentity, rarityOf };

const DISPLAY = "'Barlow Condensed','Arial Narrow',sans-serif";
const SANS = "'Hanken Grotesk Variable',sans-serif";
const PAL = {
  epic: { face: "#14110a", ink: "#ffd23f", jersey: "#ffd23f", trim: "#14110a", num: "#14110a", bar: "#ffd23f", barInk: "#14110a", line: "#ffd23f", label: "Epic" },
  rare: { face: "#ffd23f", ink: "#1a1400", jersey: "#0b3d2e", trim: "#ffd23f", num: "#ffd23f", bar: "#1a1400", barInk: "#ffd23f", line: "#1a1400", label: "Rare" },
  common: { face: "#f3f1e8", ink: "#0b3d2e", jersey: "#1f7a5a", trim: "#f3f1e8", num: "#f3f1e8", bar: "#165c43", barInk: "#f3f1e8", line: "#0b3d2e", label: "Common" },
};

export default function PlayerCard({ rarity = "common", name, number, pos }) {
  const p = PAL[rarity] ?? PAL.common;
  return (
    <svg viewBox="0 0 200 290" width="100%" role="img" aria-label={`${p.label} card: ${name}`} style={{ display: "block" }}>
      <rect width="200" height="290" rx="16" fill={p.face}/>
      <circle cx="100" cy="150" r="60" fill="none" stroke={p.line} strokeOpacity=".16" strokeWidth="2"/>
      <rect y="149" width="200" height="2" fill={p.line} opacity=".16"/>
      <text x="16" y="64" fontSize="58" fontWeight="800" fontStyle="italic" fill={p.ink} fontFamily={DISPLAY}>{number}</text>
      <text x="18" y="84" fontSize="16" fontWeight="700" fill={p.ink} fontFamily={DISPLAY} letterSpacing=".6">{pos}</text>
      <rect x="120" y="16" width="64" height="22" rx="11" fill={p.ink}/>
      <text x="152" y="31.5" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={p.face} fontFamily={SANS}>{p.label}</text>
      <path d="M62 124L88 112Q100 130 112 112L138 124L164 152L144 170L132 158V234H68V158L56 170L36 152Z" fill={p.jersey}/>
      <path d="M88 112Q100 130 112 112" fill="none" stroke={p.trim} strokeWidth="5" strokeLinecap="round"/>
      <path d="M38 154L55 168M162 154L145 168" stroke={p.trim} strokeWidth="7" strokeLinecap="round"/>
      <text x="100" y="214" textAnchor="middle" fontSize="56" fontWeight="800" fontStyle="italic" fill={p.num} fontFamily={DISPLAY}>{number}</text>
      <path d="M0 246H200V274a16 16 0 0 1-16 16H16A16 16 0 0 1 0 274Z" fill={p.bar}/>
      <text x="100" y="275" textAnchor="middle" fontSize="22" fontWeight="800" fontStyle="italic" fill={p.barInk} fontFamily={DISPLAY} letterSpacing=".5">{name.toUpperCase()}</text>
    </svg>
  );
}

export function CardBack() {
  const brand = (process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs").toUpperCase();
  return (
    <svg viewBox="0 0 200 290" width="100%" aria-hidden="true" style={{ display: "block" }}>
      <rect width="200" height="290" rx="16" fill="#0f4a37"/>
      <rect x="8" y="8" width="184" height="274" rx="11" fill="none" stroke="#f3f1e8" strokeOpacity=".4" strokeWidth="1.5"/>
      <circle cx="100" cy="145" r="52" fill="none" stroke="#f3f1e8" strokeOpacity=".5" strokeWidth="2"/>
      <rect x="8" y="144" width="184" height="2" fill="#f3f1e8" opacity=".5"/>
      <circle cx="100" cy="145" r="9" fill="#ffd23f"/>
      <text x="100" y="262" textAnchor="middle" fontSize="20" fontWeight="800" fontStyle="italic" fill="#f3f1e8" fontFamily={DISPLAY} letterSpacing="1">{brand}</text>
    </svg>
  );
}