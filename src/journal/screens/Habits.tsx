import { useState } from "react";
import { useStore } from "../store";
import { Sheet, ScreenTitle, AreaPicker } from "../ui";
import { isScheduled, rate30, streaks, TIMES, type Area, type Habit, type TimeOfDay } from "../seed";
import { shiftDayKey, WEEKDAY_LETTERS, weekday } from "../dates";

const WEEKDAYS = [0, 1, 2, 3, 4];

export function Habits() {
  const { state, dispatch } = useStore();
  const { today } = state;
  const [addOpen, setAddOpen] = useState(false);
  const [sel, setSel] = useState<Habit | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => shiftDayKey(today, i - 6));

  return (
    <div className="fade">
      <ScreenTitle title="התמדה" sub="שבוע אחרון במבט אחד. לחיצה על היום מסמנת.">
        <button type="button" className="btn-accent !min-h-[40px] px-4 text-sm" onClick={() => setAddOpen(true)}>
          + קביעות
        </button>
      </ScreenTitle>

      <div className="card mb-4 overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr>
              <th className="text-start text-[11px] font-medium text-navy/45">קביעות</th>
              {days.map((d) => (
                <th key={d} className={`w-8 text-center text-[11px] font-medium ${d === today ? "" : "text-navy/45"}`} style={d === today ? { color: "var(--accent)" } : undefined}>
                  {WEEKDAY_LETTERS[weekday(d)]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.habits.map((h) => (
              <tr key={h.id}>
                <td className="py-1 pe-2">
                  <button type="button" className="text-start text-sm leading-tight underline-offset-2 hover:underline" onClick={() => setSel(h)}>
                    {h.name}
                  </button>
                </td>
                {days.map((d) => {
                  const sched = isScheduled(h, d);
                  const on = state.log[d]?.includes(h.id);
                  const isToday = d === today;
                  const cls = `dot ${!sched ? "off" : on ? "on" : ""} ${isToday ? "today" : ""}`;
                  return (
                    <td key={d} className="py-1 text-center">
                      {isToday && sched ? (
                        <button type="button" className={cls} aria-label={`${h.name}, היום`} aria-pressed={!!on} onClick={() => dispatch({ type: "habit_toggle", id: h.id, day: d })} />
                      ) : (
                        <span className={cls} aria-hidden="true" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        {state.habits.map((h) => {
          const st = streaks(h, state.log, today);
          const pct = rate30(h, state.log, today);
          return (
            <button key={h.id} type="button" className="card w-full text-start" onClick={() => setSel(h)}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{h.name}</p>
                  <p className="text-[11px] text-navy/50">
                    {h.area} · {h.time} · {h.days.length === 0 ? "כל יום" : "א׳–ה׳"}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-title text-2xl leading-none" style={{ color: "var(--accent)" }}>
                    {st.current}
                  </p>
                  <p className="text-[11px] text-navy/50">ימים ברצף</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-navy/60">
                <div className="bar flex-1">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <span>{pct}% בחודש האחרון</span>
                <span>· שיא {st.best}</span>
              </div>
            </button>
          );
        })}
      </div>

      <AddHabit open={addOpen} onClose={() => setAddOpen(false)} />

      {sel && (
        <Sheet open onClose={() => setSel(null)} title={sel.name}>
          {(() => {
            const st = streaks(sel, state.log, today);
            const pct = rate30(sel, state.log, today);
            return (
              <div className="mb-5 grid grid-cols-3 gap-2 text-center">
                <div className="card">
                  <p className="font-title text-2xl" style={{ color: "var(--accent)" }}>{st.current}</p>
                  <p className="text-[11px] text-navy/50">רצף נוכחי</p>
                </div>
                <div className="card">
                  <p className="font-title text-2xl">{st.best}</p>
                  <p className="text-[11px] text-navy/50">רצף שיא</p>
                </div>
                <div className="card">
                  <p className="font-title text-2xl">{pct}%</p>
                  <p className="text-[11px] text-navy/50">30 יום</p>
                </div>
              </div>
            );
          })()}
          <p className="mb-4 text-sm text-navy/60">
            {sel.area} · {sel.time} · {sel.days.length === 0 ? "כל יום" : "ימים א׳–ה׳"}
          </p>
          <button
            type="button"
            className="btn-line w-full text-warn"
            onClick={() => {
              dispatch({ type: "habit_remove", id: sel.id });
              setSel(null);
            }}
          >
            להסיר את הקביעות
          </button>
        </Sheet>
      )}
    </div>
  );
}

function AddHabit({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState("");
  const [area, setArea] = useState<Area>("לימוד");
  const [time, setTime] = useState<TimeOfDay>("בוקר");
  const [every, setEvery] = useState(true);
  if (!open) return null;
  const add = () => {
    if (!name.trim()) return;
    dispatch({ type: "habit_add", name, area, time, days: every ? [] : WEEKDAYS });
    setName("");
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title="קביעות חדשה">
      <input className="input mb-4" placeholder="במה רוצים להתמיד?" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} autoFocus />
      <p className="mb-2 text-sm text-navy/60">תחום</p>
      <div className="mb-4">
        <AreaPicker value={area} onChange={(a) => a && setArea(a)} />
      </div>
      <p className="mb-2 text-sm text-navy/60">מתי ביום</p>
      <div className="mb-4 flex gap-2">
        {TIMES.map((t) => (
          <button key={t} type="button" className={`chip ${time === t ? "chip-on" : ""}`} onClick={() => setTime(t)}>
            {t}
          </button>
        ))}
      </div>
      <p className="mb-2 text-sm text-navy/60">באילו ימים</p>
      <div className="mb-5 flex gap-2">
        <button type="button" className={`chip ${every ? "chip-on" : ""}`} onClick={() => setEvery(true)}>
          כל יום
        </button>
        <button type="button" className={`chip ${!every ? "chip-on" : ""}`} onClick={() => setEvery(false)}>
          א׳–ה׳
        </button>
      </div>
      <button type="button" className="btn-accent w-full" onClick={add} disabled={!name.trim()}>
        להוסיף
      </button>
    </Sheet>
  );
}
