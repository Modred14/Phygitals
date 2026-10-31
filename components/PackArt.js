// FILE: components/PackArt.js
// Original foil-pack artwork (no third-party IP). Colours per pack slug.
const THEMES = {
  legend: ["#f7e7a1", "#c9a227", "#1a1a1a", "LEGEND", "rgba(242,193,78,.45)"],
  "ballon-dor": ["#f4efe6", "#b88a2e", "#2a1d05", "BALLON D'OR", "rgba(226,190,120,.42)"],
  prime: ["#ff9a90", "#b71c1c", "#ffffff", "PRIME", "rgba(255,90,80,.42)"],
  superstar: ["#8ec5ff", "#1565c0", "#ffffff", "SUPERSTAR", "rgba(80,160,255,.45)"],
};
export const packGlow = (slug) => (THEMES[slug] ?? THEMES.superstar)[4];

export default function PackArt({ slug, name, width = 260 }) {
  const [a, b, ink, title] = THEMES[slug] ?? THEMES.superstar;
  const id = `g-${slug}`;
  return (
    <svg width={width} viewBox="0 0 260 420" role="img" aria-label={`${name} artwork`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a}/><stop offset=".55" stopColor="#fff" stopOpacity=".88"/><stop offset="1" stopColor={b}/></linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={b}/><stop offset=".5" stopColor={a}/><stop offset="1" stopColor={b}/></linearGradient>
        <clipPath id={`cp-${slug}`}><rect x="14" y="52" width="232" height="316"/></clipPath>
        <pattern id={`ln-${slug}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="none"/><rect width="1.2" height="6" fill="#fff" opacity=".13"/></pattern>
      </defs>
      <path d="M14 10h232l-6 8 6 8-6 8 6 8-6 8H14l6-8-6-8 6-8-6-8z" fill={`url(#${id}-f)`}/>
      <rect x="14" y="52" width="232" height="316" fill={`url(#${id})`}/>
      <rect x="14" y="52" width="232" height="316" fill={`url(#ln-${slug})`}/>
      <path d="M14 394h232l-6-8 6-8-6-8 6-8-6-8H14l6 8-6 8 6 8-6 8z" fill={`url(#${id}-f)`}/>
      <rect x="14" y="52" width="232" height="316" fill="none" stroke="#fff" strokeOpacity=".5"/>
      <text x="130" y="92" textAnchor="middle" fontSize="10.5" letterSpacing="3.2" fill={ink} opacity=".75" fontFamily="sans-serif">FOOTBALL PLAYER CARDS</text>
      <text x="130" y="142" textAnchor="middle" fontSize={title.length > 8 ? 29 : 40} fontWeight="900" fill={ink} fontStyle="italic" fontFamily="sans-serif">{title}</text>
      <g transform="translate(130 246)">
        <circle r="82" fill={ink} opacity=".08"/>
        <circle r="76" fill="#fff" stroke={ink} strokeWidth="5"/>
        <path d="M0-30 28-9 17 24h-34L-28-9z" fill={ink}/>
        <path d="M0-30v-44M28-9l42-14M17 24l26 36M-17 24l-26 36M-28-9l-42-14" stroke={ink} strokeWidth="5"/>
      </g>
      <text x="26" y="352" fontSize="19" fill={ink} fontFamily="sans-serif" opacity=".9">{name.replace(" Pack", "")}</text>
      <g clipPath={`url(#cp-${slug})`}><g transform="skewX(-18)"><rect className="pack-shine" x="-60" y="40" width="64" height="340" fill="#fff" opacity=".42"/></g></g>
    </svg>
  );
}