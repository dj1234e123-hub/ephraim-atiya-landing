import { useMemo, useState } from "react";
import { useStore, memberName } from "../store";
import { ScreenTitle, Sheet, fmtDate } from "../components/ui";
import { nis, type StandingOrder } from "../seed";
import { track } from "../analytics";

const PURPOSES = ["קידוש", "נר תמיד", "ספרים", "תחזוקה", "חנוכה", "כללי"];
type Sub = "overview" | "orders" | "links";

export function Money() {
  const { state, dispatch } = useStore();
  const [sub, setSub] = useState<Sub>("overview");
  const [add, setAdd] = useState<"donation" | "order" | null>(null);
  const [who, setWho] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [amount, setAmount] = useState(180);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [method, setMethod] = useState<StandingOrder["method"]>("אשראי");
  const byId = useMemo(() => new Map(state.members.map((m) => [m.id, m])), [state.members]);
  const month = state.today.slice(0, 7);
  const monthDon = state.donations.filter((d) => d.date.slice(0, 7) === month);
  const monthSum = monthDon.reduce((s, d) => s + d.amount, 0);
  const soSum = state.standingOrders.reduce((s, o) => s + o.amount, 0);
  const openNedarim = state.nedarim.filter((n) => !n.paid).reduce((s, n) => s + n.amount, 0);
  const paidNedarimMonth = state.nedarim.filter((n) => n.paid && n.date.slice(0, 7) === month).reduce((s, n) => s + n.amount, 0);
  const byPurpose = Object.entries(monthDon.reduce<Record<string, number>>((acc, d) => ((acc[d.purpose] = (acc[d.purpose] ?? 0) + d.amount), acc), {})).sort((a, b) => b[1] - a[1]);
  const matches = who ? state.members.filter((m) => !m.guest && m.name.includes(who)).slice(0, 5) : [];
  const expenses = [
    { t: "חשמל", v: 1840 },
    { t: "ניקיון", v: 1200 },
    { t: "מים", v: 210 },
    { t: "ביטוח", v: 390 },
  ];
  const expSum = expenses.reduce((s, e) => s + e.v, 0);
  const income = monthSum + soSum + paidNedarimMonth;

  return (
    <div className="fade">
      <ScreenTitle title="כספים" instead="קבלות בכיס, פתקים במגירה, ואקסל שאף אחד לא פותח">
        <button className="btn-navy !min-h-[40px] !px-4 text-sm" onClick={() => setAdd("donation")}>+ תרומה</button>
      </ScreenTitle>
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-full bg-navy/5 p-1">
        {([["overview", "החודש"], ["orders", "הוראות קבע"], ["links", "חיבורים"]] as Array<[Sub, string]>).map(([id, l]) => (
          <button key={id} className={`rounded-full py-2 text-sm ${sub === id ? "bg-navy text-cream" : "text-navy/70"}`} onClick={() => setSub(id)}>{l}</button>
        ))}
      </div>

      {sub === "overview" && (
        <>
          <div className="card mb-4 bg-navy text-cream">
            <p className="text-xs text-cream/70">סיכום החודש לוועד</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-cream/60">הכנסות</p>
                <p className="font-title text-2xl">{nis(income)}</p>
                <p className="text-[11px] text-cream/60">תרומות {nis(monthSum)} · הו״ק {nis(soSum)} · נדרים ששולמו {nis(paidNedarimMonth)}</p>
              </div>
              <div>
                <p className="text-xs text-cream/60">הוצאות</p>
                <p className="font-title text-2xl">{nis(expSum)}</p>
                <p className="text-[11px] text-cream/60">{expenses.map((e) => `${e.t} ${e.v}`).join(" · ")}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-cream/10 pt-2">
              <span className="text-sm">נדרים פתוחים שעוד לא נגבו</span>
              <span className="font-title text-xl text-gold">{nis(openNedarim)}</span>
            </div>
            <a href="#print/month-summary" className="btn-gold mt-3 w-full !min-h-[44px] text-sm" onClick={() => track("demo_print_open", { kind: "month-summary", from: "money" })}>
              להדפיס דוח חודשי לוועד
            </a>
          </div>

          <div className="card mb-4">
            <p className="text-xs text-navy/60">תרומות החודש לפי ייעוד</p>
            <div className="mt-3 space-y-1.5">
              {byPurpose.map(([p, v]) => (
                <div key={p} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-navy/60">{p}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-navy/5"><span className="block h-full bg-gold" style={{ width: `${Math.max(6, (v / monthSum) * 100)}%` }} /></span>
                  <span className="w-16 text-end">{nis(v)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-2">
            <p className="px-2 pt-1 font-medium">תרומות אחרונות</p>
            <p className="px-2 pb-1 text-xs text-navy/50">כל תרומה: קבלה ממוספרת ומכתב תודה ממותג, בלחיצה.</p>
            {state.donations.slice(0, 8).map((d) => (
              <div key={d.id} className="row px-2">
                <span className="flex-1">
                  <span className="block text-sm">{d.memberId ? byId.get(d.memberId)?.name : d.donor}</span>
                  <span className="block text-xs text-navy/50">{d.purpose} · {fmtDate(d.date)}</span>
                </span>
                <span className="font-medium">{nis(d.amount)}</span>
                <span className="flex flex-col gap-1">
                  <a href={`#print/receipt/${d.id}`} className="chip !min-h-[30px] !px-3 text-xs" onClick={() => track("demo_print_open", { kind: "receipt", from: "money" })}>קבלה</a>
                  <a href={`#print/thanks/d/${d.id}`} className={`chip !min-h-[30px] !px-3 text-xs ${d.thanked ? "" : "chip-on"}`} onClick={() => track("demo_print_open", { kind: "thanks", from: "money" })}>{d.thanked ? "תודה ✓" : "תודה"}</a>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {sub === "orders" && (
        <>
          <div className="card mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-navy/60">הוראות קבע פעילות</p>
              <p className="font-title text-2xl">{state.standingOrders.length} <span className="text-base text-navy/50">· {nis(soSum)} לחודש</span></p>
            </div>
            <button className="btn-navy !min-h-[40px] !px-4 text-sm" onClick={() => setAdd("order")}>+ הוראת קבע</button>
          </div>
          <div className="card p-2">
            {state.standingOrders.map((o) => (
              <div key={o.id} className="row px-2">
                <span className="flex-1">
                  <span className="block text-sm font-medium">{memberName(state, o.memberId)}</span>
                  <span className="block text-xs text-navy/50">{o.method} · ב-{o.day} לחודש · מאז {fmtDate(o.since)}</span>
                </span>
                <span className="font-medium">{nis(o.amount)}</span>
                {o.thanked ? (
                  <span className="pill-ok">תודה נשלחה</span>
                ) : (
                  <a href={`#print/thanks/so/${o.id}`} className="chip chip-on !min-h-[34px] !px-3 text-xs" onClick={() => track("demo_print_open", { kind: "thanks-so", from: "money" })}>
                    מכתב תודה
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-navy/50">הוראת קבע חדשה = מכתב תודה ממותג, אוטומטית. התורם מרגיש שראו אותו.</p>
        </>
      )}

      {sub === "links" && (
        <>
          <p className="mb-3 text-sm text-navy/60">המערכת לא מחליפה את הסליקה שכבר יש לכם. היא מתחברת אליה, וכל תשלום נרשם על שם המתפלל הנכון.</p>
          <div className="space-y-3">
            {state.integrations.map((i) => (
              <div key={i.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{i.name}</p>
                    <p className="text-xs text-navy/50">{i.desc}</p>
                  </div>
                  <button className={`chip !min-h-[34px] text-xs ${i.connected ? "chip-on" : ""}`} onClick={() => dispatch({ type: "integration_toggle", id: i.id })}>
                    {i.connected ? "מחובר ✓" : "לחבר"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-navy/70">{i.what}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-navy/50">בהדגמה הכפתור רק מסמן. במערכת האמיתית החיבור נעשה פעם אחת, באפיון.</p>
        </>
      )}

      <Sheet open={add !== null} onClose={() => setAdd(null)} title={add === "order" ? "הוראת קבע חדשה" : "רישום תרומה"}>
        <input className="input" placeholder="מי? (שם)" value={who} onChange={(e) => { setWho(e.target.value); setMemberId(null); }} />
        {matches.length > 0 && !memberId && (
          <div className="mt-1 rounded-xl bg-white shadow-card">
            {matches.map((m) => (
              <button key={m.id} className="block w-full px-4 py-2 text-start text-sm hover:bg-navy/5" onClick={() => { setWho(m.name); setMemberId(m.id); }}>{m.name}</button>
            ))}
          </div>
        )}
        <p className="mb-2 mt-4 text-sm text-navy/60">{add === "order" ? "סכום לחודש" : "סכום"}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {(add === "order" ? [18, 36, 50, 100, 180, 360] : [50, 100, 180, 360, 500, 1000]).map((v) => (
            <button key={v} className={`chip ${amount === v ? "chip-on" : ""}`} onClick={() => setAmount(v)}>{v} ₪</button>
          ))}
        </div>
        {add === "order" ? (
          <>
            <p className="mb-2 text-sm text-navy/60">דרך</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {(["אשראי", "הוראת קבע בנקאית", "נדרים פלוס"] as const).map((p) => (
                <button key={p} className={`chip ${method === p ? "chip-on" : ""}`} onClick={() => setMethod(p)}>{p}</button>
              ))}
            </div>
            <button className="btn-navy w-full" disabled={!memberId} onClick={() => { dispatch({ type: "so_add", memberId: memberId!, amount, method }); setAdd(null); setWho(""); setMemberId(null); setSub("orders"); }}>
              לרשום {nis(amount)} לחודש
            </button>
            <p className="mt-2 text-center text-xs text-navy/50">אחרי הרישום: מכתב תודה מחכה בלשונית הוראות קבע.</p>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm text-navy/60">עבור</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <button key={p} className={`chip ${purpose === p ? "chip-on" : ""}`} onClick={() => setPurpose(p)}>{p}</button>
              ))}
            </div>
            <button className="btn-navy w-full" disabled={!who} onClick={() => { dispatch({ type: "donation_add", memberId, donor: memberId ? undefined : who, amount, purpose }); setAdd(null); setWho(""); setMemberId(null); }}>
              לרשום {nis(amount)}
            </button>
            <p className="mt-2 text-center text-xs text-navy/50">במערכת האמיתית: קבלה נשלחת לתורם אוטומטית, ומכתב תודה מחכה להדפסה.</p>
          </>
        )}
      </Sheet>
    </div>
  );
}
