// FILE: components/Icons.js
const P = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
export const I = {
  packs: <svg {...P}><path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/></svg>,
  grid: <svg {...P}><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>,
  tag: <svg {...P}><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/></svg>,
  gift: <svg {...P}><rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8c-2-4-6-3-5 0 .5 1.5 5 0 5 0zm0 0c2-4 6-3 5 0-.5 1.5-5 0-5 0z"/></svg>,
  user: <svg {...P}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>,
  back: <svg {...P}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  copy: <svg {...P}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>,
  share: <svg {...P}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/></svg>,
  send: <svg {...P}><path d="m21 3-9 18-2-8-8-2z"/></svg>,
  bank: <svg {...P}><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>,
  refresh: <svg {...P}><path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/></svg>,
  users: <svg {...P}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3-5 6.5-5s6 1.5 6.5 5M16 5a3.5 3.5 0 0 1 0 6.5M18 15c2 .5 3.3 2 3.5 5"/></svg>,
  chev: <svg {...P}><path d="m6 9 6 6 6-6"/></svg>,
  right: <svg {...P}><path d="m9 6 6 6-6 6"/></svg>,
  wallet: <svg {...P}><path d="M4 7a2 2 0 0 1 2-2h12v4M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14" r="1"/></svg>,
  shield: <svg {...P}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/></svg>,
  plus: <svg {...P}><path d="M12 5v14M5 12h14"/></svg>,
};