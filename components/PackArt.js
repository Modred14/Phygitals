// FILE: components/PackArt.js
// Foil pouch pack artwork: flat off-white foil body, colour-coded crimped ends, a big "FOOTBALL / TIER" title,
// a football, and frosted-glass panels (label pill, ball disc, info strip, logo tile).
// Colour is flat on purpose: the only gradient-free "depth" comes from translucent white layers, thin rims and soft shadows.
// 3D: the pouch tilts toward the pointer (CSS perspective, see .pk3d in globals.css) and the glass layers shift at different depths (parallax).
// Geometry (viewBox, crimps, tear line at y~76-86, pk-body / pk-top classes) is unchanged so the shake -> tear animation still works.
import { useId, useRef } from "react";

const PACKS = {
  legend: { accent: "#c8962a", name: "Legend", words: "LEGEND" },
  "ballon-dor": { accent: "#12805c", name: "Ballon d'Or", words: "BALLON D'OR" },
  prime: { accent: "#d64541", name: "Prime", words: "PRIME" },
  superstar: { accent: "#2563eb", name: "Superstar", words: "SUPERSTAR" },
};
const FOIL = "#ebeae6";
const INK = "#14151a";
const SANS = "var(--font-bricolage),Arial,sans-serif";

// zig-zag edge points from x=260 to x=0 (shared by both halves of a torn pack)
const TEAR = Array.from({ length: 22 }, (_, i) => [260 - i * 12, i % 2 ? 86 : 76]).concat([[0, 76]]);
const pts = TEAR.map(([x, y]) => `L${x} ${y}`).join(" ");
const crimp = (y0, y1, up) => { let d = `M14 ${up ? y1 : y0}`; d += ` V${up ? y0 + 8 : y1 - 8}`; for (let x = 14; x < 246; x += 10) d += ` L${x + 5} ${up ? y0 : y1} L${x + 10} ${up ? y0 + 8 : y1 - 8}`; return `${d} V${up ? y1 : y0} Z`; };

// football geometry (flat, no gradients)
const BX = 130, BY = 240, BR = 50, K = BR / 54;
const rad = (d) => (d * Math.PI) / 180;
const pent = (cx, cy, r, rot) => Array.from({ length: 5 }, (_, i) => [cx + r * Math.cos(rad(rot + i * 72)), cy + r * Math.sin(rad(rot + i * 72))]);
const poly = (p) => `M${p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const centre = pent(BX, BY, 16 * K, -90);
const outer = Array.from({ length: 5 }, (_, k) => { const a = -90 + 72 * k; return pent(BX + 57 * K * Math.cos(rad(a)), BY + 57 * K * Math.sin(rad(a)), 19 * K, a + 180); });
const seams = centre.map(([x, y], k) => { const a = rad(-90 + 72 * k); return `M${x.toFixed(1)} ${y.toFixed(1)}L${(BX + 38 * K * Math.cos(a)).toFixed(1)} ${(BY + 38 * K * Math.sin(a)).toFixed(1)}`; }).join("");

const par = (x, y) => ({ transform: `translate(calc(var(--nx,0)*${x}px),calc(var(--ny,0)*${y}px))` });

export default function PackArt({ slug, name, width = 260, torn = false }) {
  const uid = useId().replace(/:/g, "");
  const g = (k) => `${k}-${uid}`, u = (k) => `url(#${g(k)})`;
  const c = PACKS[slug] ?? PACKS.superstar;
  const box = useRef(null);
  const move = (e) => { const el = box.current; if (!el || e.pointerType === "touch") return; const r = el.getBoundingClientRect(); const cl = (v) => Math.max(-1, Math.min(1, v)); el.classList.add("live"); el.style.setProperty("--nx", cl(((e.clientX - r.left) / r.width - 0.5) * 2)); el.style.setProperty("--ny", cl(((e.clientY - r.top) / r.height - 0.5) * 2)); };
  const leave = () => { const el = box.current; if (!el) return; el.classList.remove("live"); el.style.removeProperty("--nx"); el.style.removeProperty("--ny"); };
  const fs = Math.min(54, 208 / (c.words.length * 0.72));
  const art = (
    <g>
      {/* crimped ends: flat colour, foil ridges */}
      <path d={crimp(10, 40, true)} fill={c.accent}/>
      <path d={crimp(380, 410, false)} fill={c.accent}/>
      <path d="M14 24H246M14 30H246M14 36H246" stroke="#fff" strokeOpacity=".3" strokeWidth="1.4"/>
      <path d="M14 386H246M14 392H246M14 398H246" stroke="#fff" strokeOpacity=".3" strokeWidth="1.4"/>
      <path d="M14 40H246" stroke="#fff" strokeOpacity=".6" strokeWidth="1.5"/>
      <path d="M14 380H246" stroke="#000" strokeOpacity=".12" strokeWidth="1.5"/>

      {/* thickness: offset shadow edge behind the pouch */}
      <rect x="18" y="46" width="232" height="340" rx="2" fill="#000" opacity=".32" filter={u("soft")}/>
      <rect x="14" y="40" width="232" height="340" fill="#b9b8b2"/>

      {/* foil body */}
      <rect x="14" y="40" width="231" height="339" fill={FOIL}/>
      <rect x="14" y="40" width="9" height="340" fill="#000" opacity=".05"/>
      <rect x="237" y="40" width="9" height="340" fill="#000" opacity=".06"/>
      <polygon points="14,340 246,292 246,380 14,380" fill="#000" opacity=".045"/>
      <rect x="14" y="40" width="232" height="340" filter={u("grain")} opacity=".5"/>

      <polygon points="14,40 128,40 14,178" fill="#fff" opacity=".16"/>

      {/* title */}
      <g style={par(-2, -1.5)}>
      <rect x="40" y="52" width="180" height="20" rx="10" fill="#fff" fillOpacity=".5" stroke="#fff" strokeOpacity=".85" strokeWidth="1"/>
      <text x="130" y="65.5" textAnchor="middle" fontSize="8.6" fontWeight="700" letterSpacing="1.5" fill={INK} fillOpacity=".8" fontFamily={SANS}>FOOTBALL TRADING CARDS</text>
      <text x="26" y="124" fontSize="50" fontWeight="500" fill={INK} fontFamily={SANS} textLength="208" lengthAdjust="spacingAndGlyphs">FOOTBALL</text>
      <text x="26" y={124 + fs * 0.92} fontSize={fs} fontWeight="800" fontStyle="italic" fill={c.accent} fontFamily={SANS}>{c.words}</text>

      </g>

      {/* ball on a frosted glass disc */}
      <g style={par(-6, -5)}>
      <ellipse cx={BX} cy="298" rx="42" ry="5" fill="#000" opacity=".28" filter={u("soft")}/>
      <circle cx={BX} cy={BY} r="62" fill="#fff" fillOpacity=".3" stroke="#fff" strokeOpacity=".8" strokeWidth="1.2"/>
      <path d={`M${BX - 44} ${BY - 43}A62 62 0 0 1 ${BX + 26} ${BY - 57}`} fill="none" stroke="#fff" strokeOpacity=".95" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx={BX} cy={BY} r={BR} fill="#fbfbf9"/>
      <g clipPath={u("ball")}>
        <path d={poly(centre)} fill={INK}/>
        {outer.map((p, i) => <path key={i} d={poly(p)} fill={INK}/>)}
        <path d={seams} stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        <path d={circ(BX, BY, BR) + circ(BX - 10, BY - 10, BR)} fill="#000" fillOpacity=".11" fillRule="evenodd"/>
        <ellipse cx={BX - 16} cy={BY - 24} rx="12" ry="5.5" transform={`rotate(-35 ${BX - 16} ${BY - 24})`} fill="#fff" fillOpacity=".7"/>
      </g>
      <circle cx={BX} cy={BY} r={BR} fill="none" stroke={INK} strokeOpacity=".5" strokeWidth="1.2"/>

      </g>

      {/* glass info strip */}
      <g style={par(-10, -7)}>
      <rect x="24" y="312" width="212" height="58" rx="18" fill="#fff" fillOpacity=".42" stroke="#fff" strokeOpacity=".9" strokeWidth="1.2"/>
      <path d="M44 313.2H216" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="40" cy="333" r="3.2" fill={c.accent}/>
      <text x="48" y="338" fontSize="21" fontWeight="600" fill={INK} fontFamily={SANS}>{c.name}</text>
      <text x="40" y="354" fontSize="8.6" fontWeight="500" fill={INK} fillOpacity=".6" fontFamily={SANS}>www.phygitals.com</text>
      <rect x="188" y="320" width="40" height="42" rx="12" fill="#fff" fillOpacity=".78" stroke="#fff" strokeWidth="1"/>
      <path transform="translate(198.5 327) scale(.8)" fillRule="evenodd" fill={INK} d="M0 0H15Q24 0 24 9V13Q24 22 15 22H9V32H0ZM9 7V15H14Q15 15 15 14V8Q15 7 14 7Z"/>

      </g>

      {/* moving glare (flat blurred shape, no gradient) */}
      <g clipPath={u("face")}><ellipse cx="130" cy="130" rx="60" ry="46" fill="#fff" opacity=".34" filter={u("glare")} style={{ transform: "translate(calc(var(--nx,-.4)*70px),calc(var(--ny,-.5)*80px))" }}/></g>

      {/* lit rim */}
      <rect x="14.75" y="40.75" width="230.5" height="338.5" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.5"/>
    </g>
  );
  const svg = (
    <svg width={width} viewBox="0 0 260 420" role="img" aria-label={`${name} artwork`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <filter id={g("soft")} x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="4"/></filter>
        <filter id={g("grain")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .16 0"/>
        </filter>
        <filter id={g("glare")} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>
        <clipPath id={g("face")}><rect x="14" y="40" width="232" height="340"/></clipPath>
        <clipPath id={g("ball")}><circle cx={BX} cy={BY} r={BR}/></clipPath>
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
  if (torn) return svg;
  return (
    <div ref={box} className="pk3d" style={{ width }} onPointerMove={move} onPointerLeave={leave}>
      <div className="pk3d-in">{svg}</div>
    </div>
  );
}