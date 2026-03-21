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
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      colors: {
        coral: {
          50: "#fef4f2",
          100: "#fde8e4",
          200: "#fbc9c1",
          300: "#f5a898",
          400: "#ef8070",
          500: "#e8715a",
          600: "#d4533a",
          700: "#b83d26",
          800: "#922f1d",
          900: "#6e2315",
        },
        navy: {
          50: "#f0f3f9",
          100: "#dde4f0",
          200: "#bfcce3",
          300: "#92a8ce",
          400: "#637fb5",
          500: "#445f9e",
          600: "#354b84",
          700: "#2c3d6b",
          800: "#1b2b4b",
          900: "#131f36",
        },
        cream: {
          50: "#fdf8f4",
          100: "#f9f0e8",
          200: "#f2e3d2",
        },
      },
    },
  },
  plugins: [],
};
export default config;
