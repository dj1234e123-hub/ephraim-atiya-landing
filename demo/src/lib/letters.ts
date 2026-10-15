// מספר → אותיות עבריות בלי גרש ("טו", "מב", "קנ") — לפרקים ולטווחי פסוקים. קטן ובלי תלויות,
// כדי שרכיבי דפדפן יוכלו להשתמש בו בלי למשוך את טבלת הפרשות (lib/parshaTable.ts).
const L: Array<[number, string]> = [
  [400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"],
  [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"],
  [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"],
];

export function letters(n: number): string {
  let rest = n;
  let out = "";
  while (rest > 0) {
    if (rest % 100 === 15) { out += "טו"; rest -= 15; continue; }
    if (rest % 100 === 16) { out += "טז"; rest -= 16; continue; }
    const [v, ch] = L.find(([v]) => v <= rest)!;
    out += ch;
    rest -= v;
  }
  return out;
}


/** עם גרש/גרשיים לתצוגה: 'מ״ב', 'א׳'. */
export function heNumber(n: number): string {
  const l = letters(n);
  return l.length === 1 ? `${l}׳` : `${l.slice(0, -1)}״${l.slice(-1)}`;
}

// אותיות → מספר (26.9.2026, אפרים: "הוא נותן לי מספרים ולא אותיות כמו שקראתי"): "מב", "מ״ב", "מ"ב", "קנ".
// ספרות נשארות ספרות. אות לא מוכרת → null.
const V: Record<string, number> = Object.fromEntries(L.map(([v, ch]) => [ch, v]));
Object.assign(V, { ך: 20, ם: 40, ן: 50, ף: 80, ץ: 90 });

export function parseChapter(input: string): number | null {
  const s = input.trim().replace(/[׳״'"\s.־-]/g, "");
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  let n = 0;
  for (const ch of s) {
    const v = V[ch];
    if (!v) return null;
    n += v;
  }
  return n;
}
