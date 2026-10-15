/** תאריכים בהדגמת היומן: מפתח יום (YYYY-MM-DD) בשעון ישראל, תאריך עברי דרך Intl, וניסוחים קצרים. */
const TZ = "Asia/Jerusalem";

export function todayKey(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}`;
}

export function shiftDayKey(dayKey: string, days: number): string {
  const d = new Date(dayKey + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

/** 0 = ראשון … 6 = שבת */
export function weekday(dayKey: string): number {
  return new Date(dayKey + "T00:00:00Z").getUTCDay();
}

/** ראשון של אותו שבוע (השבוע הישראלי מתחיל ביום ראשון). */
export function weekStartKey(dayKey: string): string {
  return shiftDayKey(dayKey, -weekday(dayKey));
}

export const WEEKDAY_LETTERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
export const WEEKDAY_NAMES = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];

const noon = (dayKey: string) => new Date(dayKey + "T12:00:00");

/** מספר ← אותיות עבריות (גימטריה), עם גרשיים. למשל 15 ← ט״ו, 5787 ← תשפ״ז (בלי האלפים). */
function gematria(n: number): string {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
  let v = n % 1000;
  let out = hundreds[Math.floor(v / 100)];
  v %= 100;
  if (v === 15) out += "טו";
  else if (v === 16) out += "טז";
  else out += tens[Math.floor(v / 10)] + ones[v % 10];
  if (out.length === 1) return out + "׳";
  return out.slice(0, -1) + "״" + out.slice(-1);
}

/** למשל: כ״ד בתשרי תשפ״ז. אם הדפדפן לא תומך בלוח העברי, מחזיר מחרוזת ריקה. */
export function hebrewDate(dayKey: string): string {
  try {
    const parts = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric", month: "long", year: "numeric" }).formatToParts(noon(dayKey));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const day = Number(get("day"));
    const year = Number(get("year"));
    const month = get("month");
    if (!day || !year || !month) return "";
    return `${gematria(day)} ב${month} ${gematria(year)}`;
  } catch {
    return "";
  }
}

/** למשל: 15.10 */
export function shortDate(dayKey: string): string {
  const [, m, d] = dayKey.split("-");
  return `${Number(d)}.${Number(m)}`;
}

/** למשל: יום רביעי, 15.10 */
export function longDate(dayKey: string): string {
  return `${WEEKDAY_NAMES[weekday(dayKey)]}, ${shortDate(dayKey)}`;
}

/** ניסוח יחסי של תאריך יעד: היום, מחר, באיחור, או שם היום בשבוע. */
export function dueLabel(due: string | null, today: string): { text: string; late: boolean } {
  if (!due) return { text: "בלי תאריך", late: false };
  const diff = daysBetween(today, due);
  if (diff === 0) return { text: "היום", late: false };
  if (diff === 1) return { text: "מחר", late: false };
  if (diff === -1) return { text: "אתמול", late: true };
  if (diff < 0) return { text: `באיחור ${-diff} ימים`, late: true };
  if (diff < 7) return { text: WEEKDAY_NAMES[weekday(due)], late: false };
  return { text: shortDate(due), late: false };
}

export function greeting(now: Date = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: false }).format(now));
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  return "ערב טוב";
}
