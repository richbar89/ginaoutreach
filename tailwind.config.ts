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
        // Warm orange — primary accent (base44-inspired)
        coral: {
          50:  "#FEF5F0",
          100: "#FDE8DC",
          200: "#FAC9B0",
          300: "#F7A882",
          400: "#F08050",
          500: "#E8622A",
          600: "#CC4F1A",
          700: "#A83D10",
          800: "#7A2C0B",
          900: "#4F1B05",
        },
        // Charcoal — text, borders, UI
        navy: {
          50:  "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111111",
        },
        // Soft blue-gray — subtle backgrounds and surfaces
        cream: {
          50:  "#F0F5F8",
          100: "#E2ECF2",
          200: "#C5D9E3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
