// FILE: components/PackArt.js
// Flat foil-pack artwork: solid colour blocks, crimped ends, pitch markings. No gradients. Original design (no third-party IP).
const PACKS = {
  legend: { face: "#ffd23f", dark: "#d9a900", ink: "#1a1400", lines: ["LEGEND"] },
  "ballon-dor": { face: "#f3f1e8", dark: "#c9c5b2", ink: "#0b3d2e", lines: ["BALLON", "D'OR"] },
  prime: { face: "#e5484d", dark: "#b53539", ink: "#fff4ef", lines: ["PRIME"] },
  superstar: { face: "#2f6fed", dark: "#2456bd", ink: "#f3f6ff", lines: ["SUPER", "STAR"] },
};
const DISPLAY = "'Barlow Condensed','Arial Narrow',sans-serif";

// zig-zag edge points from x=260 to x=0 (shared by both halves of a torn pack)
const TEAR = Array.from({ length: 22 }, (_, i) => [260 - i * 12, i % 2 ? 86 : 76]).concat([[0, 76]]);
const pts = TEAR.map(([x, y]) => `L${x} ${y}`).join(" ");
const crimp = (y0, y1, up) => { let d = `M14 ${up ? y1 : y0}`; d += ` V${up ? y0 + 8 : y1 - 8}`; for (let x = 14; x < 246; x += 10) d += ` L${x + 5} ${up ? y0 : y1} L${x + 10} ${up ? y0 + 8 : y1 - 8}`; return `${d} V${up ? y1 : y0} Z`; };

export default function PackArt({ slug, name, width = 260, torn = false }) {
  const c = PACKS[slug] ?? PACKS.superstar, n = c.lines.length, last = 100 + (n - 1) * 58;
  const art = (
    <g>
      <path d={crimp(10, 40, true)} fill={c.dark}/>
      <path d={crimp(380, 410, false)} fill={c.dark}/>
      <rect x="14" y="40" width="232" height="340" fill={c.face}/>
      <circle cx="130" cy="236" r="66" fill="none" stroke={c.ink} strokeOpacity=".16" strokeWidth="2"/>
      <rect x="14" y="235" width="232" height="2" fill={c.ink} opacity=".16"/>
      <polygon points="14,318 246,262 246,380 14,380" fill={c.dark}/>
      {c.lines.map((t, i) => <text key={t} x="26" y={100 + i * 58} fontSize="64" fontWeight="800" fontStyle="italic" fill={c.ink} fontFamily={DISPLAY}>{t}</text>)}
      <text x="28" y={last + 24} fontSize="12" fill={c.ink} opacity=".75" fontFamily="'Hanken Grotesk Variable',sans-serif">Football player cards</text>
      <text x="28" y="362" fontSize="19" fontWeight="700" fill={c.ink} fontFamily={DISPLAY}>Series 2026</text>
      <circle cx="204" cy="330" r="26" fill="#f3f1e8"/>
      <path d="M204 316l12 9-4.5 14h-15L192 325z" fill="#1a1400"/>
      <path d="M204 316v-6M216 325l7-3M211.5 339l5 7M196.5 339l-5 7M192 325l-7-3" stroke="#1a1400" strokeWidth="2.5" strokeLinecap="round"/>
    </g>
  );
  return (
    <svg width={width} viewBox="0 0 260 420" role="img" aria-label={`${name} artwork`} style={{ display: "block", overflow: "visible" }}>
      {torn ? (
        <>
          <defs>
            <clipPath id={`top-${slug}`}><path d={`M-40 -60 H300 V76 ${pts} H-40 Z`}/></clipPath>
            <clipPath id={`bot-${slug}`}><path d={`M-40 480 H300 V76 ${pts} H-40 Z`}/></clipPath>
          </defs>
          <g clipPath={`url(#bot-${slug})`} className="pk-body">{art}</g>
          <g clipPath={`url(#top-${slug})`} className="pk-top">{art}</g>
        </>
      ) : art}
    </svg>
  );
}