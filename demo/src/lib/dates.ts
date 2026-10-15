// חישובי "היום" בשעון ישראל (גרסה מצומצמת לדמו: גבול חצות).
const TZ = "Asia/Jerusalem";

function ilParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  return parts;
}
export function todayKey(now: Date = new Date()): string {
  const p = ilParts(now);
  return `${p.year}-${p.month}-${p.day}`;
}
export function shiftDayKey(dayKey: string, days: number): string {
  const d = new Date(dayKey + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
/** ראשון של השבוע הישראלי של היום הנתון. */
export function weekStartKey(dayKey: string): string {
  const dow = new Date(dayKey + "T00:00:00Z").getUTCDay(); // 0 = ראשון
  return shiftDayKey(dayKey, -dow);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
