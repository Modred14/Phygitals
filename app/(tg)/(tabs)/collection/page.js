"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { fmt } from "@/lib/format";
export default function Collection() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api("/api/openings").then((d) => setRows(d.openings)).catch(() => setRows([])); }, []);
  if (!rows) return <div className="skel" style={{ height: 300 }} />;
  if (!rows.length) return <div className="empty"><h2 style={{ color: "#fff" }}>No pulls yet</h2><p>Packs you open will appear here.</p></div>;
  return (
    <div className="card"><h2 style={{ padding: "16px 18px 4px" }}>Pack history</h2>
      {rows.map((o) => (
        <div key={o.id} className="rowline"><div><b>{o.pack}</b>{o.testMode && <span className="tag">TEST</span>}<div className="mut" style={{ fontSize: 13 }}>{o.tierLabel} · {new Date(o.createdAt).toLocaleString()}</div></div><div style={{ textAlign: "right" }}><b className="acc">{fmt(o.rewardCents)}</b><div className="mut" style={{ fontSize: 12 }}>paid {fmt(o.priceCents)}</div></div></div>
      ))}
    </div>
  );
}
