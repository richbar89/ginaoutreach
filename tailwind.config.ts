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
        sans: ["DM Sans", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
      colors: {
        coral: {
          50:  "#fef3f0",
          100: "#fde6e0",
          200: "#fbc5b8",
          300: "#f79d8a",
          400: "#f0735d",
          500: "#e8715a",
          600: "#d4533a",
          700: "#b03d28",
          800: "#8c2f1c",
          900: "#682212",
        },
        // Warm stone/charcoal — replaces cool blue navy across entire app
        navy: {
          50:  "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        cream: {
          50:  "#FAF9F7",
          100: "#F4F1EC",
          200: "#EAE4DC",
        },
      },
    },
  },
  plugins: [],
};
export default config;
