/**
 * המיתוג של היומן: שם וצבע. משותף לדף הנחיתה (הטלפון החי בסקשן) ולהדגמה (/journal/).
 * עובר בין השניים בשתי דרכים: פרמטרים בכתובת (?name=&accent=), שמשמשים גם לקישור אישי
 * שאפרים שולח ללקוח, ו-localStorage לאותו מבקר באותו דפדפן.
 */
export type AccentId = "gold" | "olive" | "wine" | "sea";
export const ACCENTS: Array<{ id: AccentId; name: string; color: string }> = [
  { id: "gold", name: "זהב", color: "#A57B2C" },
  { id: "olive", name: "זית", color: "#4F6F3A" },
  { id: "wine", name: "בורדו", color: "#7A2E3B" },
  { id: "sea", name: "ים", color: "#2B5F8A" },
];

export type Brand = { name: string; accent: AccentId };
export const DEFAULT_BRAND: Brand = { name: "", accent: "gold" };

const KEY = "journal_brand_v1";

export function isAccent(x: unknown): x is AccentId {
  return typeof x === "string" && ACCENTS.some((a) => a.id === x);
}

export function accentColor(id: AccentId): string {
  return ACCENTS.find((a) => a.id === id)?.color ?? ACCENTS[0].color;
}

export function accentName(id: AccentId): string {
  return ACCENTS.find((a) => a.id === id)?.name ?? ACCENTS[0].name;
}

export const cleanName = (s: string) => s.trim().slice(0, 24);

/** מהכתובת: ?name=משה&accent=olive. מחזיר null אם אין כלום. */
export function brandFromUrl(search: string = location.search): Brand | null {
  const q = new URLSearchParams(search);
  const name = cleanName(q.get("name") ?? "");
  const accent = q.get("accent");
  if (!name && !isAccent(accent)) return null;
  return { name, accent: isAccent(accent) ? accent : "gold" };
}

export function loadBrand(): Brand | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const b = JSON.parse(raw) as Partial<Brand>;
    return { name: cleanName(typeof b.name === "string" ? b.name : ""), accent: isAccent(b.accent) ? b.accent : "gold" };
  } catch {
    return null;
  }
}

export function saveBrand(b: Brand) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ name: cleanName(b.name), accent: b.accent }));
  } catch {
    /* best effort */
  }
}

/** קישור להדגמה שכבר פתוחה על השם והצבע. */
export function demoUrl(base: string, b: Brand): string {
  const q = new URLSearchParams();
  if (b.name.trim()) q.set("name", cleanName(b.name));
  if (b.accent !== "gold") q.set("accent", b.accent);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

/** הודעת הוואטסאפ, חמה: עם השם והצבע אם יש. */
export function whatsappUrl(b: Brand, source: "landing" | "demo"): string {
  const name = cleanName(b.name);
  const tried = source === "demo" ? "ניסיתי את הדגמת היומן האישי באתר" : "ראיתי את היומן האישי באתר";
  const text = name
    ? `שלום אפרים, אני ${name}. ${tried}, בצבע ${accentName(b.accent)}, ואשמח ליומן כזה על השם שלי.`
    : `שלום אפרים, ${tried} ואשמח לשמוע עוד.`;
  return "https://wa.me/972508221842?text=" + encodeURIComponent(text);
}
