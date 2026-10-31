// FILE: components/Money.js
"use client";
import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/format";

// Animated currency. Tweens integer cents (no float money). `initial={0}` counts up on first paint.
export default function Money({ cents, initial, duration = 800, className, style }) {
  const [shown, setShown] = useState(initial ?? cents);
  const cur = useRef(initial ?? cents);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || cur.current === cents) { cur.current = cents; setShown(cents); return; }
    const a = cur.current, start = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration), e = 1 - Math.pow(1 - p, 4);
      cur.current = Math.round(a + (cents - a) * e); setShown(cur.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cents, duration]);
  return <span className={`money ${className ?? ""}`} style={style}>{fmt(shown)}</span>;
}