import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { buildSeed, DEFAULT_PROFILE, type Area, type Habit, type Mood, type Profile, type State, type TimeOfDay } from "./seed";
import { todayKey } from "./dates";
import { brandFromUrl, loadBrand, saveBrand } from "./brand";

const KEY = "demo_journal_v1";

export type Action =
  | { type: "onboard"; name: string; accent: Profile["accent"] }
  | { type: "profile"; patch: Partial<Profile> }
  | { type: "habit_toggle"; id: string; day: string }
  | { type: "habit_add"; name: string; area: Area; time: TimeOfDay; days: number[] }
  | { type: "habit_remove"; id: string }
  | { type: "task_add"; title: string; area: Area; due: string | null }
  | { type: "task_toggle"; id: string }
  | { type: "task_update"; id: string; due: string | null; area: Area }
  | { type: "task_remove"; id: string }
  | { type: "entry_save"; day: string; mood: Mood; good: string; tomorrow: string }
  | { type: "reset" };

let seq = 1000;
const nid = (p: string) => `${p}${++seq}`;
const note = (s: State, text: string): string[] => [text, ...s.actions].slice(0, 6);

function reducer(s: State, a: Action): State {
  const today = todayKey();
  switch (a.type) {
    case "onboard":
      return { ...s, profile: { name: a.name.trim(), accent: a.accent, onboarded: true } };
    case "profile":
      return { ...s, profile: { ...s.profile, ...a.patch } };
    case "habit_toggle": {
      const cur = s.log[a.day] ?? [];
      const on = cur.includes(a.id);
      const next = on ? cur.filter((x) => x !== a.id) : [...cur, a.id];
      const h = s.habits.find((x) => x.id === a.id);
      return { ...s, log: { ...s.log, [a.day]: next }, actions: on ? s.actions : note(s, `סומנה קביעות: ${h?.name ?? ""}`) };
    }
    case "habit_add": {
      const h: Habit = { id: nid("h"), name: a.name.trim(), area: a.area, time: a.time, days: a.days };
      return { ...s, habits: [...s.habits, h], actions: note(s, `נוספה קביעות: ${h.name}`) };
    }
    case "habit_remove":
      return { ...s, habits: s.habits.filter((h) => h.id !== a.id) };
    case "task_add":
      return {
        ...s,
        tasks: [{ id: nid("t"), title: a.title.trim(), area: a.area, due: a.due, done: null, created: today }, ...s.tasks],
        actions: note(s, `נוספה משימה: ${a.title.trim()}`),
      };
    case "task_toggle": {
      const t = s.tasks.find((x) => x.id === a.id);
      const tasks = s.tasks.map((x) => (x.id === a.id ? { ...x, done: x.done ? null : today } : x));
      return { ...s, tasks, actions: t && !t.done ? note(s, `הושלמה משימה: ${t.title}`) : s.actions };
    }
    case "task_update":
      return { ...s, tasks: s.tasks.map((x) => (x.id === a.id ? { ...x, due: a.due, area: a.area } : x)) };
    case "task_remove":
      return { ...s, tasks: s.tasks.filter((x) => x.id !== a.id) };
    case "entry_save": {
      const e = { day: a.day, mood: a.mood, good: a.good.trim(), tomorrow: a.tomorrow.trim() };
      const rest = s.entries.filter((x) => x.day !== a.day);
      return { ...s, entries: [e, ...rest].sort((x, y) => y.day.localeCompare(x.day)), actions: note(s, "נשמר סיכום יום") };
    }
    case "reset":
      return buildSeed({ ...DEFAULT_PROFILE, onboarded: false });
  }
}

function load(): State {
  // קישור אישי (?name=&accent=) גובר על הכול: ההדגמה נפתחת כבר על השם, בלי מסך פתיחה
  const fromUrl = brandFromUrl();
  // מי שכתב את השם בדף הנחיתה, מגיע לכאן כשהוא כבר מוכר
  const fromLanding = loadBrand();
  let s: State | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as State;
      if (saved.version === 1 && saved.today === todayKey()) s = saved;
      // יום חדש: הנתונים הבדיוניים נבנים מחדש, אבל השם והצבע נשארים
      else if (saved.version === 1 && saved.profile) s = buildSeed(saved.profile);
    }
  } catch {
    /* localStorage לא זמין: מתחילים מהזרע */
  }
  if (!s) s = buildSeed();
  if (fromUrl) return { ...s, profile: { ...fromUrl, onboarded: true } };
  if (!s.profile.onboarded && fromLanding && fromLanding.name) return { ...s, profile: { ...fromLanding, onboarded: true } };
  return s;
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* best effort */
    }
    saveBrand({ name: state.profile.name, accent: state.profile.accent });
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
