import { useMemo, useState } from "react";
import { useStore } from "../store";
import { ScreenTitle, Sheet, fmtDate } from "../components/ui";
import { nis } from "../seed";

const PURPOSES = ["קידוש", "נר תמיד", "ספרים", "תחזוקה", "חנוכה", "כללי"];

export function Money() {
  const { state, dispatch } = useStore();
  const [add, setAdd] = useState(false);
  const [who, setWho] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [amount, setAmount] = useState(180);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const byId = useMemo(() => new Map(state.members.map((m) => [m.id, m])), [state.members]);
  const month = state.today.slice(0, 7);
  const monthSum = state.donations.filter((d) => d.date.slice(0, 7) === month).reduce((s, d) => s + d.amount, 0);
  const byPurpose = Object.entries(state.donations.filter((d) => d.date.slice(0, 7) === month).reduce<Record<string, number>>((acc, d) => ((acc[d.purpose] = (acc[d.purpose] ?? 0) + d.amount), acc), {})).sort((a, b) => b[1] - a[1]);
  const events = [...state.events].sort((a, b) => a.date.localeCompare(b.date));
  const matches = who ? state.members.filter((m) => !m.guest && m.name.includes(who)).slice(0, 5) : [];

  return (
    <div className="fade">
      <ScreenTitle title="תרומות ואירועים" instead="קבלות בכיס ופתקים במגירה">
        <button className="btn-navy !min-h-[40px] !px-4 text-sm" onClick={() => setAdd(true)}>+ תרומה</button>
      </ScreenTitle>

      <div className="card mb-4">
        <p className="text-xs text-navy/60">תרומות החודש</p>
        <p className="font-title text-3xl">{nis(monthSum)}</p>
        <div className="mt-3 space-y-1.5">
          {byPurpose.map(([p, v]) => (
            <div key={p} className="flex items-center gap-2 text-xs">
              <span className="w-20 text-navy/60">{p}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-navy/5"><span className="block h-full bg-gold" style={{ width: `${Math.max(6, (v / monthSum) * 100)}%` }} /></span>
              <span className="w-16 text-end">{nis(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-4 p-2">
        <p className="px-2 pt-1 font-medium">אירועים קרובים</p>
        {events.map((e) => (
          <div key={e.id} className="row px-2">
            <span className="pill-muted">{e.kind}</span>
            <span className="flex-1 text-sm">{e.title}</span>
            <span className="text-xs text-navy/50">{fmtDate(e.date)}</span>
          </div>
        ))}
      </div>

      <div className="card p-2">
        <p className="px-2 pt-1 font-medium">תרומות אחרונות</p>
        {state.donations.slice(0, 8).map((d) => (
          <div key={d.id} className="row px-2">
            <span className="flex-1">
              <span className="block text-sm">{d.memberId ? byId.get(d.memberId)?.name : d.donor}</span>
              <span className="block text-xs text-navy/50">{d.purpose} · {fmtDate(d.date)}</span>
            </span>
            <span className="font-medium">{nis(d.amount)}</span>
          </div>
        ))}
      </div>

      <Sheet open={add} onClose={() => setAdd(false)} title="רישום תרומה">
        <input className="input" placeholder="מי תרם? (שם)" value={who} onChange={(e) => { setWho(e.target.value); setMemberId(null); }} />
        {matches.length > 0 && !memberId && (
          <div className="mt-1 rounded-xl bg-white shadow-card">
            {matches.map((m) => (
              <button key={m.id} className="block w-full px-4 py-2 text-start text-sm hover:bg-navy/5" onClick={() => { setWho(m.name); setMemberId(m.id); }}>{m.name}</button>
            ))}
          </div>
        )}
        <p className="mb-2 mt-4 text-sm text-navy/60">סכום</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {[50, 100, 180, 360, 500, 1000].map((v) => (
            <button key={v} className={`chip ${amount === v ? "chip-on" : ""}`} onClick={() => setAmount(v)}>{v} ₪</button>
          ))}
        </div>
        <p className="mb-2 text-sm text-navy/60">עבור</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {PURPOSES.map((p) => (
            <button key={p} className={`chip ${purpose === p ? "chip-on" : ""}`} onClick={() => setPurpose(p)}>{p}</button>
          ))}
        </div>
        <button className="btn-navy w-full" disabled={!who} onClick={() => { dispatch({ type: "donation_add", memberId, donor: memberId ? undefined : who, amount, purpose }); setAdd(false); setWho(""); setMemberId(null); }}>
          לרשום {nis(amount)}
        </button>
        <p className="mt-2 text-center text-xs text-navy/50">במערכת האמיתית: קבלה נשלחת לתורם בוואטסאפ אוטומטית.</p>
      </Sheet>
    </div>
  );
}
