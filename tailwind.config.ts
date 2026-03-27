import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Urbanist", "system-ui", "sans-serif"],
        serif: ["Urbanist", "system-ui", "sans-serif"],
        display: ["Urbanist", "system-ui", "sans-serif"],
      },
      colors: {
        // Blue — primary accent throughout the app
        coral: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        // Slate — text, borders, UI
        navy: {
          50:  "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        // Light blue-gray — backgrounds and surfaces
        cream: {
          50:  "#F7F9FF",
          100: "#EEF2FF",
          200: "#DDE5F5",
        },
      },
    },
  },
  plugins: [],
};
export default config;
