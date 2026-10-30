"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tg, haptic } from "@/lib/client";
import { I } from "./Icons";
export default function BackBar({ title, right }) {
  const router = useRouter();
  useEffect(() => {
    const b = tg()?.BackButton; if (!b) return;
    const h = () => router.back();
    b.show(); b.onClick(h);
    return () => { b.offClick(h); b.hide(); };
  }, [router]);
  return (
    <div className="top">
      <div className="row gap">
        <button className="icon-btn" aria-label="Back" onClick={() => { haptic(); router.back(); }}>{I.back}</button>
        <h2>{title}</h2>
      </div>
      {right}
    </div>
  );
}
