import type { Metadata } from "next";
import "./globals.css";
import { Comfortaa } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AppShell from "@/components/AppShell";
import CookieBanner from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/next";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  title: "Collabi",
  description: "The outreach platform built for influencers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={comfortaa.variable}>
        <body className={`antialiased ${comfortaa.className}`}>
          <AppShell>{children}</AppShell>
          <CookieBanner />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
