import { useState } from "react";
import { useStore } from "../store";
import { Check, Empty, ScreenTitle, AreaPicker, Sheet } from "../ui";
import { TaskSheet } from "../sheets";
import { type Area, type Task } from "../seed";
import { dueLabel, shiftDayKey, shortDate } from "../dates";

export function Tasks() {
  const { state, dispatch } = useStore();
  const { today } = state;
  const [area, setArea] = useState<Area | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sel, setSel] = useState<Task | null>(null);

  const visible = state.tasks.filter((t) => !area || t.area === area);
  const open = visible
    .filter((t) => !t.done)
    .sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });
  const done = visible.filter((t) => t.done).sort((a, b) => (b.done ?? "").localeCompare(a.done ?? ""));

  return (
    <div className="fade">
      <ScreenTitle title="משימות" sub={`${open.length} פתוחות`}>
        <button type="button" className="btn-accent !min-h-[40px] px-4 text-sm" onClick={() => setAddOpen(true)}>
          + משימה
        </button>
      </ScreenTitle>

      <div className="mb-4">
        <AreaPicker value={area} onChange={setArea} all />
      </div>

      <div className="card">
        {open.length === 0 && <Empty text="אין משימות פתוחות בתחום הזה." />}
        {open.map((t) => {
          const d = dueLabel(t.due, today);
          return (
            <div key={t.id} className="row">
              <Check on={false} onChange={() => dispatch({ type: "task_toggle", id: t.id })} label={t.title} />
              <button type="button" className="flex-1 text-start" onClick={() => setSel(t)}>
                <p className="text-sm">{t.title}</p>
                <p className="text-[11px] text-navy/50">{t.area}</p>
              </button>
              {t.due ? d.late ? <span className="pill-warn">{d.text}</span> : <span className="pill-muted">{d.text}</span> : null}
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-navy/60">הושלמו ({done.length})</summary>
          <div className="card mt-2">
            {done.map((t) => (
              <div key={t.id} className="row">
                <Check on onChange={() => dispatch({ type: "task_toggle", id: t.id })} label={t.title} />
                <div className="flex-1">
                  <p className="text-sm text-navy/50 line-through">{t.title}</p>
                  <p className="text-[11px] text-navy/40">
                    {t.area} · הושלם {t.done ? shortDate(t.done) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      <TaskSheet open={addOpen} onClose={() => setAddOpen(false)} today={today} defaultArea={area} />

      {sel && <EditTask task={sel} today={today} onClose={() => setSel(null)} />}
    </div>
  );
}

function EditTask({ task, today, onClose }: { task: Task; today: string; onClose: () => void }) {
  const { dispatch } = useStore();
  const [area, setArea] = useState<Area>(task.area);
  const [due, setDue] = useState<string | null>(task.due);
  const choices: Array<[string, string | null]> = [
    ["היום", today],
    ["מחר", shiftDayKey(today, 1)],
    ["בעוד שבוע", shiftDayKey(today, 7)],
    ["בלי תאריך", null],
  ];
  return (
    <Sheet open onClose={onClose} title={task.title}>
      <p className="mb-2 text-sm text-navy/60">תחום</p>
      <div className="mb-4">
        <AreaPicker value={area} onChange={(a) => a && setArea(a)} />
      </div>
      <p className="mb-2 text-sm text-navy/60">מתי</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {choices.map(([label, key]) => (
          <button key={label} type="button" className={`chip ${due === key ? "chip-on" : ""}`} onClick={() => setDue(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-accent flex-1"
          onClick={() => {
            dispatch({ type: "task_update", id: task.id, due, area });
            onClose();
          }}
        >
          לשמור
        </button>
        <button
          type="button"
          className="btn-line text-warn"
          onClick={() => {
            dispatch({ type: "task_remove", id: task.id });
            onClose();
          }}
        >
          למחוק
        </button>
      </div>
    </Sheet>
  );
}
