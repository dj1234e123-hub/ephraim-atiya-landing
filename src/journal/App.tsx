import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { Today } from "./screens/Today";
import { Habits } from "./screens/Habits";
import { Tasks } from "./screens/Tasks";
import { Diary } from "./screens/Diary";
import { Sheet } from "./ui";
import { ACCENTS, accentColor, whatsappUrl, type AccentId } from "./brand";
import { track } from "../analytics";

type Tab = "today" | "habits" | "tasks" | "diary";
const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "today", label: "היום", icon: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z" },
  { id: "habits", label: "התמדה", icon: "M4 19V9M10 19V5M16 19v-8M22 19H2" },
  { id: "tasks", label: "משימות", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { id: "diary", label: "יומן", icon: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" },
];

/** הצבע הנבחר נכנס כמשתני CSS על עטיפת האפליקציה. */
function accentVars(id: AccentId) {
  const c = accentColor(id);
  return { "--accent": c, "--accent-soft": c + "1f" } as React.CSSProperties;
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<Tab>(() => (location.hash.replace("#", "") as Tab) || "today");
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    history.replaceState(null, "", `#${tab}`);
    window.scrollTo({ top: 0 });
    track("journal_screen", { screen: tab });
    if (tab === "habits") dispatch({ type: "tour_step", step: "streak" });
  }, [tab, dispatch]);
  const tourDone = state.tour.done.length;
  useEffect(() => {
    if (tourDone > 0) track("journal_tour_step", { steps: tourDone });
    if (tourDone === 3) track("journal_tour_done");
  }, [tourDone]);

  const name = state.profile.name;
  const title = name ? `היומן של ${name}` : "היומן שלי";

  return (
    <div className="app" style={accentVars(state.profile.accent)}>
      <header className="sticky top-0 z-30 bg-navy text-cream">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div>
            <p className="font-title text-lg leading-tight">{title}</p>
            <p className="text-[11px] text-cream/70">יומן אישי ממותג · הדגמה</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-gold/70 px-2.5 py-1 text-[11px] font-medium text-gold sm:inline">נתונים בדיוניים</span>
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 hover:bg-cream/20" aria-label="הגדרות" onClick={() => setSettings(true)}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {tab === "today" && <Today go={(t) => setTab(t as Tab)} />}
        {tab === "habits" && <Habits />}
        {tab === "tasks" && <Tasks />}
        {tab === "diary" && <Diary />}
      </main>

      <a
        href={whatsappUrl(state.profile, "demo")}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-gold fixed bottom-[76px] left-1/2 z-30 w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2 shadow-card"
        onClick={() => track("whatsapp_click", { location: "journal-demo", named: !!name })}
      >
        {name ? `${name}, רוצים יומן כזה על השם שלכם? לשיחה בוואטסאפ` : "רוצים יומן כזה על השם שלכם? לשיחה בוואטסאפ"}
      </a>

      <nav className="nav" aria-label="ניווט">
        {TABS.map((t) => (
          <button key={t.id} className={`nav-item ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </nav>

      {!state.profile.onboarded && <Onboarding />}
      {settings && (
        <Settings
          onClose={() => setSettings(false)}
          onReset={() => {
            if (confirm("לאפס את ההדגמה לנקודת ההתחלה?")) {
              track("journal_reset");
              dispatch({ type: "reset" });
              setSettings(false);
              setTab("today");
            }
          }}
        />
      )}
    </div>
  );
}

/** פתיחה ראשונה: שם וצבע, ומיד רואים את היומן על השם שלנו. זה כל הרעיון. */
function Onboarding() {
  const { dispatch } = useStore();
  const [name, setName] = useState("");
  const [accent, setAccent] = useState<AccentId>("gold");
  const start = () => {
    track("journal_onboarded", { named: !!name.trim(), accent });
    dispatch({ type: "onboard", name, accent });
  };
  return (
    <Sheet open onClose={start} title="היומן שלכם, על השם שלכם">
      <p className="mb-4 text-sm leading-relaxed text-navy/70">
        זו הדגמה עם נתונים בדיוניים. כתבו את השם שלכם ובחרו צבע, וראו איך זה מרגיש כשהיומן הוא שלכם.
      </p>
      <label className="mb-1 block text-sm text-navy/60" htmlFor="name">
        איך קוראים לכם?
      </label>
      <input id="name" className="input mb-4" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && start()} placeholder="שם פרטי" autoFocus />
      <p className="mb-2 text-sm text-navy/60">הצבע שלכם</p>
      <AccentPicker value={accent} onChange={setAccent} />
      <button type="button" className="btn-navy mt-5 w-full" onClick={start}>
        {name.trim() ? `לפתוח את היומן של ${name.trim()}` : "להסתכל בלי שם"}
      </button>
    </Sheet>
  );
}

function AccentPicker({ value, onChange }: { value: AccentId; onChange: (a: AccentId) => void }) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="צבע">
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          type="button"
          role="radio"
          aria-checked={value === a.id}
          aria-label={a.name}
          onClick={() => onChange(a.id)}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${value === a.id ? "ring-2 ring-navy ring-offset-2 ring-offset-cream" : ""}`}
          style={{ background: a.color }}
        >
          {value === a.id && (
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

function Settings({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const { state, dispatch } = useStore();
  const [name, setName] = useState(state.profile.name);
  return (
    <Sheet open onClose={onClose} title="הגדרות">
      <label className="mb-1 block text-sm text-navy/60" htmlFor="sname">
        השם ביומן
      </label>
      <input
        id="sname"
        className="input mb-4"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => dispatch({ type: "profile", patch: { name: name.trim() } })}
        placeholder="שם פרטי"
      />
      <p className="mb-2 text-sm text-navy/60">הצבע</p>
      <AccentPicker value={state.profile.accent} onChange={(accent) => dispatch({ type: "profile", patch: { accent } })} />

      <div className="mt-6 rounded-2xl border border-navy/10 p-4 text-sm leading-relaxed text-navy/70">
        <p className="font-medium text-navy">ביומן האמיתי</p>
        <p className="mt-1">הוא מותקן במסך הבית של הטלפון כמו אפליקציה, עם הסמל והשם שלכם, והמידע נשמר בחשבון על שמכם.</p>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className="btn-navy flex-1"
          onClick={() => {
            dispatch({ type: "profile", patch: { name: name.trim() } });
            onClose();
          }}
        >
          סגירה
        </button>
        <button type="button" className="btn-line text-warn" onClick={onReset}>
          איפוס ההדגמה
        </button>
      </div>
    </Sheet>
  );
}
