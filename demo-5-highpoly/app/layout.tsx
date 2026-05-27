import type { Metadata } from "next";
import { Cinzel, Barlow, Barlow_Condensed, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-share-tech-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "iRun Control Center · Johor-Commercial-1160",
  description:
    "2.5D isometric command center for PV plant operations. Ten specialized AI agents coordinating in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${barlow.variable} ${barlowCondensed.variable} ${shareTechMono.variable}`}
    >
      <body className="font-body bg-base text-text-primary antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
