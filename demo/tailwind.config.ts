import type { Config } from "tailwindcss";

/** צבעי המותג של אפרים עטיה, כמו בדף הנחיתה. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#14213D",
        gold: { DEFAULT: "#C9A24A", deep: "#A57B2C" },
        cream: "#F6F1E7",
        ok: "#3F7D4E",
        warn: "#B4532A",
      },
      fontFamily: {
        title: ['"Frank Ruhl Libre"', "serif"],
        body: ["Heebo", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(20,33,61,.06), 0 10px 24px -14px rgba(20,33,61,.25)" },
    },
  },
  plugins: [],
} satisfies Config;
