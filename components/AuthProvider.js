"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setToken, tg } from "@/lib/client";
import Landing from "./Landing";

const Ctx = createContext(null);
export const useMe = () => useContext(Ctx);

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", me: null });
  const refresh = useCallback(async () => {
    const me = await api("/api/me");
    setState({ status: "ready", me });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wait briefly for the Telegram script to attach.
      for (let i = 0; i < 20 && !tg(); i++) await new Promise((r) => setTimeout(r, 100));
      const w = tg();
      if (!w?.initData) return !cancelled && setState({ status: "no-telegram", me: null }); // never fake auth
      try {
        w.ready(); w.expand();
        w.setHeaderColor?.("#0a0a0a"); w.setBackgroundColor?.("#0a0a0a");
        const { token } = await api("/api/auth/telegram", { method: "POST", body: JSON.stringify({ initData: w.initData, ref: new URLSearchParams(window.location.search).get("ref") ?? undefined }) });
        setToken(token);
        if (!cancelled) await refresh();
      } catch { if (!cancelled) setState({ status: "error", me: null }); }
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  if (state.status === "loading") return <div className="page"><div className="skel" style={{ height: 60 }} /><div className="skel" style={{ height: 380, marginTop: 20 }} /></div>;
  if (state.status !== "ready") return <Landing error={state.status === "error"} />;
  return <Ctx.Provider value={{ ...state, refresh }}>{children}</Ctx.Provider>;
}
