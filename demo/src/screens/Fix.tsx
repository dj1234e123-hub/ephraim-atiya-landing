import { useState } from "react";
import { useStore } from "../store";
import { ScreenTitle, Sheet, fmtDate } from "../components/ui";

const WHERE = ["אולם מרכזי", "עזרת נשים", "כניסה", "מטבחון", "שירותים", "חצר"];
const OWNERS = ["ועד הבית", "חשמלאי", "אינסטלטור", "מתנדב"];

export function Fix() {
  const { state, dispatch } = useStore();
  const [add, setAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [where, setWhere] = useState(WHERE[0]);
  const [urgent, setUrgent] = useState(false);
  const open = state.tickets.filter((t) => t.status !== "סגור");
  const closed = state.tickets.filter((t) => t.status === "סגור");

  return (
    <div className="fade">
      <ScreenTitle title="תחזוקה" instead="״מישהו כבר יטפל״">
        <button className="btn-navy !min-h-[40px] !px-4 text-sm" onClick={() => setAdd(true)}>+ תקלה</button>
      </ScreenTitle>

      <div className="card mb-4 p-2">
        <p className="px-2 pt-1 font-medium">פתוחות ({open.length})</p>
        {open.length === 0 && <p className="p-3 text-sm text-navy/50">אין תקלות פתוחות.</p>}
        {open.map((t) => (
          <div key={t.id} className="border-b border-navy/5 px-2 py-3 last:border-b-0">
            <div className="flex items-start gap-2">
              <span className="flex-1">
                <span className="block font-medium">{t.title}</span>
                <span className="block text-xs text-navy/50">{t.where} · נפתח {fmtDate(t.opened)}{t.owner ? ` · מטפל: ${t.owner}` : ""}</span>
              </span>
              {t.urgent && <span className="pill-warn">דחוף</span>}
              <span className={t.status === "בטיפול" ? "pill-ok" : "pill-muted"}>{t.status}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.status === "פתוח" && OWNERS.map((o) => (
                <button key={o} className="chip !min-h-[36px] text-xs" onClick={() => dispatch({ type: "ticket_status", id: t.id, status: "בטיפול", owner: o })}>→ {o}</button>
              ))}
              {t.status === "בטיפול" && (
                <button className="chip chip-on !min-h-[36px] text-xs" onClick={() => dispatch({ type: "ticket_status", id: t.id, status: "סגור" })}>✓ טופל</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {closed.length > 0 && (
        <div className="card p-2 opacity-70">
          <p className="px-2 pt-1 font-medium">טופלו</p>
          {closed.map((t) => (
            <div key={t.id} className="row px-2">
              <span className="flex-1 text-sm line-through">{t.title}</span>
              <span className="text-xs text-navy/50">{t.owner}</span>
            </div>
          ))}
        </div>
      )}

      <Sheet open={add} onClose={() => setAdd(false)} title="תקלה חדשה">
        <input className="input" placeholder="מה התקלה?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <p className="mb-2 mt-4 text-sm text-navy/60">איפה</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {WHERE.map((w) => (
            <button key={w} className={`chip ${where === w ? "chip-on" : ""}`} onClick={() => setWhere(w)}>{w}</button>
          ))}
        </div>
        <label className="mb-5 flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          <span>דחוף (לפני שבת)</span>
        </label>
        <button className="btn-navy w-full" disabled={!title} onClick={() => { dispatch({ type: "ticket_add", title, where, urgent }); setAdd(false); setTitle(""); setUrgent(false); }}>
          לפתוח תקלה
        </button>
        <p className="mt-2 text-center text-xs text-navy/50">במערכת האמיתית: אפשר לצרף תמונה, והמטפל מקבל הודעה.</p>
      </Sheet>
    </div>
  );
}
