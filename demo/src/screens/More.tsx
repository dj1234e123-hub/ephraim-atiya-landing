import { useState } from "react";
import { useStore } from "../store";
import { ScreenTitle } from "../components/ui";
import { Fix } from "./Fix";
import { Seats } from "./Seats";
import { Settings } from "./Settings";
import { track } from "../analytics";

type Sub = "menu" | "fix" | "seats" | "prints" | "settings";

const PRINTS: Array<{ href: string; title: string; desc: string; kind: string }> = [
  { href: "#print/shabbat", title: "דף שבת", desc: "לדלת ולבימה: זמנים, עליות, אזכרות, קידוש, הודעות", kind: "shabbat" },
  { href: "#print/month", title: "לוח זמנים חודשי", desc: "כל שבתות החודש וזמני החול, לדלת", kind: "month" },
  { href: "#print/aliyot", title: "כרטיס עליות לבימה", desc: "סדר העליות בכתב גדול, לקורא ולגבאי", kind: "aliyot" },
  { href: "#print/yahrzeit", title: "רשימת אזכרות", desc: "שמות הנפטרים להקראה, עם המתפלל", kind: "yahrzeit" },
  { href: "#print/month-summary", title: "דוח חודשי לוועד", desc: "הכנסות, הוצאות, נדרים פתוחים, הוראות קבע", kind: "month-summary" },
];

export function More() {
  const { state, dispatch } = useStore();
  const [sub, setSub] = useState<Sub>("menu");
  const openUrgent = state.tickets.filter((t) => t.status !== "סגור").length;
  const seatsOwed = state.seats.filter((s) => s.memberId && !s.paid).length;

  if (sub !== "menu") {
    const titles: Record<Exclude<Sub, "menu">, [string, string]> = {
      fix: ["תחזוקה", "״מישהו כבר יטפל״"],
      seats: ["מקומות לימים נוראים", "הטבלה הידנית שמתחילים מחדש כל שנה"],
      prints: ["הדפסות", "וורד ישן עם כיתוב ידני"],
      settings: ["פרטי בית הכנסת", "הגדרות שמישהו אחד יודע"],
    };
    const [t, i] = titles[sub];
    return (
      <div className="fade">
        <button className="mb-2 text-sm text-gold-deep" onClick={() => setSub("menu")}>→ חזרה</button>
        {sub !== "fix" && <ScreenTitle title={t} instead={i} />}
        {sub === "fix" && <Fix />}
        {sub === "seats" && <Seats />}
        {sub === "settings" && <Settings />}
        {sub === "prints" && (
          <div className="card p-2">
            {PRINTS.map((p) => (
              <a key={p.href} href={p.href} className="row px-2" onClick={() => track("demo_print_open", { kind: p.kind, from: "more" })}>
                <span className="flex-1">
                  <span className="block font-medium">{p.title}</span>
                  <span className="block text-xs text-navy/50">{p.desc}</span>
                </span>
                <span className="text-xs text-gold-deep">לפתוח ←</span>
              </a>
            ))}
            <p className="p-3 text-center text-xs text-navy/50">קבלות, מכתבי תודה ודפי חשבון נפתחים מהמתפלל או מהתרומה עצמה.</p>
          </div>
        )}
      </div>
    );
  }

  const item = (id: Sub, title: string, desc: string, badge?: string) => (
    <button className="row w-full px-2 text-start" onClick={() => setSub(id)}>
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-navy/50">{desc}</span>
      </span>
      {badge && <span className="pill-warn">{badge}</span>}
      <span className="text-navy/40">←</span>
    </button>
  );

  return (
    <div className="fade">
      <ScreenTitle title="עוד" instead="הדברים שרק הגבאי יודע" />
      <div className="card p-2">
        {item("prints", "הדפסות", "דף שבת, לוח חודשי, כרטיס עליות, אזכרות, דוח לוועד")}
        {item("seats", "מקומות לימים נוראים", "מי יושב איפה, מי שילם", seatsOwed ? `${seatsOwed} לא שילמו` : undefined)}
        {item("fix", "תחזוקה", "תקלות, מי מטפל, ספקים", openUrgent ? `${openUrgent} פתוחות` : undefined)}
        {item("settings", "פרטי בית הכנסת", "שם, כתובת, נוסח, כללי הזמנים")}
      </div>
      <div className="card mt-3 text-xs text-navy/60">
        <p className="mb-1 font-medium text-navy">ספקים קבועים</p>
        <p>חשמלאי: 052-000-0001 · אינסטלטור: 052-000-0002 · מזגנים: 052-000-0003 · ניקיון: 052-000-0004</p>
      </div>
      <button className="btn-line mt-4 w-full" onClick={() => { if (confirm("לאפס את ההדגמה לנקודת ההתחלה?")) { track("demo_reset"); dispatch({ type: "reset" }); } }}>
        איפוס ההדגמה
      </button>
    </div>
  );
}
