/**
 * מדידה בהדגמה: אותו פרויקט PostHog כמו דף הנחיתה (אותה עוגייה, אותו מבקר), עם site: "demo".
 * autocapture מתעד כל לחיצה; בנוסף: מעבר בין מסכים ואיפוס. רץ רק בפרודקשן על הדומיין האמיתי.
 */
import posthog from "posthog-js";

const TOKEN = "phc_Ao9zMFiwEvJyA7G3LchesR4N7mmJdfggEkrMZF86Z3Lb";
let enabled = false;

function isForced(): boolean {
  try {
    return window.localStorage.getItem("ph_force") === "1";
  } catch {
    return false;
  }
}

export function initAnalytics() {
  if (typeof window === "undefined" || !import.meta.env.PROD) return;
  if (!window.location.hostname.endsWith("ephraim-atiya.com") && !isForced()) return;
  enabled = true;
  posthog.init(TOKEN, {
    api_host: "https://us.i.posthog.com",
    ui_host: "https://us.posthog.com",
    defaults: "2025-05-24",
    person_profiles: "identified_only",
    capture_pageview: true,
    debug: isForced(), // לוג בקונסול רק כשמפעילים ידנית
    capture_pageleave: true,
    capture_dead_clicks: true,
    capture_heatmaps: true,
    capture_exceptions: true,
    capture_performance: true,
    cross_subdomain_cookie: true,
    session_recording: { maskAllInputs: false }, // הנתונים בהדגמה בדיוניים
  });
  posthog.register({ site: "demo" });
}

export function track(event: string, props?: Record<string, string | number | boolean>) {
  if (!enabled) return;
  posthog.capture(event, props);
}
