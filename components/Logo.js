// FILE: components/Logo.js
// Phygitals mark: a flat mint tile holding a geometric "P" (the same P used on the pack artwork)
// plus a small square "pixel" under the bowl, the digital half of physical + digital. No gradients.
export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label="Phygitals" style={{ display: "block" }}>
      <rect width="32" height="32" rx="9" fill="#8fdcb8" />
      <path fillRule="evenodd" fill="#05221a" transform="translate(8.1 5.4) scale(.66)" d="M0 0H15Q24 0 24 9V13Q24 22 15 22H9V32H0ZM9 7V15H14Q15 15 15 14V8Q15 7 14 7Z" />
      <rect x="17.4" y="21.4" width="4.6" height="4.6" rx="1.1" fill="#05221a" />
    </svg>
  );
}

export default function Logo({ size = 32, wordmark = true, name }) {
  const label = name ?? process.env.NEXT_PUBLIC_APP_NAME ?? "Phygitals";
  return (
    <div className="brand">
      <LogoMark size={size} />
      {wordmark && <span>{label}</span>}
    </div>
  );
}
