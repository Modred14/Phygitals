// FILE: components/PlayerCard.js
// Original illustrated "graded slab" player cards. Names are generic archetypes, never real people.
import { cardIdentity, rarityOf } from "@/lib/cards";
export { cardIdentity, rarityOf };

const PAL = {
  epic: { a: "#f2c14e", b: "#4a3a12", c: "#14100a", label: "EPIC", stars: 5 },
  rare: { a: "#3ee0a0", b: "#12392b", c: "#0b1311", label: "RARE", stars: 4 },
  common: { a: "#9fb0b8", b: "#1f2a2e", c: "#0d1011", label: "COMMON", stars: 3 },
};

export default function PlayerCard({ rarity = "common", name, number, pos }) {
  const p = PAL[rarity], id = `pc-${rarity}`;
  return (
    <svg viewBox="0 0 200 290" width="100%" role="img" aria-label={`${p.label} card: ${name}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.b}/><stop offset="1" stopColor={p.c}/></linearGradient>
        <radialGradient id={`${id}-gl`} cx=".5" cy=".42" r=".6"><stop offset="0" stopColor={p.a} stopOpacity=".42"/><stop offset="1" stopColor={p.a} stopOpacity="0"/></radialGradient>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".16"/><stop offset=".4" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#fff" stopOpacity=".05"/></linearGradient>
      </defs>
      <rect x="2" y="2" width="196" height="286" rx="15" fill="#171c1d" stroke="#fff" strokeOpacity=".18" strokeWidth="1.5"/>
      <rect x="12" y="12" width="176" height="46" rx="7" fill="#f2f0ea"/>
      <text x="22" y="29" fontSize="8" fontWeight="800" letterSpacing="1.4" fill="#1a1d1c" fontFamily="sans-serif">FOOTBALL PACKS</text>
      <text x="22" y="42" fontSize="9" fill="#444" fontFamily="sans-serif">{pos} · No. {number}</text>
      <text x="22" y="53" fontSize="7" letterSpacing="1" fill="#777" fontFamily="sans-serif">COLLECTOR SERIES</text>
      <rect x="128" y="20" width="54" height="30" rx="6" fill={p.b} stroke={p.a} strokeWidth="1.2"/>
      <text x="155" y="39" textAnchor="middle" fontSize="9" fontWeight="800" fill={p.a} fontFamily="sans-serif">{p.label}</text>
      <rect x="18" y="66" width="164" height="208" rx="10" fill={`url(#${id}-bg)`} stroke={p.a} strokeOpacity=".55"/>
      <rect x="18" y="66" width="164" height="208" rx="10" fill={`url(#${id}-gl)`}/>
      <text x="100" y="205" textAnchor="middle" fontSize="92" fontWeight="900" fill="#fff" opacity=".06" fontFamily="sans-serif">{number}</text>
      <g transform="translate(10.4 28) scale(.8)" fill="#0b0f0d" stroke={p.a} strokeWidth="1.8" strokeLinejoin="round">
        <circle cx="112" cy="78" r="17"/>
        <path d="M96 100c-18 4-30 18-34 40l10 6 12-22v36l-6 44h60l-6-44v-36l12 22 10-6c-4-22-16-36-34-40z"/>
        <path d="M92 188l-10 70h20l10-52 10 52h20l-10-70z"/>
        <path d="M80 258h26v10H76zM114 258h26l4 10h-30z"/>
      </g>
      <text x="30" y="96" fontSize="22" fontWeight="900" fill={p.a} fontFamily="sans-serif">{number}</text>
      <text x="30" y="108" fontSize="9" fontWeight="700" fill="#fff" opacity=".8" letterSpacing="1" fontFamily="sans-serif">{pos}</text>
      <text x="170" y="94" textAnchor="end" fontSize="10" fill={p.a} fontFamily="sans-serif">{"★".repeat(p.stars)}</text>
      <path d="M18 244h164v20a10 10 0 0 1-10 10H28a10 10 0 0 1-10-10z" fill="#000" opacity=".5"/>
      <text x="100" y="264" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#fff" letterSpacing=".3" fontFamily="sans-serif">{name.toUpperCase()}</text>
      <rect x="2" y="2" width="196" height="286" rx="15" fill={`url(#${id}-sh)`}/>
    </svg>
  );
}