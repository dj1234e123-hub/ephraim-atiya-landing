import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { Home } from "./screens/Home";
import { Shabbat } from "./screens/Shabbat";
import { Aliyot } from "./screens/Aliyot";
import { Members } from "./screens/Members";
import { Money } from "./screens/Money";
import { More } from "./screens/More";
import { Print } from "./print/Print";
import { WA } from "./components/ui";
import { track } from "./analytics";

type Tab = "home" | "shabbat" | "aliyot" | "members" | "money" | "more";
const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "home", label: "השבת", icon: "M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { id: "shabbat", label: "הכנות", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { id: "aliyot", label: "עליות", icon: "M4 4h16v16H4zM8 4v16M12 8h5M12 12h5M12 16h3" },
  { id: "members", label: "מתפללים", icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { id: "money", label: "כספים", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { id: "more", label: "עוד", icon: "M4 6h16M4 12h16M4 18h16" },
];

function useHash(): string {
  const [h, setH] = useState(() => location.hash.replace("#", ""));
  useEffect(() => {
    const on = () => setH(location.hash.replace("#", ""));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return h;
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  );
}

function Router() {
  const hash = useHash();
  if (hash.startsWith("print/")) return <Print route={hash} />;
  return <Shell initial={(TABS.some((t) => t.id === hash) ? hash : "home") as Tab} />;
}

function Shell({ initial }: { initial: Tab }) {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>(initial);
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
            <p className="font-title text-lg leading-tight">{state.shul.name}</p>
            <p className="text-[11px] text-cream/70">בית כנסת · {state.shul.place}</p>
          </div>
          <span className="rounded-full border border-gold/70 px-2.5 py-1 text-[11px] font-medium text-gold">הדגמה · נתונים בדיוניים</span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {tab === "home" && <Home go={(t) => setTab(t as Tab)} />}
        {tab === "shabbat" && <Shabbat go={(t) => setTab(t as Tab)} />}
        {tab === "aliyot" && <Aliyot />}
        {tab === "members" && <Members />}
        {tab === "money" && <Money />}
        {tab === "more" && <More />}
      </main>

      <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-gold fixed bottom-[76px] left-1/2 z-30 w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2 shadow-card" onClick={() => track("whatsapp_click", { location: "demo" })}>
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
