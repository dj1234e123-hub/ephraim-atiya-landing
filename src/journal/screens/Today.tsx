import { useState } from "react";
import { useStore } from "../store";
import { Check, Bar } from "../ui";
import { EntrySheet, TaskSheet } from "../sheets";
import { isScheduled, streaks, MOOD_LABEL, TIMES } from "../seed";
import { dueLabel, greeting, hebrewDate, longDate } from "../dates";

export function Today({ go }: { go: (tab: string) => void }) {
  const { state, dispatch } = useStore();
  const { today, profile } = state;
  const [entryOpen, setEntryOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const scheduled = state.habits.filter((h) => isScheduled(h, today));
  const doneIds = state.log[today] ?? [];
  const doneCount = scheduled.filter((h) => doneIds.includes(h.id)).length;
  const dueTasks = state.tasks.filter((t) => !t.done && t.due && t.due <= today).sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));
  const entry = state.entries.find((e) => e.day === today);
  const heb = hebrewDate(today);

  return (
    <div className="fade">
      <div className="card mb-4 bg-navy text-cream">
        <p className="text-sm text-cream/70">{longDate(today)}{heb ? ` · ${heb}` : ""}</p>
        <p className="mt-1 font-title text-2xl">
          {greeting()}
          {profile.name ? `, ${profile.name}` : ""}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <Bar value={doneCount} max={scheduled.length} />
          </div>
          <p className="text-sm text-cream/80">
            <b className="font-title text-xl text-gold">{doneCount}</b> / {scheduled.length} קביעויות
          </p>
        </div>
        {doneCount === scheduled.length && scheduled.length > 0 && <p className="mt-2 text-sm text-gold">כל הקביעויות של היום סומנו. יום שלם.</p>}
      </div>

      <section className="card mb-4" aria-labelledby="today-habits">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="today-habits" className="font-medium">
            הקביעויות של היום
          </h2>
          <button type="button" className="text-xs text-navy/60 underline-offset-2 hover:underline" onClick={() => go("habits")}>
            התמדה ←
          </button>
        </div>
        {TIMES.map((time) => {
          const list = scheduled.filter((h) => h.time === time);
          if (!list.length) return null;
          return (
            <div key={time}>
              <p className="mt-2 text-[11px] font-medium text-navy/45">{time}</p>
              {list.map((h) => {
                const on = doneIds.includes(h.id);
                const st = streaks(h, state.log, today);
                return (
                  <div key={h.id} className="row">
                    <Check on={on} onChange={() => dispatch({ type: "habit_toggle", id: h.id, day: today })} label={h.name} />
                    <div className="flex-1">
                      <p className={`text-sm ${on ? "text-navy/50 line-through" : ""}`}>{h.name}</p>
                      <p className="text-[11px] text-navy/50">{h.area}</p>
                    </div>
                    {st.current > 0 && <span className="tag">רצף {st.current}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      <section className="card mb-4" aria-labelledby="today-tasks">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="today-tasks" className="font-medium">
            משימות להיום
          </h2>
          <button type="button" className="text-xs font-medium underline-offset-2 hover:underline" style={{ color: "var(--accent)" }} onClick={() => setTaskOpen(true)}>
            + משימה
          </button>
        </div>
        {dueTasks.length === 0 && <p className="py-4 text-center text-sm text-navy/50">אין משימות פתוחות להיום. אפשר לנשום.</p>}
        {dueTasks.map((t) => {
          const d = dueLabel(t.due, today);
          return (
            <div key={t.id} className="row">
              <Check on={false} onChange={() => dispatch({ type: "task_toggle", id: t.id })} label={t.title} />
              <div className="flex-1">
                <p className="text-sm">{t.title}</p>
                <p className="text-[11px] text-navy/50">{t.area}</p>
              </div>
              {d.late ? <span className="pill-warn">{d.text}</span> : <span className="pill-muted">{d.text}</span>}
            </div>
          );
        })}
        <button type="button" className="mt-2 w-full text-center text-xs text-navy/60 underline-offset-2 hover:underline" onClick={() => go("tasks")}>
          לכל המשימות ←
        </button>
      </section>

      <section className="card mb-4" aria-labelledby="today-entry">
        <h2 id="today-entry" className="mb-1 font-medium">
          סיכום היום
        </h2>
        {entry ? (
          <div>
            <span className="pill-muted">{MOOD_LABEL[entry.mood]}</span>
            {entry.good && <p className="mt-2 text-sm leading-relaxed">{entry.good}</p>}
            {entry.tomorrow && (
              <p className="mt-1 text-sm text-navy/60">
                <span className="font-medium">למחר:</span> {entry.tomorrow}
              </p>
            )}
            <button type="button" className="mt-3 text-xs text-navy/60 underline-offset-2 hover:underline" onClick={() => setEntryOpen(true)}>
              לערוך
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-navy/60">שלוש שורות בסוף היום. מה היה טוב, ומה הדבר האחד למחר.</p>
            <button type="button" className="btn-line w-full" onClick={() => setEntryOpen(true)}>
              לסכם את היום
            </button>
          </>
        )}
      </section>

      {state.actions.length > 0 && (
        <div className="rounded-2xl border border-dashed p-3 text-xs text-navy/60" style={{ borderColor: "var(--accent)" }}>
          <p className="mb-1 font-medium" style={{ color: "var(--accent)" }}>
            מה עשיתם בהדגמה
          </p>
          {state.actions.slice(0, 4).map((l, i) => (
            <p key={i}>· {l}</p>
          ))}
        </div>
      )}

      {entryOpen && <EntrySheet day={today} existing={entry} onClose={() => setEntryOpen(false)} />}
      <TaskSheet open={taskOpen} onClose={() => setTaskOpen(false)} today={today} />
    </div>
  );
}
