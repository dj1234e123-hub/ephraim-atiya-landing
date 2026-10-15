import { PARSHA_TABLE, type ParshaRow } from "./parshaTable";
import { shiftDayKey } from "./dates";
import { letters } from "./letters";

export { letters };

// פרשת השבוע לשניים מקרא (23.9.2026). מקור: טבלה סטטית לארץ ישראל (lib/parshaTable.ts, נוצרת
// מ-hebcal ע"י scripts/gen-parsha.mjs). שבוע = ראשון–שבת. כשהשבת עצמה חג (סוכות, שמחת תורה, פסח…)
// אין פרשה באותה שבת — מציגים את הפרשה הבאה, "לקראת", כי אליה מתכוננים. שרת בלבד (הטבלה גדולה).

export interface WeekParsha {
  name: string;
  niqqud: string;
  shabbat: string;
  /** true = זו הפרשה של השבת הזאת; false = השבת חג, וזו הפרשה הבאה. */
  thisShabbat: boolean;
  /** מתי קוראים אותה, כשהיא לא הפרשה של השבת הזאת ("לקראת שמחת תורה" / "לקראת השבת הבאה"). */
  note?: string;
  /** שבע העליות: "ראשון" … "שביעי", והטווח באותיות ("א:א–ב:ג"). */
  aliyot: Array<{ name: string; range: string; book: string }>;
}

const ALIYA_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שביעי"];
function verse(cv: string): string {
  const [c, v] = cv.split(":").map(Number);
  return `${letters(c)}:${letters(v)}`;
}

// וזאת הברכה אינה פרשה של שבת — קוראים אותה בשמחת תורה, ושם מתחילים בראשית. לכן בשבועות החג שלפני
// שבת בראשית (26.9.2026, אפרים: "עדיין לא התחלנו בראשית") מציגים אותה, ולא את בראשית. עליות לפי hebcal.
const VEZOT: ParshaRow[3] = [
  ["דברים", "33:1", "33:7"], ["דברים", "33:8", "33:12"], ["דברים", "33:13", "33:17"], ["דברים", "33:18", "33:21"],
  ["דברים", "33:22", "33:26"], ["דברים", "33:27", "33:29"], ["דברים", "34:1", "34:12"],
];

export function weekParsha(weekStart: string): WeekParsha | null {
  const shabbat = shiftDayKey(weekStart, 6);
  const row = PARSHA_TABLE.find((r) => r[0] >= shabbat);
  if (!row) return null;
  if (row[0] !== shabbat && row[1] === "בראשית") {
    return {
      name: "וזאת הברכה",
      niqqud: "וְזֹאת הַבְּרָכָה",
      shabbat: row[0],
      thisShabbat: false,
      note: "לקראת שמחת תורה",
      aliyot: VEZOT.map(([book, b, e], i) => ({ name: ALIYA_NAMES[i], book, range: `${verse(b)}–${verse(e)}` })),
    };
  }
  return {
    name: row[1],
    niqqud: row[2],
    shabbat: row[0],
    thisShabbat: row[0] === shabbat,
    aliyot: row[3].map(([book, b, e], i) => ({ name: ALIYA_NAMES[i], book, range: `${verse(b)}–${verse(e)}` })),
  };
}
