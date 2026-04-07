import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "@/components/Sidebar";
import AnnouncementBanner from "@/components/AnnouncementBanner";

export const metadata: Metadata = {
  title: "Collabi",
  description: "Empowering creators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className="antialiased"
          style={{ minHeight: "100vh", padding: "20px" }}
        >
          <div
            className="flex overflow-hidden"
            style={{
              height: "calc(100vh - 40px)",
              borderRadius: "20px",
              boxShadow:
                "0 2px 2px rgba(0,0,0,0.04), 0 6px 12px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.10), 0 48px 72px rgba(0,0,0,0.07)",
              overflow: "hidden",
            }}
          >
            <Sidebar />
            <main
              className="flex-1 flex flex-col overflow-hidden"
              style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(2px)" }}
            >
              <AnnouncementBanner />
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
