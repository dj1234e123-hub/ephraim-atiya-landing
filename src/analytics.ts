/**
 * מדידה. שלוש שכבות:
 * 1. PostHog: כל לחיצה (autocapture), צפיות בעמוד, עומק גלילה, הקלטות גלישה, מפות חום, Web Vitals, שגיאות,
 *    ואירועים מותאמים (וואטסאפ, טלפון, הדגמה, שאלות נפוצות, סקשנים שנצפו).
 * 2. Vercel Web Analytics: מבקרים, מקורות, מדינות, מכשירים (בלי עוגיות).
 * 3. Vercel Speed Insights: מהירות הטעינה אצל מבקרים אמיתיים.
 *
 * רץ רק בבנייה לפרודקשן ועל הדומיין האמיתי, כדי שפיתוח ובדיקות לא ילכלכו את הנתונים.
 * הגדרות ההקלטה (אילו דומיינים, כמה זמן נשמר) נמצאות בפרויקט ב-PostHog, לא כאן.
 */
import type { PostHog } from "posthog-js";

export const POSTHOG_TOKEN = "phc_Ao9zMFiwEvJyA7G3LchesR4N7mmJdfggEkrMZF86Z3Lb";
export const POSTHOG_HOST = "https://us.i.posthog.com";

type Props = Record<string, string | number | boolean | null | undefined>;

let enabled = false;
/** פוסטהוג נטען רק אחרי שהדף על המסך (קובץ גדול). עד אז האירועים נשמרים בתור ונשלחים כשהוא מוכן. */
let posthog: PostHog | null = null;
const queue: Array<{ event: string; props?: Props }> = [];

function isForced(): boolean {
  try {
    return window.localStorage.getItem("ph_force") === "1";
  } catch {
    return false;
  }
}

function shouldRun(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD) return false;
  const host = window.location.hostname;
  if (host.endsWith("ephraim-atiya.com")) return true;
  // לבדיקה ידנית על תצוגה מקדימה: localStorage.setItem("ph_force", "1")
  return isForced();
}

/**
 * מאתחל את כל כלי המדידה. לקוראים פעם אחת בכל עמוד.
 * הטעינה עצמה נדחית עד שהדפדפן פנוי (או עד שתי שניות), כדי שהכפתורים יגיבו קודם גם בטלפון איטי.
 */
export function initAnalytics(page: "landing" | "terms" | "accessibility" | "journal") {
  if (!shouldRun() || enabled) return;
  enabled = true;
  const start = () => void load(page);
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(start, { timeout: 2000 });
  else window.setTimeout(start, 1200);
}

async function load(page: "landing" | "terms" | "accessibility" | "journal") {
  const [{ default: ph }, { inject }, { injectSpeedInsights }] = await Promise.all([
    import("posthog-js"),
    import("@vercel/analytics"),
    import("@vercel/speed-insights"),
  ]);
  posthog = ph;

  posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    defaults: "2025-05-24",
    person_profiles: "identified_only",
    capture_pageview: true,
    debug: isForced(), // לוג בקונסול רק כשמפעילים ידנית
    capture_pageleave: true, // כולל עומק גלילה מקסימלי בכל עמוד
    capture_dead_clicks: true,
    capture_heatmaps: true,
    capture_exceptions: true,
    capture_performance: true,
    cross_subdomain_cookie: true, // אותו מבקר בדף הנחיתה ובהדגמה
    session_recording: { maskAllInputs: page !== "journal" }, // בהדגמת היומן הנתונים בדיוניים
  });
  posthog.register({ site: "landing", page });
  for (const q of queue.splice(0)) posthog.capture(q.event, q.props);

  inject();
  injectSpeedInsights();

  if (page === "landing") {
    watchSections();
    watchFaq();
  }
}

/** אירוע מותאם. בטוח לקרוא גם כשהמדידה כבויה. לפני שפוסטהוג נטען, האירוע נשמר בתור. */
export function track(event: string, props?: Props) {
  if (!enabled) return;
  if (posthog) posthog.capture(event, props);
  else queue.push({ event, props });
}

/** איזה סקשנים המבקר באמת ראה (פעם אחת לכל סקשן). מחכה עד ש-React צייר את הדף. */
function watchSections() {
  if (!("IntersectionObserver" in window)) return;
  if (!document.querySelector("main section[id]")) {
    const mo = new MutationObserver(() => {
      if (document.querySelector("main section[id]")) {
        mo.disconnect();
        watchSections();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    return;
  }
  const seen = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).id;
        if (e.isIntersecting && id && !seen.has(id)) {
          seen.add(id);
          track("section_viewed", { section: id, order: seen.size });
        }
      }
    },
    { threshold: 0.3 },
  );
  document.querySelectorAll<HTMLElement>("main section[id], footer section[id]").forEach((el) => io.observe(el));
}

/** אילו שאלות נפתחות בשאלות הנפוצות. */
function watchFaq() {
  document.addEventListener("toggle", (ev) => {
    const el = ev.target as HTMLDetailsElement | null;
    if (el?.tagName === "DETAILS" && el.open) {
      track("faq_opened", { question: el.querySelector("summary")?.textContent?.trim() ?? "" });
    }
  }, true);
}
