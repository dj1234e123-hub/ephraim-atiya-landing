import { useMemo, useState } from "react";
import { useStore, memberName } from "../store";
import { Sheet } from "../components/ui";
import { nis } from "../seed";

/** מקומות ישיבה לימים נוראים: גרסה ראשונה, רשימה לפי שורות, בלי מפה גרפית. */
export function Seats() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const seat = state.seats.find((s) => s.id === open);
  const taken = state.seats.filter((s) => s.memberId);
  const paid = taken.filter((s) => s.paid);
  const income = paid.reduce((a, s) => a + s.price, 0);
  const owed = taken.filter((s) => !s.paid).reduce((a, s) => a + s.price, 0);
  const rows = useMemo(() => {
    const r = new Map<number, typeof state.seats>();
    for (const s of state.seats) r.set(s.row, [...(r.get(s.row) ?? []), s]);
    return [...r.entries()];
  }, [state.seats]);
  const assignedIds = new Set(taken.map((s) => s.memberId));
  const matches = q ? state.members.filter((m) => !m.guest && !assignedIds.has(m.id) && m.name.includes(q)).slice(0, 6) : [];

  return (
    <div className="fade">
      <div className="card mb-3 grid grid-cols-3 gap-2 text-center">
        <div><p className="font-title text-2xl">{taken.length}<span className="text-sm text-navy/50">/{state.seats.length}</span></p><p className="text-xs text-navy/60">מקומות תפוסים</p></div>
        <div><p className="font-title text-2xl">{nis(income)}</p><p className="text-xs text-navy/60">שולם</p></div>
        <div><p className="font-title text-2xl text-warn">{nis(owed)}</p><p className="text-xs text-navy/60">עוד לגבות</p></div>
      </div>
      <p className="mb-2 text-xs text-navy/50">לחיצה על מקום: לשבץ, לפנות, או לסמן שולם. ירוק שולם, צהוב משובץ ולא שולם, לבן פנוי.</p>
      <div className="card space-y-2 p-3">
        {rows.map(([row, seats]) => (
          <div key={row} className="flex items-center gap-1">
            <span className="w-8 shrink-0 text-xs text-navy/50">ש׳ {row}</span>
            <div className="grid flex-1 grid-cols-10 gap-1">
              {seats.map((s) => (
                <button
                  key={s.id}
                  title={s.memberId ? memberName(state, s.memberId) : "פנוי"}
                  className={`aspect-square rounded-md border text-[9px] ${s.memberId ? (s.paid ? "border-ok bg-ok/20" : "border-warn bg-warn/15") : "border-navy/15 bg-white"}`}
                  onClick={() => { setOpen(s.id); setQ(""); }}
                >
                  {s.num}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="pt-1 text-center text-[11px] text-navy/50">שורות 1–2: {nis(500)} · 3–5: {nis(360)} · 6–8: {nis(180)}</p>
      </div>

      <Sheet open={!!seat} onClose={() => setOpen(null)} title={seat ? `שורה ${seat.row}, מקום ${seat.num} · ${nis(seat.price)}` : ""}>
        {seat && seat.memberId && (
          <>
            <p className="font-medium">{memberName(state, seat.memberId)}</p>
            <p className="mb-4 text-sm text-navy/60">{seat.paid ? "שולם" : "עוד לא שולם"}</p>
            <div className="flex gap-2">
              {!seat.paid && <button className="btn-navy flex-1" onClick={() => { dispatch({ type: "seat_paid", seatId: seat.id }); setOpen(null); }}>סמן שולם</button>}
              <button className="btn-line flex-1" onClick={() => { dispatch({ type: "seat_assign", seatId: seat.id, memberId: null }); setOpen(null); }}>לפנות מקום</button>
            </div>
          </>
        )}
        {seat && !seat.memberId && (
          <>
            <input className="input" placeholder="למי לשבץ? (שם)" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="mt-1 rounded-xl bg-white shadow-card">
              {matches.map((m) => (
                <button key={m.id} className="block w-full px-4 py-2 text-start text-sm hover:bg-navy/5" onClick={() => { dispatch({ type: "seat_assign", seatId: seat.id, memberId: m.id }); setOpen(null); }}>{m.name}</button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-navy/50">במערכת האמיתית: מפת ישיבה גרפית, ומכתב למתפלל עם מספר המקום.</p>
          </>
        )}
      </Sheet>
    </div>
  );
}
