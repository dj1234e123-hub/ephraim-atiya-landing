// לוח עברי ומועדים — דטרמיניסטי, בלי AI, בלי ספריות חיצוניות.
// ההמרה לועזי→עברי נעשית עם ה-ICU המובנה ב-Node (Intl, לוח "hebrew"); הרשימה של המועדים
// (כולל כללי הדחייה של צומות ושל יום הזיכרון/העצמאות) כתובה כאן במפורש.
// הפונקציות מקבלות מפתח יום (YYYY-MM-DD, גבול 04:00 כמו בכל המערכת) ומחזירות מידע קריא
// לאדם ולמאמן. שום דבר כאן לא נשמר ב-DB — מחושב בזמן קריאה, כמו moment_severity ו-stage.

const TZ = "Asia/Jerusalem";

export type HebMonth =
  | "tishrei" | "cheshvan" | "kislev" | "tevet" | "shevat" | "adar" | "adar1" | "adar2"
  | "nisan" | "iyar" | "sivan" | "tammuz" | "av" | "elul";

export type HolidayKind =
  | "yomtov" // יום טוב מהתורה — יום מנוחה
  | "cholhamoed"
  | "fast"
  | "national" // יום זיכרון / יום העצמאות / יום ירושלים / יום השואה
  | "minor" // חנוכה, פורים, ט"ו בשבט, ל"ג בעומר, ראש חודש...
  | "period"; // עשרת ימי תשובה, ספירת העומר, חודש אלול, בין המצרים

export interface HolidayEvent {
  name: string;
  kind: HolidayKind;
  /** יום מנוחה (שבת / יום טוב) — סביר שלא תהיה אינטראקציה עם האפליקציה */
  restDay: boolean;
}

export interface HebrewDayInfo {
  dayKey: string;
  day: number;
  month: HebMonth;
  monthName: string;
  year: number;
  /** למשל: כ"ח באלול תשפ"ו */
  label: string;
  /** 0 = ראשון ... 6 = שבת */
  weekday: number;
  isShabbat: boolean;
  /** מועדים שחלים היום (ביום עצמו, לפי התאריך העברי) */
  events: HolidayEvent[];
  /** מה נכנס הערב עם השקיעה (שבת / חג / צום שמתחיל בערב) */
  tonight: HolidayEvent[];
  /** יום מנוחה היום (שבת או יום טוב) */
  isRestDay: boolean;
}

// ---------------------------------------------------------------------------
// המרה לועזי → עברי דרך Intl
// ---------------------------------------------------------------------------

const MONTH_KEYS: Record<string, HebMonth> = {
  tishri: "tishrei",
  tishrei: "tishrei",
  heshvan: "cheshvan",
  cheshvan: "cheshvan",
  kislev: "kislev",
  tevet: "tevet",
  shevat: "shevat",
  adar: "adar",
  "adar i": "adar1",
  "adar ii": "adar2",
  nisan: "nisan",
  iyar: "iyar",
  sivan: "sivan",
  tamuz: "tammuz",
  tammuz: "tammuz",
  av: "av",
  elul: "elul",
};

export const HEB_MONTH_NAMES: Record<HebMonth, string> = {
  tishrei: "תשרי",
  cheshvan: "חשוון",
  kislev: "כסלו",
  tevet: "טבת",
  shevat: "שבט",
  adar: "אדר",
  adar1: "אדר א'",
  adar2: "אדר ב'",
  nisan: "ניסן",
  iyar: "אייר",
  sivan: "סיוון",
  tammuz: "תמוז",
  av: "אב",
  elul: "אלול",
};

// סדר החודשים משנה עברית (מתשרי) — לאומדן מרחק בימים בין שני תאריכים עבריים.
// בשנה מעוברת יש אדר א' ואדר ב'; בשנה רגילה אדר אחד (ICU מחזיר "Adar").
const MONTH_ORDER_PLAIN: HebMonth[] = [
  "tishrei", "cheshvan", "kislev", "tevet", "shevat", "adar",
  "nisan", "iyar", "sivan", "tammuz", "av", "elul",
];
const MONTH_ORDER_LEAP: HebMonth[] = [
  "tishrei", "cheshvan", "kislev", "tevet", "shevat", "adar1", "adar2",
  "nisan", "iyar", "sivan", "tammuz", "av", "elul",
];

function monthOrdinal(month: HebMonth, leap: boolean): number {
  if (leap) {
    const m = month === "adar" ? "adar2" : month;
    return MONTH_ORDER_LEAP.indexOf(m);
  }
  const m = month === "adar1" || month === "adar2" ? "adar" : month;
  return MONTH_ORDER_PLAIN.indexOf(m);
}

const hebFmt = new Intl.DateTimeFormat("en-u-ca-hebrew-nu-latn", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "short",
});

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

interface RawHeb {
  day: number;
  month: HebMonth;
  year: number;
  weekday: number;
}

function noonOf(dayKey: string): Date {
  // צהרי היום בישראל — רחוק מגבולות היום בשני הלוחות.
  return new Date(dayKey + "T12:00:00+03:00");
}

function toDayKey(d: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(d);
}

function rawHebrew(d: Date): RawHeb {
  const parts: Record<string, string> = {};
  for (const p of hebFmt.formatToParts(d)) parts[p.type] = p.value;
  const month = MONTH_KEYS[parts.month.toLowerCase()];
  if (!month) throw new Error(`unknown hebrew month from ICU: ${parts.month}`);
  return {
    day: parseInt(parts.day, 10),
    month,
    year: parseInt(parts.year, 10),
    weekday: WEEKDAYS[parts.weekday] ?? 0,
  };
}

/** אומדן "יום בשנה" (מתשרי) לצורך חיפוש — לא מדויק, רק לקפיצה קרובה */
function approxDayOfYear(year: number, month: HebMonth, day: number): number {
  return monthOrdinal(month, isLeapYear(year)) * 29.5 + day;
}

/** תאריך עברי → מפתח יום לועזי. חיפוש מהיר: אומדן ואז תיקון יום-יום (מרחק קטן). */
export function hebrewToDayKey(year: number, month: HebMonth, day: number): string {
  // תשרי מתחיל בסביבות ספטמבר של השנה הלועזית year-3761
  let cursor = new Date(Date.UTC(year - 3761, 8, 15, 12));
  for (let i = 0; i < 40; i++) {
    const h = rawHebrew(cursor);
    if (h.year === year && h.month === month && h.day === day) return toDayKey(cursor);
    let diff = approxDayOfYear(year, month, day) - approxDayOfYear(h.year, h.month, h.day);
    if (h.year !== year) diff += (year - h.year) * (isLeapYear(h.year) && year > h.year ? 384 : 354);
    if (diff === 0) diff = 1;
    // בתיקונים הקטנים האחרונים צועדים יום-יום כדי לא לקפוץ מעבר למטרה
    const step = Math.abs(diff) <= 3 ? Math.sign(diff) : Math.trunc(diff);
    cursor = new Date(cursor.getTime() + step * 86400000);
  }
  throw new Error(`hebrewToDayKey: could not resolve ${day} ${month} ${year}`);
}

function dayDiff(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(toKey + "T00:00:00Z") - Date.parse(fromKey + "T00:00:00Z")) / 86400000);
}

function weekdayOfHebrew(year: number, month: HebMonth, day: number): number {
  return rawHebrew(noonOf(hebrewToDayKey(year, month, day))).weekday;
}

function isLeapYear(year: number): boolean {
  return [0, 3, 6, 8, 11, 14, 17].includes(year % 19);
}

// ---------------------------------------------------------------------------
// גימטריה לתצוגה
// ---------------------------------------------------------------------------

const GEMATRIA: Array<[number, string]> = [
  [400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"],
  [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"],
  [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"],
];

export function gematria(n: number): string {
  let rest = n;
  let out = "";
  while (rest > 0) {
    if (rest === 15) { out += "טו"; break; }
    if (rest === 16) { out += "טז"; break; }
    const [v, ch] = GEMATRIA.find(([v]) => v <= rest)!;
    out += ch;
    rest -= v;
  }
  if (out.length === 1) return out + "'";
  return out.slice(0, -1) + '"' + out.slice(-1);
}

function yearLabel(year: number): string {
  return gematria(year % 1000);
}

// ---------------------------------------------------------------------------
// המועדים
// ---------------------------------------------------------------------------

function ev(name: string, kind: HolidayKind, restDay = false): HolidayEvent {
  return { name, kind, restDay };
}

/** אדר שבו חלים פורים ותענית אסתר: אדר רגיל, או אדר ב' בשנה מעוברת */
function purimMonth(year: number): HebMonth {
  return isLeapYear(year) ? "adar2" : "adar";
}

/** צום שנדחה משבת ליום ראשון (צום גדליה, י"ז בתמוז, תשעה באב) */
function postponedFast(year: number, month: HebMonth, day: number, actual: RawHeb): boolean {
  const wd = weekdayOfHebrew(year, month, day);
  if (wd === 6) return actual.month === month && actual.day === day + 1;
  return actual.month === month && actual.day === day;
}

function eventsFor(h: RawHeb, dayKey: string): HolidayEvent[] {
  const out: HolidayEvent[] = [];
  const { day, month, year } = h;

  // --- תשרי ---
  if (month === "tishrei") {
    if (day === 1 || day === 2) out.push(ev("ראש השנה", "yomtov", true));
    if (postponedFast(year, "tishrei", 3, h)) out.push(ev("צום גדליה", "fast"));
    if (day >= 3 && day <= 9) out.push(ev("עשרת ימי תשובה", "period"));
    if (day === 9) out.push(ev("ערב יום כיפור", "minor"));
    if (day === 10) out.push(ev("יום כיפור", "yomtov", true));
    if (day === 14) out.push(ev("ערב סוכות", "minor"));
    if (day === 15) out.push(ev("סוכות", "yomtov", true));
    if (day >= 16 && day <= 20) out.push(ev("חול המועד סוכות", "cholhamoed"));
    if (day === 21) out.push(ev("הושענא רבה", "cholhamoed"));
    if (day === 22) out.push(ev("שמיני עצרת ושמחת תורה", "yomtov", true));
  }

  // --- חנוכה: כ"ה בכסלו, שמונה ימים (כסלו יכול להיות 29 או 30 יום) ---
  if (month === "kislev" || month === "tevet") {
    const start = hebrewToDayKey(year, "kislev", 25);
    const n = dayDiff(start, dayKey) + 1;
    if (n >= 1 && n <= 8) out.push(ev(`חנוכה (נר ${n})`, "minor"));
  }
  if (month === "tevet" && day === 10) out.push(ev("עשרה בטבת", "fast"));
  if (month === "shevat" && day === 15) out.push(ev('ט"ו בשבט', "minor"));

  // --- פורים ---
  if (isLeapYear(year) && month === "adar1" && day === 14) out.push(ev("פורים קטן", "minor"));
  const pm = purimMonth(year);
  if (month === pm) {
    // תענית אסתר: י"ג באדר; אם חל בשבת — מוקדם ליום חמישי י"א
    const wd13 = weekdayOfHebrew(year, pm, 13);
    const fastDay = wd13 === 6 ? 11 : 13;
    if (day === fastDay) out.push(ev("תענית אסתר", "fast"));
    if (day === 14) out.push(ev("פורים", "minor"));
    if (day === 15) out.push(ev("שושן פורים", "minor"));
  }

  // --- ניסן ---
  if (month === "nisan") {
    if (day === 14) out.push(ev("ערב פסח", "minor"));
    if (day === 15) out.push(ev("פסח", "yomtov", true));
    if (day >= 16 && day <= 20) out.push(ev("חול המועד פסח", "cholhamoed"));
    if (day === 21) out.push(ev("שביעי של פסח", "yomtov", true));
    // יום השואה: כ"ז בניסן; שישי → חמישי כ"ו; ראשון → שני כ"ח
    const wd27 = weekdayOfHebrew(year, "nisan", 27);
    const shoah = wd27 === 5 ? 26 : wd27 === 0 ? 28 : 27;
    if (day === shoah) out.push(ev("יום הזיכרון לשואה ולגבורה", "national"));
  }

  // --- אייר ---
  if (month === "iyar") {
    // יום העצמאות: ה' באייר; שישי/שבת → חמישי שלפני; שני → שלישי ו'. יום הזיכרון — יום לפניו.
    const wd5 = weekdayOfHebrew(year, "iyar", 5);
    let atzmaut = 5;
    if (wd5 === 5) atzmaut = 4;
    else if (wd5 === 6) atzmaut = 3;
    else if (wd5 === 1) atzmaut = 6;
    if (day === atzmaut - 1) out.push(ev("יום הזיכרון לחללי מערכות ישראל", "national"));
    if (day === atzmaut) out.push(ev("יום העצמאות", "national"));
    if (day === 14) out.push(ev("פסח שני", "minor"));
    if (day === 18) out.push(ev('ל"ג בעומר', "minor"));
    if (day === 28) out.push(ev("יום ירושלים", "national"));
  }

  // --- ספירת העומר: ט"ז בניסן עד ה' בסיוון ---
  if (month === "nisan" || month === "iyar" || month === "sivan") {
    const omer = dayDiff(hebrewToDayKey(year, "nisan", 15), dayKey);
    if (omer >= 1 && omer <= 49) out.push(ev(`ספירת העומר — יום ${omer}`, "period"));
  }

  if (month === "sivan") {
    if (day === 5) out.push(ev("ערב שבועות", "minor"));
    if (day === 6) out.push(ev("שבועות", "yomtov", true));
  }

  // --- תמוז / אב ---
  if (month === "tammuz" && postponedFast(year, "tammuz", 17, h)) out.push(ev('צום י"ז בתמוז', "fast"));
  if ((month === "tammuz" && day >= 17) || (month === "av" && day <= 9)) out.push(ev("בין המצרים", "period"));
  if (month === "av") {
    if (postponedFast(year, "av", 9, h)) out.push(ev("תשעה באב", "fast"));
    if (day === 15) out.push(ev('ט"ו באב', "minor"));
  }

  // --- אלול ---
  if (month === "elul") {
    out.push(ev("חודש אלול", "period"));
    if (day === 29) out.push(ev("ערב ראש השנה", "minor"));
  }

  // --- ראש חודש (לא בתשרי; יום 30 של החודש הקודם וגם יום 1) ---
  if ((day === 1 && month !== "tishrei") || day === 30) {
    out.push(ev("ראש חודש", "minor"));
  }

  return out;
}

// ---------------------------------------------------------------------------
// API ציבורי
// ---------------------------------------------------------------------------

function baseInfo(dayKey: string): RawHeb & { label: string } {
  const h = rawHebrew(noonOf(dayKey));
  const label = `${gematria(h.day)} ב${HEB_MONTH_NAMES[h.month]} ${yearLabel(h.year)}`;
  return { ...h, label };
}

// קאש קטן: getPresence() עובר יום-יום אחורה, וכל יום מחושב פעם אחת בלבד לכל תהליך.
const infoCache = new Map<string, HebrewDayInfo>();

export function hebrewDayInfo(dayKey: string): HebrewDayInfo {
  const cached = infoCache.get(dayKey);
  if (cached) return cached;
  const info = computeHebrewDayInfo(dayKey);
  if (infoCache.size > 800) infoCache.clear();
  infoCache.set(dayKey, info);
  return info;
}

/** יום מנוחה (שבת או יום טוב) — לרצף הנוכחות ולתזכורות */
export function isRestDayKey(dayKey: string): boolean {
  return hebrewDayInfo(dayKey).isRestDay;
}

function computeHebrewDayInfo(dayKey: string): HebrewDayInfo {
  const h = baseInfo(dayKey);
  const events = eventsFor(h, dayKey);
  const isShabbat = h.weekday === 6;

  // מה נכנס הערב: שבת (ביום שישי), יום טוב או צום-לילה של מחר (יום כיפור, תשעה באב)
  const tomorrowKey = toDayKey(new Date(noonOf(dayKey).getTime() + 86400000));
  const tomorrowRaw = baseInfo(tomorrowKey);
  const tomorrowEvents = eventsFor(tomorrowRaw, tomorrowKey);
  const tonight: HolidayEvent[] = [];
  if (h.weekday === 5) tonight.push(ev("שבת", "yomtov", true));
  for (const e of tomorrowEvents) {
    if (e.kind === "yomtov") tonight.push(e);
    else if (e.name === "תשעה באב") tonight.push(e); // הצום היחיד מלבד יום כיפור שמתחיל בערב
    else if (e.name.startsWith("חנוכה (נר 1)")) tonight.push(ev("חנוכה — נר ראשון", "minor"));
    else if (e.name === "פורים") tonight.push(ev("ליל פורים", "minor"));
  }

  return {
    dayKey,
    day: h.day,
    month: h.month,
    monthName: HEB_MONTH_NAMES[h.month],
    year: h.year,
    label: h.label,
    weekday: h.weekday,
    isShabbat,
    events,
    tonight,
    isRestDay: isShabbat || events.some((e) => e.restDay),
  };
}

/** תיאור קצר לתצוגה (ליד התאריך): "שבת" / "ערב ראש השנה" / "חנוכה (נר 3)" / "" */
export function hebrewDayBadge(info: HebrewDayInfo): string {
  if (info.isShabbat) {
    const yt = info.events.find((e) => e.kind === "yomtov");
    return yt ? `שבת ו${yt.name}` : "שבת";
  }
  const priority: HolidayKind[] = ["yomtov", "fast", "cholhamoed", "national", "minor"];
  for (const kind of priority) {
    const e = info.events.find((x) => x.kind === kind);
    if (e) return e.name;
  }
  if (info.weekday === 5) return "ערב שבת";
  return "";
}

/** שורות הקשר למאמן — עובדתי, בלי הנחיות התנהגות (אלה ב-lib/coach.ts) */
export function describeHebrewDayForCoach(info: HebrewDayInfo): string {
  const parts: string[] = [];
  parts.push(`תאריך עברי: ${info.label}`);
  if (info.isShabbat) parts.push("היום שבת");
  const today = info.events.map((e) => e.name);
  if (today.length) parts.push(`מועדים היום: ${today.join(", ")}`);
  if (info.tonight.length) parts.push(`הערב עם השקיעה נכנס/ת: ${info.tonight.map((e) => e.name).join(", ")}`);
  return parts.join(". ") + ".";
}

// ---------------------------------------------------------------------------
// תצוגה כפולה (23.9.2026): אפרים — "שהיומן שלי יהיה בעיקר בעברית, שיהיה גם אפשר לראות לועזי".
// התאריך העברי ראשון, הלועזי אחריו וקטן יותר במשקל, והמועד (אם יש) בסוף. תצוגה בלבד —
// שום לוגיקה לא נשענת על המחרוזות האלה.
// ---------------------------------------------------------------------------

const WEEKDAY_LETTER = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] as const;

/** 'י"ב בתשרי' — בלי שנה. */
export function hebrewShort(dayKey: string): string {
  const i = hebrewDayInfo(dayKey);
  return `${gematria(i.day)} ב${i.monthName}`;
}

/** "22.9" */
export function gregorianShort(dayKey: string): string {
  const [, m, d] = dayKey.split("-").map(Number);
  return `${d}.${m}`;
}

/** המועד של היום לתצוגה, בלי "ערב שבת" (כל שבוע, לא מידע). "" כשאין. */
export function holidayName(dayKey: string): string {
  const badge = hebrewDayBadge(hebrewDayInfo(dayKey));
  return badge === "ערב שבת" ? "" : badge;
}

/**
 * 'יום ג׳, י"א בתשרי · 22.9 · יום כיפור' — עברי קודם, לועזי אחריו, מועד בסוף.
 * weekday: להוסיף "יום ג׳," בהתחלה. holiday: להוסיף את שם המועד (ברירת מחדל כן).
 */
export function dualDate(dayKey: string, opts: { weekday?: boolean; holiday?: boolean } = {}): string {
  const i = hebrewDayInfo(dayKey);
  const head = opts.weekday ? `יום ${WEEKDAY_LETTER[i.weekday]}, ` : "";
  const h = opts.holiday === false ? "" : holidayName(dayKey);
  return `${head}${hebrewShort(dayKey)} · ${gregorianShort(dayKey)}${h ? ` · ${h}` : ""}`;
}

/** טווח שבוע: 'ח׳–י"ד בתשרי · 20.9–26.9' (או על פני שני חודשים עבריים: 'כ"ט באלול – ה׳ בתשרי · ...'). */
export function dualRange(fromKey: string, toKey: string): string {
  const a = hebrewDayInfo(fromKey);
  const b = hebrewDayInfo(toKey);
  const heb = a.month === b.month ? `${gematria(a.day)}–${hebrewShort(toKey)}` : `${hebrewShort(fromKey)} – ${hebrewShort(toKey)}`;
  return `${heb} · ${gregorianShort(fromKey)}–${gregorianShort(toKey)}`;
}

/** טווח שבוע קצר, עברי בלבד, לתוויות צפופות (גרף לפי שבוע): 'ט׳–ט"ו תשרי' / 'כ"ד אלול–א׳ תשרי'. */
export function hebrewRangeShort(fromKey: string, toKey: string): string {
  const a = hebrewDayInfo(fromKey);
  const b = hebrewDayInfo(toKey);
  return a.month === b.month
    ? `${gematria(a.day)}–${gematria(b.day)} ${b.monthName}`
    : `${gematria(a.day)} ${a.monthName}–${gematria(b.day)} ${b.monthName}`;
}
