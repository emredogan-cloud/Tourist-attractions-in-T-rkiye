import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL?.startsWith("http") ? process.env.APP_URL : "http://localhost:3000",
  ),
  title: { default: "Türkiye Tourism", template: "%s · Türkiye Tourism" },
  description: "Discover every notable tourist attraction in Türkiye in two languages.",
  applicationName: "Türkiye Tourism",
  authors: [{ name: "Türkiye Tourism" }],
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
