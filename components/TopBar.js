// FILE: components/TopBar.js
"use client";
import Link from "next/link";
import { useMe } from "./AuthProvider";
import Money from "./Money";
import { I } from "./Icons";
export default function TopBar() {
  const { me } = useMe();
  return (
    <div className="top">
      <div className="brand">{process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs"}</div>
      <Link href="/wallet" className="pill" aria-label="Open wallet" style={{ textDecoration: "none", color: "inherit" }}>
        <Money cents={me.balanceCents} /><span className="plus">{I.plus}</span>
      </Link>
    </div>
  );
}