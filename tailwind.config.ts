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
        // Sage green — primary accent throughout the app
        coral: {
          50:  "#F5F9EE",
          100: "#E8F3D5",
          200: "#CFE4AA",
          300: "#B3D47E",
          400: "#A0C172",
          500: "#8AAD58",
          600: "#6E9140",
          700: "#547030",
          800: "#3D5122",
          900: "#283617",
        },
        // Warm dark — text, borders, UI
        navy: {
          50:  "#F8F9F7",
          100: "#F0F2EC",
          200: "#DDE3D5",
          300: "#BFC9B4",
          400: "#94A385",
          500: "#6B7A5C",
          600: "#505D44",
          700: "#3A4531",
          800: "#262E20",
          900: "#171E12",
        },
        // Light sage — backgrounds and surfaces
        cream: {
          50:  "#F6FAF0",
          100: "#EBF4DF",
          200: "#D5E9BE",
        },
      },
    },
  },
  plugins: [],
};
export default config;
