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
        sans:    ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        serif:   ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        // Warm terracotta — primary accent
        coral: {
          50:  "#FEF5F0",
          100: "#FDE8DC",
          200: "#FAC9B0",
          300: "#F0A882",
          400: "#E08E6A",
          500: "#D4795C",
          600: "#BF6849",
          700: "#9E5238",
          800: "#7A3C28",
          900: "#4F2518",
        },
        // Teal — secondary accent
        teal: {
          50:  "#F0FAFA",
          100: "#CCEFEC",
          200: "#99DED9",
          300: "#66CDC5",
          400: "#4BBFB0",
          500: "#35AFA0",
          600: "#278F82",
          700: "#1E6E64",
          800: "#164E47",
          900: "#0E302C",
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
        // Warm cream — card backgrounds, surfaces
        cream: {
          50:  "#FDFAF7",
          100: "#FBF7F2",
          200: "#F5EFE6",
          300: "#EDE8E1",
        },
      },
    },
  },
  plugins: [],
};
export default config;
