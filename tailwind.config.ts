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
        sans: ["Nunito", "system-ui", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
      },
      colors: {
        // Dusty rose — primary accent throughout the app
        coral: {
          50:  "#FCF3F5",
          100: "#F9E6EA",
          200: "#F2C9D1",
          300: "#E8A4B0",
          400: "#D97A8A",
          500: "#C96878",
          600: "#B04D5E",
          700: "#8F3A4A",
          800: "#752F3D",
          900: "#5E2633",
        },
        // Warm rosewood — replaces navy across entire app (all text, borders, UI)
        navy: {
          50:  "#FAF7F6",
          100: "#F3EDEB",
          200: "#E5D8D4",
          300: "#D0BAB4",
          400: "#B39389",
          500: "#916F64",
          600: "#6F524A",
          700: "#503C36",
          800: "#35261F",
          900: "#1E1410",
        },
        // Soft blush ivory — backgrounds and surfaces
        cream: {
          50:  "#FBF8F6",
          100: "#F5EDE8",
          200: "#EDD9D0",
        },
      },
    },
  },
  plugins: [],
};
export default config;
