// FILE: app/(tg)/template.js
// A template re-mounts on every navigation, so each screen eases in.
export default function Template({ children }) { return <div className="enter">{children}</div>; }