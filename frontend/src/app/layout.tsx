import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { APP_CONFIG } from "@/lib/app-config";
import Script from "next/script";

const displayFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_CONFIG.branding.orgName} - Officials Lookup`,
  description: APP_CONFIG.branding.headerSubtitle,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.css"
        />
      </head>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} antialiased`}
      >
        <Script
          src="https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
