"use client";
import { useMe } from "@/components/AuthProvider";
export default function Profile() {
  const { me } = useMe();
  return (
    <div className="card pad row gap" style={{ marginTop: 8 }}>
      <span className="avatar">{(me.user.firstName ?? "?")[0]}</span>
      <div><b>{me.user.firstName ?? "Player"}</b><div className="mut">{me.user.username ? `@${me.user.username}` : "Telegram account"}</div></div>
    </div>
  );
}
