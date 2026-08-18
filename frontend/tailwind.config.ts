import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: "#07080A",
        darksec: "#0B0D10",
        darksurf: "#101318",
        darkelev: "#151920",
        lightbg: "#FFFFFF",
        lightsec: "#F8FAFC",
        lightsurf: "#F1F5F9",
        lightelev: "#E2E8F0",
      },
    },
  },
  plugins: [],
};
export default config;
