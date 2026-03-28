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
          background: "#4A6B2E",
          minHeight: "100vh",
          padding: "20px",
        }}
      >
        {/* Floating app window */}
        <div
          className="flex overflow-hidden"
          style={{
            height: "calc(100vh - 40px)",
            borderRadius: "20px",
            boxShadow:
              "0 2px 2px rgba(0,0,0,0.05), 0 6px 12px rgba(0,0,0,0.08), 0 20px 40px rgba(0,0,0,0.14), 0 48px 72px rgba(0,0,0,0.10)",
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
