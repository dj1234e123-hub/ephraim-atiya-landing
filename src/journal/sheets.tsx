import { useState } from "react";
import { Sheet, AreaPicker } from "./ui";
import { useStore } from "./store";
import { MOOD_LABEL, type Area, type Entry, type Mood } from "./seed";
import { longDate, shiftDayKey } from "./dates";

/** סיכום יום: שלוש שורות. משמש גם במסך היום וגם ביומן (עריכה). */
export function EntrySheet({ day, existing, onClose }: { day: string | null; existing?: Entry; onClose: () => void }) {
  const { dispatch } = useStore();
  const [mood, setMood] = useState<Mood>(existing?.mood ?? 3);
  const [good, setGood] = useState(existing?.good ?? "");
  const [tomorrow, setTomorrow] = useState(existing?.tomorrow ?? "");
  if (!day) return null;
  const save = () => {
    dispatch({ type: "entry_save", day, mood, good, tomorrow });
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title={`סיכום יום · ${longDate(day)}`}>
      <p className="mb-2 text-sm text-navy/60">איך היה היום?</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {([1, 2, 3] as Mood[]).map((m) => (
          <button key={m} type="button" className={`chip justify-center ${mood === m ? "chip-on" : ""}`} onClick={() => setMood(m)}>
            {MOOD_LABEL[m]}
          </button>
        ))}
      </div>
      <label className="mb-1 block text-sm text-navy/60" htmlFor="good">
        מה היה טוב היום?
      </label>
      <textarea id="good" className="input mb-4 min-h-[72px] py-3" rows={2} value={good} onChange={(e) => setGood(e.target.value)} placeholder="משפט אחד מספיק" />
      <label className="mb-1 block text-sm text-navy/60" htmlFor="tomorrow">
        מה הדבר האחד למחר?
      </label>
      <textarea id="tomorrow" className="input mb-5 min-h-[72px] py-3" rows={2} value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} placeholder="הדבר שאם רק הוא ייעשה, מחר היה יום טוב" />
      <button type="button" className="btn-accent w-full" onClick={save}>
        לשמור
      </button>
    </Sheet>
  );
}

type DueChoice = "today" | "tomorrow" | "week" | "none";

/** הוספת משימה: כותרת, תחום, מתי. */
export function TaskSheet({ open, onClose, today, defaultArea }: { open: boolean; onClose: () => void; today: string; defaultArea?: Area | null }) {
  const { dispatch } = useStore();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<Area>(defaultArea ?? "עסק");
  const [due, setDue] = useState<DueChoice>("today");
  if (!open) return null;
  const dueKey: Record<DueChoice, string | null> = { today, tomorrow: shiftDayKey(today, 1), week: shiftDayKey(today, 7), none: null };
  const add = () => {
    if (!title.trim()) return;
    dispatch({ type: "task_add", title, area, due: dueKey[due] });
    setTitle("");
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title="משימה חדשה">
      <input
        className="input mb-4"
        placeholder="מה צריך לעשות?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        autoFocus
      />
      <p className="mb-2 text-sm text-navy/60">תחום</p>
      <div className="mb-4">
        <AreaPicker value={area} onChange={(a) => a && setArea(a)} />
      </div>
      <p className="mb-2 text-sm text-navy/60">מתי</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["today", "היום"],
            ["tomorrow", "מחר"],
            ["week", "בעוד שבוע"],
            ["none", "בלי תאריך"],
          ] as Array<[DueChoice, string]>
        ).map(([k, label]) => (
          <button key={k} type="button" className={`chip ${due === k ? "chip-on" : ""}`} onClick={() => setDue(k)}>
            {label}
          </button>
        ))}
      </div>
      <button type="button" className="btn-accent w-full" onClick={add} disabled={!title.trim()}>
        להוסיף
      </button>
    </Sheet>
  );
}
