import { useState } from "react";
import { useStore, memberName } from "../store";
import { ScreenTitle, Sheet, fmtDate } from "../components/ui";
import { hhmm, addMin } from "../lib/zmanim";
import { zmanimFor, dueLabel, dueDate, familyName, hebrewLabel } from "../lib/shul";
import { daysBetween } from "../lib/dates";
import type { PrepTask } from "../seed";
import { track } from "../analytics";

type Sub = "prep" | "clocks" | "kiddush" | "holidays";
const SUBS: Array<{ id: Sub; label: string }> = [
  { id: "prep", label: "הכנות" },
  { id: "kiddush", label: "קידוש" },
  { id: "clocks", label: "שעוני שבת" },
  { id: "holidays", label: "חגים" },
];

export function Shabbat({ go }: { go: (tab: string) => void }) {
  const [sub, setSub] = useState<Sub>("prep");
  return (
    <div className="fade">
      <ScreenTitle title="שבת מוכנה מראש" instead="רשימה בראש, ויום שישי בלחץ" />
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-full bg-navy/5 p-1">
        {SUBS.map((s) => (
          <button key={s.id} className={`rounded-full py-2 text-sm ${sub === s.id ? "bg-navy text-cream" : "text-navy/70"}`} onClick={() => setSub(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {sub === "prep" && <Prep go={go} />}
      {sub === "kiddush" && <KiddushBoard />}
      {sub === "clocks" && <Clocks />}
      {sub === "holidays" && <Holidays />}
    </div>
  );
}

function TaskRow({ t, due, onToggle, onLink }: { t: PrepTask; due: string; onToggle: () => void; onLink?: () => void }) {
  return (
    <div className={`row px-2 ${t.done ? "opacity-60" : ""}`}>
      <button
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${t.done ? "border-ok bg-ok text-white" : "border-navy/30"}`}
        onClick={onToggle}
        aria-label={t.done ? "לבטל סימון" : "לסמן כבוצע"}
      >
        {t.done ? "✓" : ""}
      </button>
      <span className="flex-1">
        <span className={`block text-sm ${t.done ? "line-through" : "font-medium"}`}>{t.title}</span>
        <span className="block text-xs text-navy/50">{t.owner} · {due}{t.note ? ` · ${t.note}` : ""}</span>
      </span>
      {onLink && !t.done && (
        <button className="text-xs text-gold-deep" onClick={onLink}>פתח ←</button>
      )}
    </div>
  );
}

function Prep({ go }: { go: (tab: string) => void }) {
  const { state, dispatch } = useStore();
  const z = zmanimFor(state);
  const [add, setAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState(state.shul.gabbai);
  const tasks = [...state.prep.tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const da = dueDate(a, z)?.getTime() ?? Infinity;
    const db = dueDate(b, z)?.getTime() ?? Infinity;
    return da - db;
  });
  const done = tasks.filter((t) => t.done).length;
  const owners = [state.shul.gabbai, state.shul.gabbai2, state.shul.cleaner, "ועד הבית", "ועד הקידוש", "תורן השבוע"];
  const link = (t: PrepTask) => {
    if (!t.link) return undefined;
    if (t.link === "print") return () => { track("demo_print_open", { kind: "shabbat", from: "prep" }); location.hash = "print/shabbat"; };
    if (t.link === "aliyot") return () => go("aliyot");
    return undefined;
  };

  return (
    <>
      <div className="card mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-navy/60">שבת פרשת {state.parsha.name} · {fmtDate(state.parsha.shabbat)}</p>
          <p className="font-title text-xl">הדלקת נרות {hhmm(z.candles)}</p>
          <p className="text-xs text-navy/50">הרשימה נוצרת לבד כל שבוע מתבנית בית הכנסת, והשעות זזות עם השקיעה.</p>
        </div>
        <div className="text-center">
          <p className="font-title text-3xl">{done}<span className="text-base text-navy/50">/{tasks.length}</span></p>
          <p className={`text-xs ${done === tasks.length ? "text-ok" : "text-warn"}`}>{done === tasks.length ? "מוכן" : "בעבודה"}</p>
        </div>
      </div>
      <div className="card p-2">
        {tasks.map((t) => (
          <TaskRow key={t.id} t={t} due={dueLabel(t, z)} onToggle={() => dispatch({ type: "prep_toggle", id: t.id })} onLink={link(t)} />
        ))}
      </div>
      <button className="btn-line mt-3 w-full" onClick={() => setAdd(true)}>+ משימה לשבת הזאת</button>
      <p className="mt-2 text-center text-xs text-navy/50">במערכת האמיתית: לכל אחראי יוצאת תזכורת ביום חמישי עם המשימות שלו.</p>

      <Sheet open={add} onClose={() => setAdd(false)} title="משימה להכנות">
        <input className="input" placeholder="מה צריך לעשות?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <p className="mb-2 mt-4 text-sm text-navy/60">מי אחראי</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {owners.map((o) => (
            <button key={o} className={`chip ${owner === o ? "chip-on" : ""}`} onClick={() => setOwner(o)}>{o}</button>
          ))}
        </div>
        <button className="btn-navy w-full" disabled={!title} onClick={() => { dispatch({ type: "prep_add", title, owner }); setAdd(false); setTitle(""); }}>
          להוסיף
        </button>
      </Sheet>
    </>
  );
}

function KiddushBoard() {
  const { state, dispatch } = useStore();
  const [edit, setEdit] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [occasion, setOccasion] = useState("");
  const matches = q ? state.members.filter((m) => !m.guest && m.name.includes(q)).slice(0, 6) : [];
  const OCC = ["הולדת בן", "הולדת בת", "בר מצווה", "אירוסין", "שבת חתן", "אזכרה", "שבת מברכים", "סתם ככה"];

  return (
    <>
      <p className="mb-3 text-sm text-navy/60">שמונה שבתות קדימה. שבת בלי חסות מסומנת, כדי לסגור אותה שבועיים מראש ולא ביום חמישי.</p>
      <div className="card p-2">
        {state.kiddushim.map((k) => {
          const name = k.sponsorMemberId ? memberName(state, k.sponsorMemberId) : k.sponsorName ?? "";
          const has = !!name;
          return (
            <button key={k.shabbat} className="row w-full px-2 text-start" onClick={() => { setEdit(k.shabbat); setQ(""); setOccasion(k.occasion); }}>
              <span className="w-16 shrink-0">
                <span className="block text-sm font-medium">{fmtDate(k.shabbat)}</span>
                <span className="block text-xs text-navy/50">{k.parsha}</span>
              </span>
              <span className="flex-1">
                <span className={`block text-sm ${has ? "font-medium" : "text-warn"}`}>{has ? `משפחת ${familyName(name)}` : "אין חסות"}</span>
                <span className="block text-xs text-navy/50">{has ? k.occasion : "לחיצה לרישום"}{has ? ` · מסדר: ${k.setup}` : ""}</span>
              </span>
              <span className={has ? "pill-ok" : "pill-warn"}>{has ? "סגור" : "פתוח"}</span>
            </button>
          );
        })}
      </div>
      <div className="card mt-3 text-xs text-navy/60">
        <p className="mb-1 font-medium text-navy">ציוד קבוע לקידוש</p>
        <p>יין, חלות, כוסות, מפות, סלטים ועוגות לפי הנותן חסות. המטבחון: יש 40 כוסות, חסר מיץ ענבים.</p>
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={`קידוש שבת ${edit ? fmtDate(edit) : ""}`}>
        <input className="input" placeholder="מי נותן חסות? (שם)" value={q} onChange={(e) => setQ(e.target.value)} />
        {matches.length > 0 && (
          <div className="mt-1 rounded-xl bg-white shadow-card">
            {matches.map((m) => (
              <button key={m.id} className="block w-full px-4 py-2 text-start text-sm hover:bg-navy/5" onClick={() => { dispatch({ type: "kiddush_set", shabbat: edit!, sponsorMemberId: m.id, occasion: occasion || "שמחה משפחתית" }); setEdit(null); }}>
                {m.name}
              </button>
            ))}
          </div>
        )}
        <p className="mb-2 mt-4 text-sm text-navy/60">לרגל</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {OCC.map((o) => (
            <button key={o} className={`chip ${occasion === o ? "chip-on" : ""}`} onClick={() => setOccasion(o)}>{o}</button>
          ))}
        </div>
        <button className="btn-line w-full" onClick={() => { dispatch({ type: "kiddush_set", shabbat: edit!, sponsorMemberId: null, sponsorName: "ועד בית הכנסת", occasion: occasion || "שבת מברכים" }); setEdit(null); }}>
          הוועד נותן את הקידוש
        </button>
        <button className="btn-line mt-2 w-full" onClick={() => { dispatch({ type: "kiddush_set", shabbat: edit!, sponsorMemberId: null, occasion: "" }); setEdit(null); }}>
          לבטל חסות
        </button>
        <p className="mt-2 text-center text-xs text-navy/50">בחירת שם מהרשימה רושמת את החסות. ההודעה לציבור נכתבת לבד.</p>
      </Sheet>
    </>
  );
}

function Clocks() {
  const { state, dispatch } = useStore();
  const winter = (() => {
    const m = Number(state.today.slice(5, 7));
    return m >= 11 || m <= 3;
  })();
  return (
    <>
      <p className="mb-3 text-sm text-navy/60">
        הידע שנעלם כשגבאי מתחלף: איזה שעון, איפה הוא, ומה מכוונים בחורף ובקיץ. עכשיו: <b>{winter ? "לוח חורף" : "לוח קיץ"}</b>.
      </p>
      <div className="space-y-3">
        {state.clocks.map((c) => {
          const days = daysBetween(c.lastChecked, state.today);
          return (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{c.device}</p>
                  <p className="text-xs text-navy/50">{c.where}</p>
                </div>
                <span className={days > 21 ? "pill-warn" : "pill-ok"}>{days === 0 ? "נבדק היום" : `נבדק לפני ${days} ימים`}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className={`rounded-xl p-2 ${winter ? "bg-navy text-cream" : "bg-navy/5"}`}>
                  <p className="mb-0.5 font-medium">חורף</p>
                  <p className={winter ? "text-cream/80" : "text-navy/70"}>{c.winter}</p>
                </div>
                <div className={`rounded-xl p-2 ${!winter ? "bg-navy text-cream" : "bg-navy/5"}`}>
                  <p className="mb-0.5 font-medium">קיץ</p>
                  <p className={!winter ? "text-cream/80" : "text-navy/70"}>{c.summer}</p>
                </div>
              </div>
              {c.note && <p className="mt-2 text-xs text-navy/60">{c.note}</p>}
              <button className="chip mt-3 !min-h-[36px] text-xs" onClick={() => dispatch({ type: "clock_checked", id: c.id })}>✓ בדקתי השבוע</button>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-navy/50">במערכת האמיתית: תזכורת אוטומטית במעבר לשעון חורף וקיץ, עם ההגדרות של כל שעון.</p>
    </>
  );
}

function Holidays() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState<string>(state.holidays[0]?.id ?? "");
  return (
    <>
      <p className="mb-3 text-sm text-navy/60">אותו מנגנון כמו ההכנות לשבת, עם תבנית לכל חג. המשימות מקבלות תאריך יעד לפי מועד החג.</p>
      <div className="space-y-3">
        {state.holidays.map((h) => {
          const done = h.tasks.filter((t) => t.done).length;
          const days = daysBetween(state.today, h.date);
          const isOpen = open === h.id;
          return (
            <div key={h.id} className="card p-2">
              <button className="flex w-full items-center justify-between px-2 py-1 text-start" onClick={() => setOpen(isOpen ? "" : h.id)}>
                <span>
                  <span className="block font-medium">{h.name}</span>
                  <span className="block text-xs text-navy/50">{hebrewLabel(h.date)} · {fmtDate(h.date)} · {days > 0 ? `בעוד ${days} ימים` : "עכשיו"}{h.note ? ` · ${h.note}` : ""}</span>
                </span>
                <span className={done === h.tasks.length ? "pill-ok" : "pill-muted"}>{done}/{h.tasks.length}</span>
              </button>
              {isOpen && h.tasks.map((t) => {
                const due = t.dueMin === null ? "לפני החג" : `עד ${fmtDate(addMin(new Date(h.date + "T12:00:00Z"), -t.dueMin).toISOString().slice(0, 10))}`;
                return <TaskRow key={t.id} t={t} due={due} onToggle={() => dispatch({ type: "holiday_toggle", holidayId: h.id, taskId: t.id })} />;
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
