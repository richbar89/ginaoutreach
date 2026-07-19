import type { Config } from "tailwindcss";

// SF-first system stack — renders SF Pro on Apple devices, Segoe/Roboto elsewhere.
const SYSTEM_STACK = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"SF Pro Display"',
  '"SF Pro Text"',
  '"Helvetica Neue"',
  '"Segoe UI"',
  "Roboto",
  "sans-serif",
];

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    SYSTEM_STACK,
        display: SYSTEM_STACK,
        serif:   SYSTEM_STACK,
      },
      keyframes: {
        fadeSlideUp: {
          "0%":   { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-slide-up": "fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in":       "fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "scale-in":      "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      colors: {
        // Single vivid accent — used sparingly, everything else stays neutral
        coral: {
          50:  "#FFF4EE",
          100: "#FDE7D9",
          200: "#FAC5A8",
          300: "#F49B6E",
          400: "#F07844",
          500: "#E8622A",
          600: "#D14E1D",
          700: "#B03F14",
          800: "#8A300F",
          900: "#5C1F09",
        },
        // Secondary accent — success ticks and highlights only
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
        // Apple ink + gray ramp — text, borders, chrome
        navy: {
          50:  "#F5F5F7",
          100: "#E8E8ED",
          200: "#D2D2D7",
          300: "#AEAEB2",
          400: "#86868B",
          500: "#6E6E73",
          600: "#48484B",
          700: "#3A3A3D",
          800: "#2D2D30",
          900: "#1D1D1F",
        },
        // Neutral canvas ramp — page and card surfaces
        cream: {
          50:  "#FBFBFD",
          100: "#F5F5F7",
          200: "#E8E8ED",
          300: "#D2D2D7",
        },
      },
    },
  },
  plugins: [],
};
export default config;
