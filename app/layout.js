// FILE: app/layout.js
import Script from "next/script";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata = { title: process.env.NEXT_PUBLIC_APP_NAME ?? "Football Packs", robots: { index: false } };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#05221a" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}