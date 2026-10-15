import { useMemo, useState } from "react";
import { useStore, memberName } from "../store";
import { ScreenTitle, Sheet, WaPreview, fmtDate } from "../components/ui";
import { hebrewDayInfo } from "../lib/hebcal";
import { hhmm, untilLabel } from "../lib/zmanim";
import { zmanimFor, familyName } from "../lib/shul";
import { buildReminders, type Reminder } from "../lib/reminders";
import { nis } from "../seed";
import { track } from "../analytics";

export function Home({ go }: { go: (tab: string) => void }) {
  const { state, dispatch } = useStore();
  const info = hebrewDayInfo(state.parsha.shabbat);
  const z = zmanimFor(state);
  const assigned = state.aliyot.filter((a) => a.memberId).length;
  const prepDone = state.prep.tasks.filter((t) => t.done).length;
  const openNedarim = state.nedarim.filter((n) => !n.paid);
  const openSum = openNedarim.reduce((s, n) => s + n.amount, 0);
  const yahrzeits = state.members.filter((m) => m.yahrzeit);
  const k = state.kiddushim[0];
  const kiddushName = k?.sponsorMemberId ? memberName(state, k.sponsorMemberId) : k?.sponsorName ?? "";
  const reminders = useMemo(() => buildReminders(state), [state]);
  const [rem, setRem] = useState<Reminder | null>(null);
  const openTickets = state.tickets.filter((t) => t.status !== "סגור" && t.urgent).length;

  const row = (label: string, time: string, sub?: string) => (
    <div className="flex items-baseline justify-between border-b border-cream/10 py-1.5 last:border-b-0">
      <span className="text-sm text-cream/80">{label}{sub && <span className="text-cream/50"> · {sub}</span>}</span>
      <span className="font-title text-xl tabular-nums" dir="ltr">{time}</span>
    </div>
  );

  return (
    <div className="fade">
      <ScreenTitle title="השבת הקרובה" instead="הכול בראש של הגבאי, עד יום שישי בצהריים" />

      <div className="card mb-4 bg-navy text-cream">
        <p className="text-sm text-cream/70">{info.label} · {fmtDate(state.parsha.shabbat)}</p>
        <p className="mt-1 font-title text-2xl">פרשת {state.parsha.niqqud || state.parsha.name}</p>
        {state.parsha.note && <p className="text-sm text-gold">{state.parsha.note}</p>}
        <p className="mb-3 mt-1 text-xs text-cream/60">{state.shul.place} · נוסח {state.shul.nusach} · זמנים מחושבים למיקום בית הכנסת</p>
        {row("הדלקת נרות", hhmm(z.candles), untilLabel(z.candles))}
        {row("מנחה וקבלת שבת", hhmm(z.minchaErev))}
        {row("שחרית", hhmm(z.shacharit))}
        {row("מנחה", hhmm(z.minchaShabbat))}
        {row("צאת השבת", hhmm(z.tzeit))}
        <a href="#print/shabbat" className="btn-gold mt-4 w-full !min-h-[44px] text-sm" onClick={() => track("demo_print_open", { kind: "shabbat", from: "home" })}>
          להדפיס דף שבת לדלת ולבימה
        </a>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button className="card text-start" onClick={() => go("shabbat")}>
          <p className="text-xs text-navy/60">הכנות לשבת</p>
          <p className="font-title text-2xl">{prepDone}<span className="text-base text-navy/50"> / {state.prep.tasks.length}</span></p>
          <p className={`mt-1 text-xs ${prepDone < state.prep.tasks.length ? "text-warn" : "text-ok"}`}>{prepDone < state.prep.tasks.length ? `${state.prep.tasks.length - prepDone} עוד לעשות` : "הכול מוכן"}</p>
        </button>
        <button className="card text-start" onClick={() => go("aliyot")}>
          <p className="text-xs text-navy/60">עליות לשבת</p>
          <p className="font-title text-2xl">{assigned}<span className="text-base text-navy/50"> / {state.aliyot.length}</span></p>
          <p className={`mt-1 text-xs ${assigned < state.aliyot.length ? "text-warn" : "text-ok"}`}>{assigned < state.aliyot.length ? `${state.aliyot.length - assigned} עוד לשבץ` : "הכול משובץ"}</p>
        </button>
        <button className="card text-start" onClick={() => go("shabbat")}>
          <p className="text-xs text-navy/60">קידוש השבת</p>
          <p className="font-title text-lg leading-tight">{kiddushName ? `משפחת ${familyName(kiddushName)}` : "אין חסות"}</p>
          <p className={`mt-1 text-xs ${kiddushName ? "text-ok" : "text-warn"}`}>{k?.occasion || "לחפש נותן חסות"}</p>
        </button>
        <button className="card text-start" onClick={() => go("members")}>
          <p className="text-xs text-navy/60">נדרים פתוחים</p>
          <p className="font-title text-2xl">{nis(openSum)}</p>
          <p className="mt-1 text-xs text-navy/50">{openNedarim.length} נדרים · {openTickets > 0 ? `${openTickets} תקלות דחופות` : "אין תקלות דחופות"}</p>
        </button>
      </div>

      <div className="card mb-4">
        <p className="mb-2 font-medium">אזכרות השבוע</p>
        {yahrzeits.length === 0 && <p className="text-sm text-navy/50">אין אזכרות השבוע.</p>}
        {yahrzeits.map((m) => (
          <div key={m.id} className="row">
            <span className="flex-1">
              <span className="block text-sm font-medium">{m.name}</span>
              <span className="block text-xs text-navy/50">{m.yahrzeitFor} · {state.aliyot.some((a) => a.memberId === m.id) ? "עלייה שובצה" : "עוד לא שובצה עלייה"}</span>
            </span>
            <span className={state.aliyot.some((a) => a.memberId === m.id) ? "pill-ok" : "pill-warn"}>{state.aliyot.some((a) => a.memberId === m.id) ? "מסודר" : "לשבץ"}</span>
          </div>
        ))}
      </div>

      <div className="card mb-4 p-2">
        <div className="flex items-center justify-between px-2 pt-1">
          <p className="font-medium">תזכורות שהמערכת הכינה</p>
          <span className="pill-muted">{reminders.length}</span>
        </div>
        <p className="px-2 pb-1 text-xs text-navy/50">במערכת האמיתית יוצאות לבד, בוואטסאפ או ב-SMS. כאן רואים את הנוסח.</p>
        {reminders.length === 0 && <p className="p-3 text-sm text-navy/50">הכול נשלח. שבת שלום.</p>}
        {reminders.slice(0, 6).map((r) => (
          <button key={r.key} className="row w-full px-2 text-start" onClick={() => setRem(r)}>
            <span className="pill-muted w-14 justify-center text-center">{r.kind}</span>
            <span className="flex-1">
              <span className="block text-sm">{r.title}</span>
              <span className="block text-xs text-navy/50">{r.when}</span>
            </span>
            <span className="text-xs text-gold-deep">לצפות ←</span>
          </button>
        ))}
        {reminders.length > 6 && <p className="p-2 text-center text-xs text-navy/50">ועוד {reminders.length - 6}</p>}
      </div>

      {state.log.length > 0 && (
        <div className="rounded-2xl border border-dashed border-gold-deep/40 p-3 text-xs text-navy/60">
          <p className="mb-1 font-medium text-gold-deep">מה עשיתם בהדגמה</p>
          {state.log.slice(0, 4).map((l, i) => (
            <p key={i}>· {l}</p>
          ))}
        </div>
      )}

      <Sheet open={!!rem} onClose={() => setRem(null)} title={rem?.title ?? ""}>
        {rem && (
          <>
            <WaPreview to={rem.to} text={rem.text} />
            <button className="btn-gold mt-4 w-full" onClick={() => { dispatch({ type: "reminder_sent", key: rem.key, to: rem.to, text: rem.text }); setRem(null); }}>
              שלח (הדגמה, לא נשלח באמת)
            </button>
            <p className="mt-2 text-center text-xs text-navy/50">מועד שליחה במערכת האמיתית: {rem.when}. גם ב-SMS למי שאין וואטסאפ.</p>
          </>
        )}
      </Sheet>
    </div>
  );
}
