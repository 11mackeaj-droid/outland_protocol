import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outland Protocol",
  description: "Survivor shelter strategy game",
  applicationName: "Outland Protocol",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Outland" },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased overflow-hidden"><div className="h-dvh w-screen overflow-hidden">{children}</div></body>
    </html>
  );
}
