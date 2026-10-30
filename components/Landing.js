export default function Landing({ error }) {
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs";
  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="brand" style={{ textAlign: "center" }}>{name}</div>
      <div className="hero" aria-hidden="true"><div className="card" style={{ width: 220, height: 300, background: "linear-gradient(160deg,#1d3a2f,#0f0f0f)" }} /></div>
      <h2 style={{ textAlign: "center", fontSize: 30 }}>Collect football stars.</h2>
      <p className="mut" style={{ textAlign: "center" }}>{error ? "We couldn't verify your Telegram session. Reopen the app from the bot." : "Open this app from Telegram to sign in securely."}</p>
      <a className="btn" style={{ textDecoration: "none", marginTop: 16 }} href={`https://t.me/${bot}`}>Open in Telegram</a>
      <p className="mut" style={{ textAlign: "center", fontSize: 12, marginTop: 20 }}>Must be 18+ to continue. Odds are shown before every purchase.</p>
    </div>
  );
}
