import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { Home } from "./screens/Home";
import { Aliyot } from "./screens/Aliyot";
import { Members } from "./screens/Members";
import { Money } from "./screens/Money";
import { Fix } from "./screens/Fix";
import { WA } from "./components/ui";
import { SHUL } from "./seed";
import { track } from "./analytics";

type Tab = "home" | "aliyot" | "members" | "money" | "fix";
const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "home", label: "בית", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { id: "aliyot", label: "עליות", icon: "M4 4h16v16H4zM8 4v16M12 8h5M12 12h5M12 16h3" },
  { id: "members", label: "מתפללים", icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { id: "money", label: "תרומות", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { id: "fix", label: "תחזוקה", icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" },
];

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { dispatch } = useStore();
  const [tab, setTab] = useState<Tab>(() => (location.hash.replace("#", "") as Tab) || "home");
  useEffect(() => {
    history.replaceState(null, "", `#${tab}`);
    window.scrollTo({ top: 0 });
    track("demo_screen", { screen: tab });
  }, [tab]);

  return (
    <div className="app">
      <header className="sticky top-0 z-30 bg-navy text-cream">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div>
            <p className="font-title text-lg leading-tight">{SHUL.name}</p>
            <p className="text-[11px] text-cream/70">בית כנסת · {SHUL.place}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-gold/70 px-2.5 py-1 text-[11px] font-medium text-gold">הדגמה · נתונים בדיוניים</span>
            <button className="rounded-full bg-cream/10 px-3 py-1.5 text-xs hover:bg-cream/20" onClick={() => { if (confirm("לאפס את ההדגמה לנקודת ההתחלה?")) { track("demo_reset"); dispatch({ type: "reset" }); } }}>
              איפוס
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {tab === "home" && <Home go={(t) => setTab(t as Tab)} />}
        {tab === "aliyot" && <Aliyot />}
        {tab === "members" && <Members />}
        {tab === "money" && <Money />}
        {tab === "fix" && <Fix />}
      </main>

      <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-gold fixed bottom-[76px] left-1/2 z-30 w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2 shadow-card">
        רוצים כזה לבית הכנסת שלכם? לשיחה בוואטסאפ
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
    </div>
  );
}
