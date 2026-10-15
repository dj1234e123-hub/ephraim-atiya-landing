import { useStore } from "../store";
import { ScreenTitle, fmtDate } from "../components/ui";
import { hebrewDayInfo, hebrewDayBadge } from "../lib/hebcal";
import { nis, SHUL } from "../seed";

export function Home({ go }: { go: (tab: string) => void }) {
  const { state } = useStore();
  const info = hebrewDayInfo(state.today);
  const badge = hebrewDayBadge(info);
  const assigned = state.aliyot.filter((a) => a.memberId).length;
  const openNedarim = state.nedarim.filter((n) => !n.paid);
  const openSum = openNedarim.reduce((s, n) => s + n.amount, 0);
  const openTickets = state.tickets.filter((t) => t.status !== "סגור");
  const monthDonations = state.donations.filter((d) => d.date.slice(0, 7) === state.today.slice(0, 7)).reduce((s, d) => s + d.amount, 0);
  const next = [...state.events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  return (
    <div className="fade">
      <ScreenTitle title={`${SHUL.name}`} instead="הפתקים על הבימה והראש של הגבאי" />
      <div className="card mb-4 bg-navy text-cream">
        <p className="text-sm text-cream/70">{info.label}{badge ? ` · ${badge}` : ""}</p>
        <p className="mt-1 font-title text-2xl">פרשת {state.parsha.niqqud || state.parsha.name}</p>
        {state.parsha.note && <p className="text-sm text-gold">{state.parsha.note}</p>}
        <p className="mt-2 text-sm text-cream/80">שבת {fmtDate(state.parsha.shabbat)} · {SHUL.place}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <button className="card text-start" onClick={() => go("aliyot")}>
          <p className="text-xs text-navy/60">עליות לשבת</p>
          <p className="font-title text-2xl">{assigned}<span className="text-base text-navy/50"> / {state.aliyot.length}</span></p>
          <p className={`mt-1 text-xs ${assigned < state.aliyot.length ? "text-warn" : "text-ok"}`}>{assigned < state.aliyot.length ? `${state.aliyot.length - assigned} עוד לשבץ` : "הכול משובץ"}</p>
        </button>
        <button className="card text-start" onClick={() => go("members")}>
          <p className="text-xs text-navy/60">נדרים פתוחים</p>
          <p className="font-title text-2xl">{nis(openSum)}</p>
          <p className="mt-1 text-xs text-navy/50">{openNedarim.length} נדרים · לחיצה לתזכורת</p>
        </button>
        <button className="card text-start" onClick={() => go("money")}>
          <p className="text-xs text-navy/60">תרומות החודש</p>
          <p className="font-title text-2xl">{nis(monthDonations)}</p>
          <p className="mt-1 text-xs text-navy/50">{state.donations.length} רישומים</p>
        </button>
        <button className="card text-start" onClick={() => go("fix")}>
          <p className="text-xs text-navy/60">תקלות פתוחות</p>
          <p className="font-title text-2xl">{openTickets.length}</p>
          <p className="mt-1 text-xs text-navy/50">{openTickets.filter((t) => t.urgent).length} דחופות</p>
        </button>
      </div>

      <div className="card mb-4">
        <p className="mb-2 font-medium">בקרוב</p>
        {next.map((e) => (
          <div key={e.id} className="row">
            <span className="pill-muted">{e.kind}</span>
            <span className="flex-1 text-sm">{e.title}</span>
            <span className="text-xs text-navy/50">{fmtDate(e.date)}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="mb-2 font-medium">הודעה אחרונה לציבור</p>
        <p className="text-sm leading-relaxed text-navy/80">{state.messages[0]?.text}</p>
        <p className="mt-1 text-xs text-navy/50">{state.messages[0] && fmtDate(state.messages[0].date)} · {state.messages[0]?.to}</p>
      </div>

      {state.log.length > 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-gold-deep/40 p-3 text-xs text-navy/60">
          <p className="mb-1 font-medium text-gold-deep">מה עשיתם בהדגמה</p>
          {state.log.slice(0, 4).map((l, i) => (
            <p key={i}>· {l}</p>
          ))}
        </div>
      )}
    </div>
  );
}
