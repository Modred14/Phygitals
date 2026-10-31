// FILE: components/BottomNav.js
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "./Icons";
import { haptic } from "@/lib/client";
const items = [["/", "Packs", I.packs], ["/collection", "Collection", I.grid], ["/offers", "Offers", I.tag], ["/rewards", "Rewards", I.gift], ["/profile", "Profile", I.user]];
export default function BottomNav() {
  const path = usePathname();
  const idx = Math.max(0, items.findIndex(([h]) => (h === "/" ? path === "/" : path.startsWith(h))));
  return (
    <nav className="nav" aria-label="Main">
      <span className="nav-ind" style={{ transform: `translateX(${idx * 100}%)` }} aria-hidden="true" />
      {items.map(([href, label, icon], i) => (
        <Link key={href} href={href} className={i === idx ? "on" : ""} aria-current={i === idx ? "page" : undefined} onClick={() => haptic("light")}>{icon}<span>{label}</span></Link>
      ))}
    </nav>
  );
}