"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "./Icons";
const items = [["/", "Packs", I.packs], ["/collection", "Collection", I.grid], ["/offers", "Offers", I.tag], ["/rewards", "Rewards", I.gift], ["/profile", "Profile", I.user]];
export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {items.map(([href, label, icon]) => (
        <Link key={href} href={href} className={(href === "/" ? path === "/" : path.startsWith(href)) ? "on" : ""}>{icon}<span>{label}</span></Link>
      ))}
    </nav>
  );
}
