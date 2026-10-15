import type { Config } from "tailwindcss";

/**
 * צבעי המותג — שלושה בלבד.
 * כחול לילה: ראשי, רקעים. זהב: הדגשה בלבד (כפתורים, סלוגן, קווים דקים), לעולם לא כרקע מלא.
 * שמנת: רקע בהיר וטקסט על כחול.
 */
export const brand = {
  navy: "#14213D",
  gold: "#C9A24A",
  goldDeep: "#A57B2C", // זהב על רקע בהיר
  cream: "#F6F1E7",
} as const;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: brand.navy,
        gold: {
          DEFAULT: brand.gold,
          deep: brand.goldDeep,
        },
        cream: brand.cream,
      },
      fontFamily: {
        title: ['"Frank Ruhl Libre"', "serif"],
        body: ["Heebo", "sans-serif"],
        latin: ['"Cormorant Garamond"', "serif"],
      },
      maxWidth: {
        page: "72rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 33, 61, 0.06), 0 12px 32px -16px rgba(20, 33, 61, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
