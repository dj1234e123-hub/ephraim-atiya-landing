/**
 * נתוני ההדגמה: בית כנסת "מנחת יהודה", מעלה עמוס. כל השמות בדיוניים, נוצרים ממחולל דטרמיניסטי
 * (אותו זרע = אותם נתונים), כך שההדגמה נראית אותו דבר לכל מי שפותח אותה.
 */
import { todayKey, shiftDayKey, weekStartKey } from "./lib/dates";
import { weekParsha } from "./lib/parsha";
import { hebrewToDayKey, hebrewDayInfo } from "./lib/hebcal";
import type { Rules } from "./lib/zmanim";

export type ShulSettings = {
  name: string;
  place: string;
  address: string;
  phone: string;
  /** מיקום לחישוב זמנים */
  lat: number;
  lon: number;
  nusach: "ספרד" | "אשכנז" | "עדות המזרח";
  rules: Rules;
  gabbai: string;
  gabbai2: string;
  cleaner: string;
  /** אות על הסמל בהדפסות */
  mark: string;
};

export const SHUL: ShulSettings = {
  name: "מנחת יהודה",
  place: "מעלה עמוס",
  address: "רחוב הגפן 1, מעלה עמוס",
  phone: "02-996-0000",
  lat: 31.602,
  lon: 35.178,
  nusach: "ספרד",
  rules: {
    candleOffset: 20,
    minchaErevBeforeCandles: 10,
    shacharitShabbat: "08:00",
    minchaShabbatBeforeSunset: 45,
    shacharitWeekday: "06:30",
    minchaWeekdayBeforeSunset: 20,
  },
  gabbai: "הגבאי",
  gabbai2: "הגבאי השני",
  cleaner: "המנקה",
  mark: "מ",
};

export type Member = {
  id: string;
  name: string;
  phone: string;
  street: string;
  lastAliyah: string | null; // dayKey
  yahrzeit?: string; // "השבוע" אם יש
  yahrzeitFor?: string; // שם הנפטר
  guest?: boolean;
  note?: string;
  /** הערה קבועה לשיבוץ: כהן / לוי / לא עולה */
  tribe?: "כהן" | "לוי";
};
export type Neder = { id: string; memberId: string; amount: number; purpose: string; date: string; paid: boolean };
export type AliyahSlot = { key: string; name: string; range: string; memberId: string | null };
export type Donation = { id: string; memberId: string | null; donor?: string; amount: number; purpose: string; date: string; thanked?: boolean };
export type Event = { id: string; title: string; date: string; kind: "קידוש" | "יארצייט" | "שיעור" | "שמחה" };
export type Ticket = { id: string; title: string; where: string; urgent: boolean; status: "פתוח" | "בטיפול" | "סגור"; owner: string | null; opened: string };
export type Message = { id: string; to: string; text: string; date: string };

export type PrepTask = {
  id: string;
  title: string;
  owner: string;
  /** דקות לפני הדלקת נרות (או לפני מועד החג). null = בלי שעה. */
  dueMin: number | null;
  done: boolean;
  note?: string;
  /** קישור למסך רלוונטי */
  link?: "print" | "aliyot" | "kiddush" | "clocks";
};
export type ShabbatPrep = { shabbat: string; tasks: PrepTask[] };
export type ShabbatClock = { id: string; device: string; where: string; winter: string; summer: string; note?: string; lastChecked: string };
export type Kiddush = {
  shabbat: string;
  parsha: string;
  sponsorMemberId: string | null;
  sponsorName?: string;
  occasion: string;
  setup: string;
  cleanup: string;
};
export type StandingOrder = { id: string; memberId: string; amount: number; method: "אשראי" | "הוראת קבע בנקאית" | "נדרים פלוס"; day: number; since: string; thanked: boolean };
export type Integration = { id: string; name: string; desc: string; connected: boolean; what: string };
export type Seat = { id: string; section: string; row: number; num: number; memberId: string | null; price: number; paid: boolean };
export type HolidayPrep = { id: string; name: string; date: string; tasks: PrepTask[]; note?: string };

export type State = {
  version: 2;
  today: string;
  shul: ShulSettings;
  members: Member[];
  nedarim: Neder[];
  aliyot: AliyahSlot[];
  parsha: { name: string; niqqud: string; shabbat: string; note?: string };
  donations: Donation[];
  events: Event[];
  tickets: Ticket[];
  messages: Message[];
  prep: ShabbatPrep;
  clocks: ShabbatClock[];
  kiddushim: Kiddush[];
  standingOrders: StandingOrder[];
  integrations: Integration[];
  seats: Seat[];
  holidays: HolidayPrep[];
  /** תזכורות שסומנו "נשלח" (מפתח ייחודי) */
  sentReminders: string[];
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

/** תבנית ההכנות לשבת של בית הכנסת. נוצרת מחדש כל שבוע. */
export function shabbatPrepTemplate(shul: ShulSettings, parshaName: string, kiddushLine: string | null, duty: string): PrepTask[] {
  const t = (id: string, title: string, owner: string, dueMin: number | null, extra: Partial<PrepTask> = {}): PrepTask => ({ id, title, owner, dueMin, done: false, ...extra });
  return [
    t("p-clock-hall", "שעון שבת: מזגן אולם מרכזי", shul.gabbai, 90, { link: "clocks", note: "לפי לוח החורף/קיץ ברישום השעונים" }),
    t("p-clock-ezrat", "שעון שבת: מזגן עזרת נשים", shul.gabbai, 90, { link: "clocks" }),
    t("p-clock-lights", "שעון שבת: אורות חצר וכניסה", duty, 90, { link: "clocks" }),
    t("p-urn", "מיחם מים חמים: למלא ולחבר לשעון", duty, 60),
    t("p-torah", `לגלול ספר תורה לפרשת ${parshaName}`, shul.gabbai2, 120, { link: "aliyot" }),
    t("p-aliyot", "לסגור את סידור העליות", shul.gabbai, 180, { link: "aliyot" }),
    t("p-kiddush", kiddushLine ?? "קידוש: אין חסות השבת. לוודא יין וחלות בסיסיים", kiddushLine ? "ועד הקידוש" : shul.gabbai, 120, { link: "kiddush" }),
    t("p-print", "להדפיס דף שבת: לדלת ולבימה", shul.gabbai2, 150, { link: "print" }),
    t("p-candles", "נרות, מפות, גביע קידוש", duty, 60),
    t("p-clean", "ניקיון אולם ושירותים", shul.cleaner, 180),
    t("p-keys", "מפתחות: לוודא שהרזרבי אצל הגבאי השני", shul.gabbai, null),
    t("p-guests", "כיסאות נוספים לאורחים (בר מצווה בעוד שבועיים)", duty, null),
  ];
}

function chanukahTasks(): PrepTask[] {
  const t = (id: string, title: string, owner: string, dueMin: number | null, note?: string): PrepTask => ({ id, title, owner, dueMin, done: false, note });
  return [
    t("c-menorah", "חנוכייה גדולה לחצר: להוציא מהמחסן ולנקות", "ועד הבית", 60 * 24 * 3, undefined),
    t("c-oil", "שמן זית ופתילות ל-8 ימים", "הגבאי השני", 60 * 24 * 2, "לפי שנה שעברה: 2 ליטר"),
    t("c-times", "זמני הדלקה בבית הכנסת: אחרי מנחה, לפני ערבית", "הגבאי", 60 * 24 * 2, "להדפיס לדף השבת ולדלת"),
    t("c-who", "מי מדליק בכל ערב (8 שמות)", "הגבאי", 60 * 24 * 1, undefined),
    t("c-kids", "סופגניות לילדים בערב הראשון", "ועד הקידוש", 60 * 24 * 1, undefined),
    t("c-msg", "הודעה לציבור: זמני הדלקה וסדר הערבים", "הגבאי", 60 * 24 * 1, undefined),
    t("c-fire", "מטף כיבוי ליד החנוכייה", "ועד הבית", 60 * 2, undefined),
  ];
}
function yamimNoraimTasks(): PrepTask[] {
  const t = (id: string, title: string, owner: string, dueMin: number | null): PrepTask => ({ id, title, owner, dueMin, done: false });
  const d = 60 * 24;
  return [
    t("y-seats", "מכירת מקומות ישיבה: לפתוח רישום", "הגבאי", d * 40),
    t("y-chazan", "חזנים לשחרית, מוסף, נעילה", "הגבאי", d * 30),
    t("y-shofar", "בעל תוקע ושופר רזרבי", "הגבאי השני", d * 30),
    t("y-selichot", "זמני סליחות: להדפיס ולפרסם", "הגבאי", d * 25),
    t("y-machzorim", "מחזורים: לספור, להשלים, להכין לאורחים", "ועד הבית", d * 14),
    t("y-covers", "כיסויים לבנים לארון, לבימה ולספרי התורה", "המנקה", d * 7),
    t("y-clean", "ניקיון יסודי ופינוי מחסן", "המנקה", d * 7),
    t("y-chairs", "כיסאות נוספים ומקומות לאורחים", "ועד הבית", d * 3),
    t("y-board", "לוח זמנים של החגים על הדלת", "הגבאי השני", d * 3),
  ];
}

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
  for (const m of members) {
    if (m.name.endsWith(" כהן")) m.tribe = "כהן";
    if (m.name.endsWith(" לוי")) m.tribe = "לוי";
  }
  members[7].yahrzeit = "השבוע";
  members[7].yahrzeitFor = "אביו ז״ל";
  members[23].yahrzeit = "השבוע";
  members[23].yahrzeitFor = "אמו ע״ה";
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
  const shabbat = wp?.shabbat ?? shiftDayKey(ws, 6);
  const aliyot: AliyahSlot[] = (wp?.aliyot ?? []).map((a) => ({ key: a.name, name: a.name, range: `${a.book} ${a.range}`, memberId: null }));
  aliyot.push({ key: "מפטיר", name: "מפטיר", range: "הפטרה", memberId: null });
  if (aliyot.length >= 3) {
    aliyot[0].memberId = members.find((m) => m.tribe === "כהן")?.id ?? members[2].id;
    aliyot[1].memberId = members.find((m) => m.tribe === "לוי")?.id ?? members[3].id;
    aliyot[2].memberId = members[55].id;
  }

  const donations: Donation[] = [];
  for (let i = 0; i < 14; i++) {
    const m = pick(r, members.filter((x) => !x.guest));
    donations.push({ id: `d${i + 1}`, memberId: m.id, amount: [50, 100, 180, 200, 360, 500, 1000][Math.floor(r() * 7)], purpose: pick(r, PURPOSES), date: shiftDayKey(today, -Math.floor(r() * 28)), thanked: r() < 0.7 });
  }
  donations.sort((a, b) => b.date.localeCompare(a.date));

  const events: Event[] = [
    { id: "e1", title: `קידוש לכבוד הולדת הבת, משפחת ${members[12].name.split(" ")[1]}`, date: shabbat, kind: "קידוש" },
    { id: "e2", title: `יארצייט, ${members[7].name}`, date: shiftDayKey(today, 2), kind: "יארצייט" },
    { id: "e3", title: "שיעור הלכה, הרב של הקהילה", date: shiftDayKey(today, 1), kind: "שיעור" },
    { id: "e4", title: `בר מצווה, נכד של ${members[40].name}`, date: shiftDayKey(shabbat, 14), kind: "שמחה" },
  ];

  const tickets: Ticket[] = [
    { id: "t1", title: "מזגן בעזרת נשים לא מקרר", where: "עזרת נשים", urgent: true, status: "בטיפול", owner: "ועד הבית", opened: shiftDayKey(today, -3) },
    { id: "t2", title: "נורה שרופה מעל הבימה", where: "אולם מרכזי", urgent: false, status: "פתוח", owner: null, opened: shiftDayKey(today, -1) },
    { id: "t3", title: "ברז דולף בכיור הנטילה", where: "כניסה", urgent: false, status: "סגור", owner: "אינסטלטור", opened: shiftDayKey(today, -9) },
  ];

  // קידושים לשמונה שבתות קדימה
  const kiddushim: Kiddush[] = [];
  for (let k = 0; k < 8; k++) {
    const sk = shiftDayKey(shabbat, 7 * k);
    const p = weekParsha(shiftDayKey(ws, 7 * k));
    const base: Kiddush = { shabbat: sk, parsha: p?.name ?? "", sponsorMemberId: null, occasion: "", setup: "ועד הקידוש", cleanup: "תורן השבוע" };
    if (k === 0) Object.assign(base, { sponsorMemberId: members[12].id, occasion: "הולדת הבת" });
    if (k === 2) Object.assign(base, { sponsorMemberId: members[40].id, occasion: "בר מצווה לנכד" });
    if (k === 4) Object.assign(base, { sponsorMemberId: members[23].id, occasion: "אזכרה, לעילוי נשמת אמו ע״ה" });
    if (k === 5) Object.assign(base, { sponsorMemberId: null, sponsorName: "ועד בית הכנסת", occasion: "שבת מברכים" });
    kiddushim.push(base);
  }

  const duty = members[17].name;
  const k0 = kiddushim[0];
  const kiddushLine = k0.sponsorMemberId ? `קידוש: משפחת ${members.find((m) => m.id === k0.sponsorMemberId)?.name.split(" ")[1]} מביאה (${k0.occasion}). לוודא שולחנות ומפות` : null;
  const prep: ShabbatPrep = { shabbat, tasks: shabbatPrepTemplate(SHUL, wp?.name ?? "", kiddushLine, duty) };
  // חלק כבר בוצע, כדי שהמסך יספר סיפור
  for (const id of ["p-clean", "p-aliyot", "p-keys"]) {
    const t = prep.tasks.find((x) => x.id === id);
    if (t) t.done = true;
  }

  const clocks: ShabbatClock[] = [
    { id: "k1", device: "מזגן אולם מרכזי (2 יחידות)", where: "לוח חשמל ראשי, מתג 3", winter: "שישי 15:30 עד 22:30 · שבת 07:00 עד 13:00, 16:00 עד 20:00", summer: "שישי 18:00 עד 23:30 · שבת 07:00 עד 14:00, 17:00 עד 21:30", note: "שעון דיגיטלי, תוכנית A חורף, B קיץ", lastChecked: shiftDayKey(today, -6) },
    { id: "k2", device: "מזגן עזרת נשים", where: "ליד הדלת האחורית", winter: "שישי 15:30 עד 20:00 · שבת 07:30 עד 12:30", summer: "שישי 18:00 עד 22:00 · שבת 07:30 עד 13:00", lastChecked: shiftDayKey(today, -6) },
    { id: "k3", device: "אורות חצר וכניסה", where: "שעון מכני בארון החשמל בכניסה", winter: "הדלקה 16:00, כיבוי 23:00", summer: "הדלקה 19:00, כיבוי 23:30", note: "לזכור להזיז את הפינים אחרי שינוי שעון", lastChecked: shiftDayKey(today, -13) },
    { id: "k4", device: "מיחם מים חמים", where: "מטבחון", winter: "הדלקה שישי 14:00, כיבוי שבת 14:00", summer: "הדלקה שישי 16:00, כיבוי שבת 14:00", lastChecked: shiftDayKey(today, -6) },
    { id: "k5", device: "דוד חשמל שירותים", where: "מעל הדלת", winter: "כבוי בשבת", summer: "כבוי בשבת", lastChecked: shiftDayKey(today, -27) },
  ];

  const standingOrders: StandingOrder[] = [];
  const soMembers = members.filter((m) => !m.guest).slice(5, 27);
  soMembers.forEach((m, i) => {
    standingOrders.push({
      id: `so${i + 1}`,
      memberId: m.id,
      amount: [18, 36, 50, 100, 150, 180][Math.floor(r() * 6)],
      method: (["אשראי", "הוראת קבע בנקאית", "נדרים פלוס"] as const)[Math.floor(r() * 3)],
      day: [1, 10, 15][Math.floor(r() * 3)],
      since: shiftDayKey(today, -30 * Math.floor(r() * 30) - 10),
      thanked: true,
    });
  });
  // הוראת קבע חדשה מהיום, עוד לא נשלחה תודה: זה הדבר שמדגים את מכתב התודה
  standingOrders.unshift({ id: "so-new", memberId: members[33].id, amount: 100, method: "אשראי", day: 10, since: today, thanked: false });

  const integrations: Integration[] = [
    { id: "nedarim", name: "נדרים פלוס", desc: "עמדת התרומה בכניסה והוראות הקבע", what: "כל תרומה שנכנסת בעמדה נרשמת אוטומטית על שם המתפלל, עם קבלה.", connected: false },
    { id: "bit", name: "ביט", desc: "תשלומים מהטלפון", what: "תשלום בביט מתאים אוטומטית לנדר הפתוח של המתפלל.", connected: true },
    { id: "paybox", name: "פייבוקס", desc: "גבייה קבוצתית", what: "קבוצת גבייה לקידוש או לפרויקט מתעדכנת כאן.", connected: false },
    { id: "invoice", name: "חשבונית ירוקה", desc: "קבלות וסעיף 46", what: "קבלה ממוספרת לכל תרומה, מוכרת למס הכנסה.", connected: true },
    { id: "sms", name: "מסרונים (SMS)", desc: "למי שאין וואטסאפ", what: "כל תזכורת יוצאת גם ב-SMS לטלפונים כשרים.", connected: true },
    { id: "wa", name: "וואטסאפ עסקי", desc: "הודעות ותזכורות", what: "תזכורות אוטומטיות, קבלות ודף השבת נשלחים מהמספר של בית הכנסת.", connected: false },
  ];

  const seats: Seat[] = [];
  const seatMembers = members.filter((m) => !m.guest);
  let si = 0;
  for (let row = 1; row <= 8; row++) {
    for (let num = 1; num <= 10; num++) {
      const price = row <= 2 ? 500 : row <= 5 ? 360 : 180;
      const taken = r() < 0.72;
      const m = taken ? seatMembers[(si++ * 7) % seatMembers.length] : null;
      seats.push({ id: `s${row}-${num}`, section: "אולם מרכזי", row, num, memberId: m?.id ?? null, price, paid: taken ? r() < 0.75 : false });
    }
  }

  const year = hebrewDayInfo(today).year;
  const chanukah = hebrewToDayKey(year, "kislev", 25);
  const rh = hebrewToDayKey(year + 1, "tishrei", 1);
  const holidays: HolidayPrep[] = [
    { id: "chanukah", name: `חנוכה ${hebrewDayInfo(chanukah).label.split(" ").pop()}`, date: chanukah, tasks: chanukahTasks(), note: "הדלקה ראשונה בערב שלפני" },
    { id: "yamim", name: "ימים נוראים", date: rh, tasks: yamimNoraimTasks(), note: "מתחילים חודש וחצי לפני" },
  ];

  return {
    version: 2,
    today,
    shul: SHUL,
    members,
    nedarim,
    aliyot,
    parsha: wp ? { name: wp.name, niqqud: wp.niqqud, shabbat: wp.shabbat, note: wp.note } : { name: "", niqqud: "", shabbat },
    donations,
    events,
    tickets,
    messages: [{ id: "x1", to: "כל המתפללים", text: "שבת שלום! הקידוש השבת לכבוד משפחת כהן. זמן מנחה 17:10.", date: shiftDayKey(today, -5) }],
    prep,
    clocks,
    kiddushim,
    standingOrders,
    integrations,
    seats,
    holidays,
    sentReminders: [],
    log: [],
  };
}
