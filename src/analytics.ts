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
import posthog from "posthog-js";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

export const POSTHOG_TOKEN = "phc_Ao9zMFiwEvJyA7G3LchesR4N7mmJdfggEkrMZF86Z3Lb";
export const POSTHOG_HOST = "https://us.i.posthog.com";

type Props = Record<string, string | number | boolean | null | undefined>;

let enabled = false;

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

/** מאתחל את כל כלי המדידה. לקרוא פעם אחת בכל עמוד. */
export function initAnalytics(page: "landing" | "terms" | "accessibility") {
  if (!shouldRun() || enabled) return;
  enabled = true;

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
    session_recording: { maskAllInputs: true },
  });
  posthog.register({ site: "landing", page });

  inject();
  injectSpeedInsights();

  if (page === "landing") {
    watchSections();
    watchFaq();
  }
}

/** אירוע מותאם. בטוח לקרוא גם כשהמדידה כבויה. */
export function track(event: string, props?: Props) {
  if (!enabled) return;
  posthog.capture(event, props);
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
