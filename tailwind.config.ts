import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Tema hitam & gold — padan logo surau
        surau: {
          DEFAULT: "#b8860b", // gold (butang & aksen)
          dark: "#8c6608",    // gold gelap (hover)
          light: "#d4af37",   // gold cerah
        },
        hitam: {
          DEFAULT: "#111111",
          soft: "#1c1c1c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
