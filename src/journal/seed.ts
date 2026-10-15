/**
 * נתוני ההדגמה של היומן האישי. הכול בדיוני ודטרמיניסטי (אותו זרע = אותם נתונים),
 * עם היסטוריה של ארבעה שבועות כדי שההתמדה תיראה חיה כבר בפתיחה הראשונה.
 */
import { todayKey, shiftDayKey, weekday } from "./dates";

export type Area = "עסק" | "בית" | "לימוד" | "בריאות" | "קהילה";
export const AREAS: Area[] = ["עסק", "בית", "לימוד", "בריאות", "קהילה"];

export type TimeOfDay = "בוקר" | "יום" | "ערב";
export const TIMES: TimeOfDay[] = ["בוקר", "יום", "ערב"];

/** קביעות: משהו שרוצים להתמיד בו. days ריק = כל יום; אחרת ימים בשבוע (0 = ראשון). */
export type Habit = { id: string; name: string; area: Area; time: TimeOfDay; days: number[] };
export type Task = { id: string; title: string; area: Area; due: string | null; done: string | null; created: string };
export type Mood = 1 | 2 | 3;
export type Entry = { day: string; mood: Mood; good: string; tomorrow: string };

export type AccentId = "gold" | "olive" | "wine" | "sea";
export const ACCENTS: Array<{ id: AccentId; name: string; color: string }> = [
  { id: "gold", name: "זהב", color: "#A57B2C" },
  { id: "olive", name: "זית", color: "#4F6F3A" },
  { id: "wine", name: "בורדו", color: "#7A2E3B" },
  { id: "sea", name: "ים", color: "#2B5F8A" },
];

export type Profile = { name: string; accent: AccentId; onboarded: boolean };

export type State = {
  version: 1;
  today: string;
  profile: Profile;
  habits: Habit[];
  /** מפתח יום ← מזהי הקביעויות שסומנו באותו יום */
  log: Record<string, string[]>;
  tasks: Task[];
  entries: Entry[];
  /** מה המבקר עשה בהדגמה (מוצג במסך היום) */
  actions: string[];
};

export const MOOD_LABEL: Record<Mood, string> = { 1: "יום קשה", 2: "יום בסדר", 3: "יום טוב" };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function isScheduled(h: Habit, dayKey: string): boolean {
  return h.days.length === 0 || h.days.includes(weekday(dayKey));
}

const WEEKDAYS = [0, 1, 2, 3, 4];

export const DEFAULT_PROFILE: Profile = { name: "", accent: "gold", onboarded: false };

export function buildSeed(profile: Profile = DEFAULT_PROFILE, now: Date = new Date()): State {
  const r = rng(5787);
  const today = todayKey(now);
  const d = (n: number) => shiftDayKey(today, n);

  const habits: Habit[] = [
    { id: "h1", name: "קביעות בוקר", area: "לימוד", time: "בוקר", days: [] },
    { id: "h2", name: "הליכה 20 דק׳", area: "בריאות", time: "בוקר", days: WEEKDAYS },
    { id: "h3", name: "לסגור את היום בעסק", area: "עסק", time: "ערב", days: WEEKDAYS },
    { id: "h4", name: "שעה עם המשפחה בלי טלפון", area: "בית", time: "ערב", days: [] },
    { id: "h5", name: "שינה לפני 23:30", area: "בריאות", time: "ערב", days: WEEKDAYS },
  ];
  const odds: Record<string, number> = { h1: 0.92, h2: 0.7, h3: 0.82, h4: 0.76, h5: 0.55 };

  const log: Record<string, string[]> = {};
  for (let i = 28; i >= 1; i--) {
    const day = d(-i);
    const done: string[] = [];
    for (const h of habits) {
      if (!isScheduled(h, day)) continue;
      // הקביעות הראשונה: רצף של שלושה שבועות בדיוק (פספוס אחד לפניו), כדי שיהיה מה להראות
      if (h.id === "h1" && i === 22) continue;
      if (h.id === "h1" && i <= 21) done.push(h.id);
      else if (r() < odds[h.id]) done.push(h.id);
    }
    log[day] = done;
  }
  log[today] = ["h1"];

  const t = (id: string, title: string, area: Area, due: string | null, done: string | null = null, createdAgo = 3): Task => ({
    id,
    title,
    area,
    due,
    done,
    created: d(-createdAgo),
  });
  const tasks: Task[] = [
    t("t1", "לשלוח הצעת מחיר ללקוח החדש", "עסק", today),
    t("t2", "לענות למייל של הוועד", "קהילה", today),
    t("t3", "להעביר תשלום לגן", "בית", d(-1), null, 5),
    t("t4", "להתקשר לרואה החשבון", "עסק", d(1)),
    t("t5", "לקבוע תור לטיפול ברכב", "בית", d(2)),
    t("t6", "לעדכן את המחירון באתר", "עסק", d(3)),
    t("t7", "להכין את השיעור לשבת", "לימוד", d(4)),
    t("t8", "לרשום לחוג", "בית", d(6), null, 1),
    t("t9", "לסיים את הפרק בספר", "לימוד", null, null, 9),
    t("t10", "לקנות נעלי הליכה", "בריאות", null, null, 12),
    t("t11", "להוציא חשבונית על העבודה של השבוע", "עסק", d(-1), d(-1), 4),
    t("t12", "לשלם ארנונה", "בית", d(-2), d(-2), 8),
    t("t13", "לקנות מתנה לבר מצווה", "קהילה", d(-3), d(-4), 10),
  ];

  const entries: Entry[] = [
    { day: d(-1), mood: 3, good: "סגרתי שני לקוחות חדשים, ועמדתי בקביעות גם כשהיה עמוס.", tomorrow: "הצעת מחיר בבוקר, לפני שהטלפון מתחיל." },
    { day: d(-2), mood: 2, good: "היום היה בינוני, אבל ההליכה בבוקר הצילה אותו.", tomorrow: "לסיים את החשבונית, לא לדחות שוב." },
    { day: d(-3), mood: 3, good: "ערב שלם עם הילדים בלי טלפון. לא זוכר מתי זה קרה פעם אחרונה.", tomorrow: "לחזור ללקוח שחיכה." },
    { day: d(-5), mood: 1, good: "לא יצא לי כמעט כלום, אבל לפחות סגרתי את היום בעסק.", tomorrow: "להתחיל מההליכה. זה מסדר את הראש." },
    { day: d(-6), mood: 3, good: "שבוע טוב בעסק, שלוש עבודות נסגרו.", tomorrow: "יום של משפחה." },
    { day: d(-8), mood: 2, good: "הקביעות בבוקר מחזיקה גם כשהכול מתפזר.", tomorrow: "לקבוע עם רואה החשבון." },
  ];

  return { version: 1, today, profile, habits, log, tasks, entries, actions: [] };
}

/** רצף נוכחי ורצף שיא של קביעות, לפי הימים שבהם היא מתוכננת. */
export function streaks(h: Habit, log: Record<string, string[]>, today: string): { current: number; best: number } {
  let current = 0;
  let best = 0;
  let run = 0;
  // 60 יום אחורה: מספיק להדגמה
  for (let i = 59; i >= 0; i--) {
    const day = shiftDayKey(today, -i);
    if (!isScheduled(h, day)) continue;
    const done = log[day]?.includes(h.id);
    if (done) {
      run++;
      best = Math.max(best, run);
    } else if (i === 0) {
      // היום עוד לא סומן: לא שובר את הרצף
    } else run = 0;
  }
  current = run;
  return { current, best };
}

/** אחוז התמדה ב-30 הימים האחרונים (לא כולל היום). */
export function rate30(h: Habit, log: Record<string, string[]>, today: string): number {
  let sched = 0;
  let done = 0;
  for (let i = 30; i >= 1; i--) {
    const day = shiftDayKey(today, -i);
    if (!isScheduled(h, day)) continue;
    sched++;
    if (log[day]?.includes(h.id)) done++;
  }
  return sched ? Math.round((done / sched) * 100) : 0;
}
