/**
 * זמני היום למיקום בית הכנסת: שקיעה, צאת הכוכבים, הדלקת נרות, וזמני התפילות לפי כללי בית הכנסת.
 * חישוב אסטרונומי (NOAA) בדפדפן, בלי שרת. דיוק של דקה, מספיק ללוח על הדלת.
 * צאת השבת: השמש 8.5 מעלות מתחת לאופק (הלוח המקובל בארץ).
 */
import { shiftDayKey } from "./dates";

const TZ = "Asia/Jerusalem";
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export type Rules = {
  /** דקות לפני השקיעה להדלקת נרות (ירושלים 40, רוב הארץ 20–30) */
  candleOffset: number;
  /** מנחה של ערב שבת: דקות לפני הדלקת נרות */
  minchaErevBeforeCandles: number;
  shacharitShabbat: string;
  /** מנחה של שבת: דקות לפני השקיעה */
  minchaShabbatBeforeSunset: number;
  shacharitWeekday: string;
  /** מנחה בימי חול: דקות לפני השקיעה */
  minchaWeekdayBeforeSunset: number;
};

function utcMinutesAtElevation(dayKey: string, lat: number, lon: number, elevation: number): { noon: number; ha: number } | null {
  const [y, m, d] = dayKey.split("-").map(Number);
  const jd = Date.UTC(y, m - 1, d, 12) / 86400000 + 2440587.5;
  const t = (jd - 2451545) / 36525;
  const L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C = Math.sin(rad(M)) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * t) + Math.sin(rad(3 * M)) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * t;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(rad(omega));
  const decl = Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lambda)));
  const yv = Math.tan(rad(eps / 2)) ** 2;
  const eqTime =
    4 *
    deg(
      yv * Math.sin(2 * rad(L0)) -
        2 * e * Math.sin(rad(M)) +
        4 * e * yv * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) -
        0.5 * yv * yv * Math.sin(4 * rad(L0)) -
        1.25 * e * e * Math.sin(2 * rad(M)),
    );
  const cosHA = (Math.sin(rad(elevation)) - Math.sin(rad(lat)) * Math.sin(decl)) / (Math.cos(rad(lat)) * Math.cos(decl));
  if (cosHA < -1 || cosHA > 1) return null;
  const ha = deg(Math.acos(cosHA));
  const noon = 720 - 4 * lon - eqTime;
  return { noon, ha };
}

function toDate(dayKey: string, utcMinutes: number): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + Math.round(utcMinutes * 60000));
}

export function sunset(dayKey: string, lat: number, lon: number): Date {
  const r = utcMinutesAtElevation(dayKey, lat, lon, -0.833)!;
  return toDate(dayKey, r.noon + 4 * r.ha);
}
export function sunrise(dayKey: string, lat: number, lon: number): Date {
  const r = utcMinutesAtElevation(dayKey, lat, lon, -0.833)!;
  return toDate(dayKey, r.noon - 4 * r.ha);
}
/** צאת הכוכבים / צאת השבת: 8.5 מעלות מתחת לאופק */
export function tzeit(dayKey: string, lat: number, lon: number): Date {
  const r = utcMinutesAtElevation(dayKey, lat, lon, -8.5)!;
  return toDate(dayKey, r.noon + 4 * r.ha);
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
export function hhmm(d: Date): string {
  return timeFmt.format(d);
}
export function addMin(d: Date, min: number): Date {
  return new Date(d.getTime() + min * 60000);
}
/** עיגול כלפי מטה ל-5 דקות (זמני תפילה "עגולים") */
export function floor5(d: Date): Date {
  const ms = 5 * 60000;
  return new Date(Math.floor(d.getTime() / ms) * ms);
}
/** "HH:MM" → תאריך באותו יום (שעון ישראל) */
export function atTime(dayKey: string, hm: string): Date {
  const [h, m] = hm.split(":").map(Number);
  const noonLocal = new Date(dayKey + "T12:00:00Z");
  // הפרש בין UTC לשעון ישראל באותו יום
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(noonLocal);
  const offsetH = Number(parts) - 12;
  return new Date(Date.UTC(...(dayKey.split("-").map(Number).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]), h - offsetH, m));
}

export type ShabbatZmanim = {
  shabbat: string;
  friday: string;
  candles: Date;
  sunsetFri: Date;
  minchaErev: Date;
  shacharit: Date;
  minchaShabbat: Date;
  sunsetSat: Date;
  tzeit: Date;
};

export function shabbatZmanim(shabbat: string, lat: number, lon: number, rules: Rules): ShabbatZmanim {
  const friday = shiftDayKey(shabbat, -1);
  const sunsetFri = sunset(friday, lat, lon);
  const candles = addMin(sunsetFri, -rules.candleOffset);
  const sunsetSat = sunset(shabbat, lat, lon);
  return {
    shabbat,
    friday,
    candles,
    sunsetFri,
    minchaErev: floor5(addMin(candles, -rules.minchaErevBeforeCandles)),
    shacharit: atTime(shabbat, rules.shacharitShabbat),
    minchaShabbat: floor5(addMin(sunsetSat, -rules.minchaShabbatBeforeSunset)),
    sunsetSat,
    tzeit: tzeit(shabbat, lat, lon),
  };
}

export function weekdayZmanim(dayKey: string, lat: number, lon: number, rules: Rules): { shacharit: string; mincha: string; arvit: string } {
  const ss = sunset(dayKey, lat, lon);
  return { shacharit: rules.shacharitWeekday, mincha: hhmm(floor5(addMin(ss, -rules.minchaWeekdayBeforeSunset))), arvit: hhmm(tzeit(dayKey, lat, lon)) };
}

/** כמה דקות נשארו עד זמן נתון, יחסית ל"עכשיו" (לתצוגת "עוד 3 שעות"). */
export function untilLabel(target: Date, now: Date = new Date()): string {
  const min = Math.round((target.getTime() - now.getTime()) / 60000);
  if (min < -60 * 24) return "";
  if (min < 0) return "עבר";
  if (min < 60) return `עוד ${min} דק׳`;
  const h = Math.floor(min / 60);
  if (h < 24) return `עוד ${h} שע׳ ${min % 60 ? `ו-${min % 60} דק׳` : ""}`.trim();
  return `עוד ${Math.round(h / 24)} ימים`;
}
