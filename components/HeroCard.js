"use client";
import { useState } from "react";

// Original illustrated footballer. If /public/hero.jpg exists (your own licensed image) it is shown on top instead.
export default function HeroCard() {
  const [custom, setCustom] = useState(true);
  return (
    <div className="herocard" aria-hidden="true">
      <svg viewBox="0 0 220 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="hc-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f4a3a"/><stop offset="1" stopColor="#0d1411"/></linearGradient>
          <radialGradient id="hc-glow" cx=".5" cy=".38" r=".6"><stop offset="0" stopColor="#3ddc97" stopOpacity=".35"/><stop offset="1" stopColor="#3ddc97" stopOpacity="0"/></radialGradient>
        </defs>
        <rect width="220" height="300" fill="url(#hc-bg)"/>
        <rect width="220" height="300" fill="url(#hc-glow)"/>
        <text x="110" y="190" textAnchor="middle" fontSize="150" fontWeight="900" fill="#ffffff" opacity=".06" fontFamily="sans-serif">10</text>
        <g fill="#0b0f0d" stroke="#3ddc97" strokeWidth="1.5" strokeLinejoin="round">
          <circle cx="112" cy="78" r="17"/>
          <path d="M96 100c-18 4-30 18-34 40l10 6 12-22v36l-6 44h60l-6-44v-36l12 22 10-6c-4-22-16-36-34-40z"/>
          <path d="M92 188l-10 70h20l10-52 10 52h20l-10-70z"/>
          <path d="M80 258h26v10H76zM114 258h26l4 10h-30z"/>
        </g>
        <circle cx="152" cy="262" r="12" fill="#fff" stroke="#3ddc97" strokeWidth="1.5"/>
        <path d="M152 254l6 5-2 8h-8l-2-8z" fill="#0b0f0d"/>
      </svg>
      {custom && /* eslint-disable-next-line @next/next/no-img-element */ <img src="/hero.jpg" alt="" onError={() => setCustom(false)} />}
    </div>
  );
}
