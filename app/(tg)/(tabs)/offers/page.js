// FILE: app/(tg)/(tabs)/offers/page.js
import { I } from "@/components/Icons";
export default function Page() {
  return (
    <div className="empty">
      <div className="empty-art">{I.tag}</div>
      <h2 style={{ color: "#fff", marginBottom: 6 }}>No offers right now</h2>
      <p style={{ margin: 0 }}>Special deals and limited-time packs will show up here.</p>
    </div>
  );
}