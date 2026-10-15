/**
 * נתוני ההדגמה: בית כנסת "מנחת יהודה", מעלה עמוס. כל השמות בדיוניים, נוצרים ממחולל דטרמיניסטי
 * (אותו זרע = אותם נתונים), כך שההדגמה נראית אותו דבר לכל מי שפותח אותה.
 */
import { todayKey, shiftDayKey, weekStartKey } from "./lib/dates";
import { weekParsha } from "./lib/parsha";

export const SHUL = { name: "מנחת יהודה", place: "מעלה עמוס" };

export type Member = {
  id: string;
  name: string;
  phone: string;
  street: string;
  lastAliyah: string | null; // dayKey
  yahrzeit?: string; // "השבוע" אם יש
  guest?: boolean;
  note?: string;
};
export type Neder = { id: string; memberId: string; amount: number; purpose: string; date: string; paid: boolean };
export type AliyahSlot = { key: string; name: string; range: string; memberId: string | null };
export type Donation = { id: string; memberId: string | null; donor?: string; amount: number; purpose: string; date: string };
export type Event = { id: string; title: string; date: string; kind: "קידוש" | "יארצייט" | "שיעור" | "שמחה" };
export type Ticket = { id: string; title: string; where: string; urgent: boolean; status: "פתוח" | "בטיפול" | "סגור"; owner: string | null; opened: string };
export type Message = { id: string; to: string; text: string; date: string };

export type State = {
  version: 1;
  today: string;
  members: Member[];
  nedarim: Neder[];
  aliyot: AliyahSlot[];
  parsha: { name: string; niqqud: string; shabbat: string; note?: string };
  donations: Donation[];
  events: Event[];
  tickets: Ticket[];
  messages: Message[];
  log: string[];
};

const FIRST = ["יוסף", "משה", "דוד", "אברהם", "יצחק", "יעקב", "שמואל", "אליהו", "ישראל", "חיים", "מאיר", "נתן", "אהרן", "בנימין", "שלמה", "אליעזר", "מנחם", "ראובן", "שמעון", "יהודה", "גדליה", "צבי", "אריה", "עמרם", "רפאל", "אלחנן", "נחמן", "ברוך", "מרדכי", "פנחס", "זאב", "אשר", "דניאל", "עובדיה", "ישי", "איתן", "נדב", "אוריאל", "עידו", "אלעד"];
const LAST = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "דהן", "אברהם", "פרידמן", "מלכה", "אזולאי", "קליין", "שפירא", "גולדברג", "חדד", "בן דוד", "עמר", "אוחיון", "ששון", "רוזנברג", "גבאי", "סבג", "ברקוביץ", "אלבז", "וייס", "נחום", "שטרן", "טולדנו", "אדרי", "יפרח", "הורוביץ"];
const STREETS = ["הגפן", "התאנה", "הרימון", "הזית", "התמר", "הדקל", "הארז", "האלון", "השקד", "הברוש"];
const PURPOSES = ["עלייה לתורה", "נר תמיד", "קידוש", "מי שברך", "ספרים", "תחזוקה", "חנוכה", "פורים"];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const nis = (n: number) => `${n.toLocaleString("he-IL")} ₪`;
export { nis };

export function buildSeed(now: Date = new Date()): State {
  const r = rng(5787);
  const today = todayKey(now);
  const members: Member[] = [];
  const used = new Set<string>();
  while (members.length < 118) {
    const name = `${pick(r, FIRST)} ${pick(r, LAST)}`;
    if (used.has(name)) continue;
    used.add(name);
    const weeksAgo = Math.floor(r() * 26);
    members.push({
      id: `m${members.length + 1}`,
      name,
      phone: `05${Math.floor(r() * 2) + 2}-${String(Math.floor(r() * 9000000) + 1000000)}`,
      street: `${pick(r, STREETS)} ${Math.floor(r() * 40) + 1}`,
      lastAliyah: r() < 0.9 ? shiftDayKey(today, -7 * weeksAgo - Math.floor(r() * 6)) : null,
    });
  }
  members.sort((a, b) => a.name.localeCompare(b.name, "he"));
  members[7].yahrzeit = "השבוע";
  members[23].yahrzeit = "השבוע";
  members[40].note = "בר מצווה לנכד בעוד שבועיים";
  members.push({ id: "g1", name: "אורח: הרב מרדכי פלדמן", phone: "", street: "", lastAliyah: null, guest: true, note: "מתארח בשבת" });

  const nedarim: Neder[] = [];
  for (let i = 0; i < 70; i++) {
    const m = pick(r, members.filter((x) => !x.guest));
    const weeks = Math.floor(r() * 10);
    nedarim.push({
      id: `n${i + 1}`,
      memberId: m.id,
      amount: [18, 26, 36, 52, 100, 180, 250, 360][Math.floor(r() * 8)],
      purpose: pick(r, PURPOSES),
      date: shiftDayKey(today, -7 * weeks - Math.floor(r() * 6)),
      paid: r() < 0.55,
    });
  }

  const ws = weekStartKey(today);
  const wp = weekParsha(ws);
  const aliyot: AliyahSlot[] = (wp?.aliyot ?? []).map((a) => ({ key: a.name, name: a.name, range: `${a.book} ${a.range}`, memberId: null }));
  aliyot.push({ key: "מפטיר", name: "מפטיר", range: "הפטרה", memberId: null });
  // שתי עליות כבר שובצו, כדי שהמסך לא יהיה ריק
  if (aliyot.length >= 3) {
    aliyot[0].memberId = members[2].id;
    aliyot[2].memberId = members[55].id;
  }

  const donations: Donation[] = [];
  for (let i = 0; i < 14; i++) {
    const m = pick(r, members.filter((x) => !x.guest));
    donations.push({ id: `d${i + 1}`, memberId: m.id, amount: [50, 100, 180, 200, 360, 500, 1000][Math.floor(r() * 7)], purpose: pick(r, PURPOSES), date: shiftDayKey(today, -Math.floor(r() * 28)) });
  }
  donations.sort((a, b) => b.date.localeCompare(a.date));

  const events: Event[] = [
    { id: "e1", title: `קידוש לכבוד הולדת הבת, משפחת ${members[12].name.split(" ")[1]}`, date: shiftDayKey(ws, 6), kind: "קידוש" },
    { id: "e2", title: `יארצייט, ${members[7].name}`, date: shiftDayKey(today, 2), kind: "יארצייט" },
    { id: "e3", title: "שיעור הלכה, הרב של הקהילה", date: shiftDayKey(today, 1), kind: "שיעור" },
    { id: "e4", title: `בר מצווה, נכד של ${members[40].name}`, date: shiftDayKey(today, 15), kind: "שמחה" },
  ];

  const tickets: Ticket[] = [
    { id: "t1", title: "מזגן בעזרת נשים לא מקרר", where: "עזרת נשים", urgent: true, status: "בטיפול", owner: "ועד הבית", opened: shiftDayKey(today, -3) },
    { id: "t2", title: "נורה שרופה מעל הבימה", where: "אולם מרכזי", urgent: false, status: "פתוח", owner: null, opened: shiftDayKey(today, -1) },
    { id: "t3", title: "ברז דולף בכיור הנטילה", where: "כניסה", urgent: false, status: "סגור", owner: "אינסטלטור", opened: shiftDayKey(today, -9) },
  ];

  return {
    version: 1,
    today,
    members,
    nedarim,
    aliyot,
    parsha: wp ? { name: wp.name, niqqud: wp.niqqud, shabbat: wp.shabbat, note: wp.note } : { name: "", niqqud: "", shabbat: shiftDayKey(ws, 6) },
    donations,
    events,
    tickets,
    messages: [{ id: "x1", to: "כל המתפללים", text: "שבת שלום! הקידוש השבת לכבוד משפחת כהן. זמן מנחה 17:10.", date: shiftDayKey(today, -5) }],
    log: [],
  };
}
