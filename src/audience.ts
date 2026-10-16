/**
 * ארבעת השערים בכותרת: מי המבקר. הבחירה נשמרת לאותו מבקר (localStorage), משנה את הטלפון
 * המודמה בכותרת, ומכניסה לכל כפתורי הוואטסאפ בדף הודעה מוכנה שאומרת לאפרים מי פונה.
 */
import { useSyncExternalStore } from "react";
import { WHATSAPP_URL, type Audience } from "./content";

export type { Audience };

export type Gate = {
  id: Audience;
  title: string;
  sub: string;
  /** לאן הכפתור גולל. */
  href: string;
  /** הודעת הוואטסאפ המוכנה. */
  message: string;
};

export const gates: Gate[] = [
  { id: "shul", title: "בית כנסת", sub: "גבאי, ועד", href: "#gabbai", message: "שלום אפרים, אני גבאי בבית כנסת וראיתי את האתר. אשמח לשמוע על המערכת." },
  { id: "mosad", title: "מוסד", sub: "ישיבה, ת״ת, כולל, חסד", href: "#mosad", message: "שלום אפרים, אני ממוסד (ישיבה / ת״ת / כולל / חסד) וראיתי את האתר. אשמח לשמוע על מערכת ניהול למוסד." },
  { id: "business", title: "עסק", sub: "בעל מקצוע, שותפים", href: "#business", message: "שלום אפרים, יש לי עסק וראיתי את האתר. אשמח לשמוע על מערכת ניהול מהטלפון." },
  { id: "journal", title: "יומן אישי", sub: "לאדם אחד", href: "#journal", message: "שלום אפרים, ראיתי את היומן האישי באתר ואשמח לשמוע עוד." },
];

const KEY = "audience_v1";
const listeners = new Set<() => void>();
let current: Audience | null = load();

function isAudience(x: unknown): x is Audience {
  return typeof x === "string" && gates.some((g) => g.id === x);
}

function load(): Audience | null {
  try {
    const v = localStorage.getItem(KEY);
    return isAudience(v) ? v : null;
  } catch {
    return null;
  }
}

export function setAudience(a: Audience | null) {
  current = a;
  try {
    if (a) localStorage.setItem(KEY, a);
    else localStorage.removeItem(KEY);
  } catch {
    /* best effort */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAudience(): Audience | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

/** קישור וואטסאפ עם ההודעה של הקהל שנבחר. בלי בחירה: הקישור הרגיל. */
export function whatsappHref(a: Audience | null): string {
  const g = gates.find((x) => x.id === a);
  return g ? `${WHATSAPP_URL}?text=${encodeURIComponent(g.message)}` : WHATSAPP_URL;
}
