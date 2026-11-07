// FILE: components/TopBar.js
"use client";
import Link from "next/link";
import { useMe } from "./AuthProvider";
import Money from "./Money";
import { I } from "./Icons";
import Logo from "./Logo";
export default function TopBar() {
  const { me } = useMe();
  return (
    <div className="top">
      <Logo />
      <Link href="/wallet" className="pill" aria-label="Open wallet" style={{ textDecoration: "none", color: "inherit" }}>
        <Money cents={me.balanceCents} /><span className="plus">{I.plus}</span>
      </Link>
    </div>
  );
}