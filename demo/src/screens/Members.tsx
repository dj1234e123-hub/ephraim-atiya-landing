import { useMemo, useState } from "react";
import { useStore } from "../store";
import { ScreenTitle, Sheet, WaPreview, fmtDate } from "../components/ui";
import { nis, type Member } from "../seed";

const PURPOSES = ["עלייה לתורה", "מי שברך", "קידוש", "נר תמיד", "תחזוקה"];

export function Members() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"card" | "neder" | "remind">("card");
  const [amount, setAmount] = useState(36);
  const [purpose, setPurpose] = useState(PURPOSES[0]);

  const list = useMemo(() => state.members.filter((m) => !m.guest && (!q || m.name.includes(q))), [state.members, q]);
  const m: Member | undefined = state.members.find((x) => x.id === openId);
  const nedarim = state.nedarim.filter((n) => n.memberId === openId).sort((a, b) => b.date.localeCompare(a.date));
  const open = nedarim.filter((n) => !n.paid);
  const openSum = open.reduce((s, n) => s + n.amount, 0);
  const firstName = m?.name.split(" ")[0] ?? "";
  const remindText = `שלום ${firstName}, זו תזכורת ידידותית מבית הכנסת מנחת יהודה: נדרים פתוחים על סך ${nis(openSum)} (${open.map((n) => n.purpose).join(", ")}). אפשר להסדיר בביט או במזומן לגבאי. תזכו למצוות!`;

  return (
    <div className="fade">
      <ScreenTitle title="מתפללים ונדרים" instead="האקסל של הנדרים" />
      <input className="input mb-3" placeholder="חיפוש לפי שם…" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="mb-2 text-xs text-navy/50">{list.length} מתפללים</p>
      <div className="card p-2">
        {list.slice(0, 40).map((x) => {
          const owes = state.nedarim.filter((n) => n.memberId === x.id && !n.paid).reduce((s, n) => s + n.amount, 0);
          return (
            <button key={x.id} className="row w-full px-2 text-start" onClick={() => { setOpenId(x.id); setMode("card"); }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/5 font-title">{x.name[0]}</span>
              <span className="flex-1">
                <span className="block font-medium">{x.name}</span>
                <span className="block text-xs text-navy/50">{x.street} · {x.phone}</span>
              </span>
              {owes > 0 ? <span className="pill-warn">{nis(owes)}</span> : <span className="pill-ok">מסודר</span>}
            </button>
          );
        })}
        {list.length > 40 && <p className="p-3 text-center text-xs text-navy/50">ועוד {list.length - 40}… (חפשו לפי שם)</p>}
      </div>

      <Sheet open={!!m} onClose={() => setOpenId(null)} title={m?.name ?? ""}>
        {m && mode === "card" && (
          <>
            <p className="text-sm text-navy/60">{m.street} · {m.phone}</p>
            <p className="mt-1 text-sm text-navy/60">עלייה אחרונה: {m.lastAliyah ? fmtDate(m.lastAliyah) : "לא נרשמה"}{m.note ? ` · ${m.note}` : ""}</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-navy flex-1" onClick={() => setMode("neder")}>+ נדר</button>
              <button className="btn-gold flex-1" onClick={() => setMode("remind")} disabled={open.length === 0}>תזכורת</button>
            </div>
            <p className="mb-2 mt-5 font-medium">נדרים {open.length > 0 && <span className="pill-warn">פתוח: {nis(openSum)}</span>}</p>
            {nedarim.length === 0 && <p className="text-sm text-navy/50">אין נדרים רשומים.</p>}
            {nedarim.map((n) => (
              <div key={n.id} className="row">
                <span className="flex-1">
                  <span className="block text-sm">{n.purpose}</span>
                  <span className="block text-xs text-navy/50">{fmtDate(n.date)}</span>
                </span>
                <span className="font-medium">{nis(n.amount)}</span>
                {n.paid ? <span className="pill-ok">שולם</span> : (
                  <button className="chip !min-h-[36px]" onClick={() => dispatch({ type: "neder_paid", id: n.id })}>סמן שולם</button>
                )}
              </div>
            ))}
          </>
        )}
        {m && mode === "neder" && (
          <>
            <p className="mb-2 text-sm text-navy/60">סכום</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {[18, 36, 52, 100, 180, 360].map((v) => (
                <button key={v} className={`chip ${amount === v ? "chip-on" : ""}`} onClick={() => setAmount(v)}>{v} ₪</button>
              ))}
            </div>
            <p className="mb-2 text-sm text-navy/60">עבור</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <button key={p} className={`chip ${purpose === p ? "chip-on" : ""}`} onClick={() => setPurpose(p)}>{p}</button>
              ))}
            </div>
            <button className="btn-navy w-full" onClick={() => { dispatch({ type: "neder_add", memberId: m.id, amount, purpose }); setMode("card"); }}>
              לרשום נדר של {nis(amount)}
            </button>
          </>
        )}
        {m && mode === "remind" && (
          <>
            <WaPreview to={m.name} text={remindText} />
            <button className="btn-gold mt-4 w-full" onClick={() => { dispatch({ type: "message_add", to: m.name, text: remindText }); setMode("card"); }}>
              שלח (הדגמה, לא נשלח באמת)
            </button>
            <p className="mt-2 text-center text-xs text-navy/50">במערכת האמיתית: שליחה אחת לכל מי שחייב, בלחיצה.</p>
          </>
        )}
      </Sheet>
    </div>
  );
}
