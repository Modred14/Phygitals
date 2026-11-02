// FILE: app/(tg)/(tabs)/template.js
// Only the page content animates. TopBar and BottomNav live in layout.js, OUTSIDE this element, so the nav stays truly fixed
// (an animated/transformed ancestor would turn `position: fixed` into "fixed relative to that ancestor").
export default function Template({ children }) { return <main className="enter">{children}</main>; }