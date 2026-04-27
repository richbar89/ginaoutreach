import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import AppShell from "@/components/AppShell";
import CookieBanner from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Collabi",
  description: "The outreach platform built for influencers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          <AppShell>{children}</AppShell>
          <CookieBanner />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
