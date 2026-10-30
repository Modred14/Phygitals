// Original foil-pack artwork (no third-party IP). Colours per pack slug.
const THEMES = {
  legend: ["#f7e7a1", "#c9a227", "#1a1a1a", "LEGEND"],
  "ballon-dor": ["#f4efe6", "#b88a2e", "#2a1d05", "BALLON D'OR"],
  prime: ["#ff8a80", "#b71c1c", "#fff", "PRIME"],
  superstar: ["#8ec5ff", "#1565c0", "#fff", "SUPERSTAR"],
};
export default function PackArt({ slug, name, width = 260 }) {
  const [a, b, ink, title] = THEMES[slug] ?? THEMES.superstar;
  const id = `g-${slug}`;
  return (
    <svg width={width} viewBox="0 0 260 420" role="img" aria-label={`${name} artwork`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a}/><stop offset=".55" stopColor="#fff" stopOpacity=".85"/><stop offset="1" stopColor={b}/></linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={b}/><stop offset="1" stopColor={a}/></linearGradient>
      </defs>
      <path d="M14 10h232l-6 8 6 8-6 8 6 8-6 8H14l6-8-6-8 6-8-6-8z" fill={`url(#${id}-f)`}/>
      <rect x="14" y="52" width="232" height="316" fill={`url(#${id})`}/>
      <path d="M14 394h232l-6-8 6-8-6-8 6-8-6-8H14l6 8-6 8 6 8-6 8z" fill={`url(#${id}-f)`}/>
      <text x="130" y="92" textAnchor="middle" fontSize="11" letterSpacing="3" fill={ink} opacity=".8" fontFamily="sans-serif">FOOTBALL PLAYER CARDS</text>
      <text x="130" y="140" textAnchor="middle" fontSize={title.length > 8 ? 30 : 40} fontWeight="900" fill={ink} fontStyle="italic" fontFamily="sans-serif">{title}</text>
      <g transform="translate(130 245)">
        <circle r="78" fill="#fff" stroke={ink} strokeWidth="5"/>
        <path d="M0-30 28-9 17 24h-34L-28-9z" fill={ink}/>
        <path d="M0-30v-44M28-9l42-14M17 24l26 36M-17 24l-26 36M-28-9l-42-14" stroke={ink} strokeWidth="5"/>
      </g>
      <text x="26" y="350" fontSize="20" fill={ink} fontFamily="sans-serif">{name.replace(" Pack", "")}</text>
    </svg>
  );
}
