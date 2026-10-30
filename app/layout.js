import Script from "next/script";
import "./globals.css";

export const metadata = { title: process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs", robots: { index: false } };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0a0a0a" };

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
