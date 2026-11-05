// FILE: app/layout.js
import Script from "next/script";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/800-italic.css";
import "@fontsource-variable/hanken-grotesk/index.css";
import "./globals.css";

export const metadata = { title: process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs", robots: { index: false } };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0b3d2e" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}