import { useState } from "react";
import { useStore } from "../store";
import { Empty, ScreenTitle } from "../ui";
import { EntrySheet } from "../sheets";
import { isScheduled, streaks, MOOD_LABEL, type Entry } from "../seed";
import { hebrewDate, longDate, shiftDayKey, weekStartKey } from "../dates";

export function Diary() {
  const { state } = useStore();
  const { today } = state;
  const [edit, setEdit] = useState<Entry | null>(null);

  // סיכום השבוע: מיום ראשון עד היום
  const start = weekStartKey(today);
  let sched = 0;
  let done = 0;
  for (let d = start; d <= today; d = shiftDayKey(d, 1)) {
    for (const h of state.habits) {
      if (!isScheduled(h, d)) continue;
      sched++;
      if (state.log[d]?.includes(h.id)) done++;
    }
  }
  const tasksDone = state.tasks.filter((t) => t.done && t.done >= start).length;
  const longest = state.habits.map((h) => ({ h, s: streaks(h, state.log, today).current })).sort((a, b) => b.s - a.s)[0];
  const pct = sched ? Math.round((done / sched) * 100) : 0;

  return (
    <div className="fade">
      <ScreenTitle title="יומן" sub="שלוש שורות ביום. בסוף השבוע זה כבר סיפור." />

      <div className="card mb-4 bg-navy text-cream">
        <p className="text-sm text-cream/70">השבוע, מיום ראשון</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-title text-2xl text-gold">{pct}%</p>
            <p className="text-[11px] text-cream/70">התמדה</p>
          </div>
          <div>
            <p className="font-title text-2xl text-gold">{tasksDone}</p>
            <p className="text-[11px] text-cream/70">משימות הושלמו</p>
          </div>
          <div>
            <p className="font-title text-2xl text-gold">{longest?.s ?? 0}</p>
            <p className="text-[11px] text-cream/70">הרצף הארוך</p>
          </div>
        </div>
        {longest && longest.s > 0 && <p className="mt-3 text-sm text-cream/80">הרצף הארוך: {longest.h.name}.</p>}
      </div>

      {state.entries.length === 0 && <Empty text="עוד אין סיכומי יום. הראשון מחכה במסך היום." />}
      <div className="space-y-3">
        {state.entries.map((e) => {
          const heb = hebrewDate(e.day);
          return (
            <button key={e.day} type="button" className="card w-full text-start" onClick={() => setEdit(e)}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs text-navy/60">
                  {e.day === today ? "היום" : longDate(e.day)}
                  {heb ? ` · ${heb}` : ""}
                </p>
                <span className="pill-muted">{MOOD_LABEL[e.mood]}</span>
              </div>
              {e.good && <p className="text-sm leading-relaxed">{e.good}</p>}
              {e.tomorrow && (
                <p className="mt-1 text-sm text-navy/60">
                  <span className="font-medium">למחר:</span> {e.tomorrow}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {edit && <EntrySheet day={edit.day} existing={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}
