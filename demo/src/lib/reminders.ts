/**
 * תזכורות שהמערכת מכינה לבד מתוך הנתונים. בהדגמה רואים את הנוסח ומסמנים "נשלח".
 * במערכת האמיתית: יוצאות אוטומטית בוואטסאפ או ב-SMS, במועד שנקבע.
 */
import type { State } from "../seed";
import { nis } from "../seed";
import { daysBetween } from "./dates";
import { hhmm } from "./zmanim";
import { zmanimFor, firstName, familyName } from "./shul";
import { fmtDate } from "../components/ui";

export type Reminder = { key: string; kind: "אזכרה" | "עלייה" | "נדר" | "הכנות" | "תודה" | "קידוש"; to: string; title: string; text: string; when: string };

export function buildReminders(state: State): Reminder[] {
  const out: Reminder[] = [];
  const z = zmanimFor(state);
  const shul = state.shul.name;
  const parsha = state.parsha.name;
  const sat = fmtDate(state.parsha.shabbat);

  for (const m of state.members.filter((x) => x.yahrzeit)) {
    out.push({
      key: `yz-${m.id}-${state.parsha.shabbat}`,
      kind: "אזכרה",
      to: m.name,
      title: `אזכרה: ${m.name}`,
      when: "שבוע לפני",
      text: `שלום ${firstName(m.name)}, מבית הכנסת ${shul}: האזכרה של ${m.yahrzeitFor ?? "יקירך"} חלה השבוע. רשמנו לך עלייה בשבת פרשת ${parsha} (${sat}), שחרית ב-${hhmm(z.shacharit)}. אם תרצה קידוש או לימוד משניות, כתוב לנו. תנצב״ה.`,
    });
  }

  for (const a of state.aliyot) {
    if (!a.memberId) continue;
    const m = state.members.find((x) => x.id === a.memberId);
    if (!m || m.guest) continue;
    out.push({
      key: `al-${a.key}-${m.id}-${state.parsha.shabbat}`,
      kind: "עלייה",
      to: m.name,
      title: `עלייה ${a.name}: ${m.name}`,
      when: "יום חמישי",
      text: `שלום ${firstName(m.name)}, בשבת פרשת ${parsha} (${sat}) יש לך עלייה "${a.name}" (${a.range}). שחרית ב-${hhmm(z.shacharit)}. בית הכנסת ${shul}.`,
    });
  }

  const owing = new Map<string, number>();
  for (const n of state.nedarim) {
    if (n.paid || daysBetween(n.date, state.today) < 14) continue;
    owing.set(n.memberId, (owing.get(n.memberId) ?? 0) + n.amount);
  }
  [...owing.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([id, sum]) => {
      const m = state.members.find((x) => x.id === id);
      if (!m) return;
      out.push({
        key: `nd-${id}-${state.today.slice(0, 7)}`,
        kind: "נדר",
        to: m.name,
        title: `נדרים פתוחים: ${m.name}`,
        when: "שבועיים אחרי",
        text: `שלום ${firstName(m.name)}, תזכורת ידידותית מבית הכנסת ${shul}: נדרים פתוחים על סך ${nis(sum)}. אפשר להסדיר בביט למספר של בית הכנסת או במזומן לגבאי. תזכו למצוות!`,
      });
    });

  const dutyTask = state.prep.tasks.find((t) => t.id === "p-urn");
  if (dutyTask) {
    const open = state.prep.tasks.filter((t) => t.owner === dutyTask.owner && !t.done);
    out.push({
      key: `duty-${state.parsha.shabbat}`,
      kind: "הכנות",
      to: dutyTask.owner,
      title: `תורן ההכנות: ${dutyTask.owner}`,
      when: "יום חמישי",
      text: `שלום ${firstName(dutyTask.owner)}, השבוע אתה על ההכנות לשבת ב${shul}. הדלקת נרות ${hhmm(z.candles)}.\n${open.map((t) => `• ${t.title}`).join("\n")}\nתודה!`,
    });
  }

  for (const so of state.standingOrders.filter((x) => !x.thanked)) {
    const m = state.members.find((x) => x.id === so.memberId);
    if (!m) continue;
    out.push({
      key: `so-${so.id}`,
      kind: "תודה",
      to: m.name,
      title: `תודה על הוראת קבע: ${m.name}`,
      when: "מיד",
      text: `${firstName(m.name)} היקר, נכנסה הוראת קבע חדשה על סך ${nis(so.amount)} לחודש לבית הכנסת ${shul}. תודה רבה! בזכותך האור דולק, המזגן עובד והקידוש על השולחן. מכתב תודה מודפס מחכה לך בבית הכנסת. ועד בית הכנסת.`,
    });
  }

  const k = state.kiddushim[0];
  if (k && (k.sponsorMemberId || k.sponsorName)) {
    const name = k.sponsorMemberId ? state.members.find((x) => x.id === k.sponsorMemberId)?.name ?? "" : k.sponsorName ?? "";
    out.push({
      key: `kd-${k.shabbat}`,
      kind: "קידוש",
      to: "כל המתפללים",
      title: `הודעה לציבור: קידוש השבת`,
      when: "יום חמישי",
      text: `שבת שלום! הקידוש השבת (פרשת ${parsha}) לכבוד ${k.occasion}, באדיבות משפחת ${familyName(name)}. מנחה וקבלת שבת ב-${hhmm(z.minchaErev)}, הדלקת נרות ${hhmm(z.candles)}. בית הכנסת ${shul}.`,
    });
  }

  return out.filter((r) => !state.sentReminders.includes(r.key));
}
