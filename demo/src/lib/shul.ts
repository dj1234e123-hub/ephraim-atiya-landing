/** עזרים משותפים: זמני השבת הקרובה, שעות יעד למשימות, שמות משפחה. */
import type { PrepTask, State } from "../seed";
import { shabbatZmanim, addMin, hhmm, type ShabbatZmanim } from "./zmanim";
import { hebrewDayInfo } from "./hebcal";
import { fmtDate } from "../components/ui";

export function zmanimFor(state: State, shabbat: string = state.parsha.shabbat): ShabbatZmanim {
  return shabbatZmanim(shabbat, state.shul.lat, state.shul.lon, state.shul.rules);
}

/** שעת היעד של משימת הכנה, יחסית להדלקת הנרות */
export function dueLabel(task: PrepTask, z: ShabbatZmanim): string {
  if (task.dueMin === null) return "במהלך השבוע";
  return `עד ${hhmm(addMin(z.candles, -task.dueMin))}`;
}
export function dueDate(task: PrepTask, z: ShabbatZmanim): Date | null {
  return task.dueMin === null ? null : addMin(z.candles, -task.dueMin);
}

export function familyName(fullName: string): string {
  const parts = fullName.replace(/^אורח:\s*/, "").split(" ");
  return parts[parts.length - 1];
}
export function firstName(fullName: string): string {
  return fullName.replace(/^אורח:\s*/, "").split(" ")[0];
}

/** "שבת פרשת נח, י״ג בחשוון תשפ״ז (24.10.26)" */
export function shabbatTitle(state: State): string {
  const info = hebrewDayInfo(state.parsha.shabbat);
  return `שבת פרשת ${state.parsha.name}, ${info.label} (${fmtDate(state.parsha.shabbat)})`;
}

export function hebrewLabel(dayKey: string): string {
  return hebrewDayInfo(dayKey).label;
}
