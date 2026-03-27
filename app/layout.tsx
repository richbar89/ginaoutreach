import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "GinaOS",
  description: "Creator outreach suite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{
          background: "linear-gradient(135deg, #E8C9CF 0%, #DEC6E2 45%, #C6C8E6 100%)",
          minHeight: "100vh",
          padding: "12px",
        }}
      >
        {/* Floating app window */}
        <div
          className="flex overflow-hidden"
          style={{
            height: "calc(100vh - 24px)",
            borderRadius: "16px",
            boxShadow:
              "0 1px 1px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.10), 0 40px 64px rgba(0,0,0,0.06)",
            border: "1px solid rgba(255,255,255,0.6)",
            overflow: "hidden",
          }}
        >
          <Sidebar />
          <main
            className="flex-1 overflow-y-auto"
            style={{ background: "var(--blush)" }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
