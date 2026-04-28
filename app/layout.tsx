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
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=block" rel="stylesheet" />
        </head>
        <body className="antialiased">
          <AppShell>{children}</AppShell>
          <CookieBanner />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
