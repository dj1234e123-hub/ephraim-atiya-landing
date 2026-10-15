import { useMemo, useState } from "react";
import { useStore } from "../store";
import { ScreenTitle, Sheet, WaPreview, fmtDate } from "../components/ui";
import { daysBetween } from "../lib/dates";
import type { Member } from "../seed";

function reason(m: Member, today: string): { text: string; score: number } {
  if (m.guest) return { text: "אורח השבת", score: 90 };
  if (m.yahrzeit) return { text: "יארצייט השבוע", score: 100 };
  if (!m.lastAliyah) return { text: "עדיין לא קיבל עלייה", score: 80 };
  const w = Math.floor(daysBetween(m.lastAliyah, today) / 7);
  return { text: w <= 0 ? "קיבל השבוע" : `לא קיבל ${w} שבועות`, score: Math.min(79, w * 3) };
}

export function Aliyot() {
  const { state, dispatch } = useStore();
  const [slot, setSlot] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState(false);
  const byId = useMemo(() => new Map(state.members.map((m) => [m.id, m])), [state.members]);
  const taken = new Set(state.aliyot.map((a) => a.memberId).filter(Boolean));
  const suggestions = useMemo(() => {
    return state.members
      .filter((m) => !taken.has(m.id))
      .filter((m) => !q || m.name.includes(q))
      .map((m) => ({ m, r: reason(m, state.today) }))
      .sort((a, b) => b.r.score - a.r.score)
      .slice(0, q ? 20 : 8);
  }, [state.members, state.today, q, state.aliyot]);

  const assigned = state.aliyot.filter((a) => a.memberId).length;
  const text = `סידור עליות, פרשת ${state.parsha.name}, שבת ${fmtDate(state.parsha.shabbat)}:\n` + state.aliyot.map((a) => `${a.name}: ${a.memberId ? byId.get(a.memberId)?.name : "—"}`).join("\n");

  return (
    <div className="fade">
      <ScreenTitle title="עליות לשבת" instead="לזכור בראש מי קיבל ומתי">
        <span className={assigned === state.aliyot.length ? "pill-ok" : "pill-warn"}>{assigned}/{state.aliyot.length}</span>
      </ScreenTitle>
      <p className="mb-3 text-sm text-navy/60">פרשת {state.parsha.name} · לחיצה על עלייה פותחת הצעות: מי לא קיבל מזמן, יארצייט, אורחים.</p>

      <div className="card p-2">
        {state.aliyot.map((a) => {
          const m = a.memberId ? byId.get(a.memberId) : null;
          return (
            <button key={a.key} className="row w-full px-2 text-start" onClick={() => { setSlot(a.key); setQ(""); }}>
              <span className="w-14 shrink-0 font-title text-lg">{a.name}</span>
              <span className="flex-1">
                <span className={`block ${m ? "font-medium" : "text-navy/40"}`}>{m ? m.name : "לשבץ…"}</span>
                <span className="block text-xs text-navy/50">{a.range}</span>
              </span>
              {m ? <span className="pill-ok">שובץ</span> : <span className="pill-warn">פנוי</span>}
            </button>
          );
        })}
      </div>

      <button className="btn-navy mt-4 w-full" onClick={() => setPreview(true)} disabled={assigned === 0}>
        לשלוח את הסידור לגבאי השני
      </button>

      <Sheet open={slot !== null} onClose={() => setSlot(null)} title={`שיבוץ: ${slot ?? ""}`}>
        {slot && state.aliyot.find((a) => a.key === slot)?.memberId && (
          <button className="btn-line mb-3 w-full" onClick={() => { dispatch({ type: "assign", slot, memberId: null }); setSlot(null); }}>
            לפנות את העלייה
          </button>
        )}
        <input className="input mb-3" placeholder="חיפוש מתפלל…" value={q} onChange={(e) => setQ(e.target.value)} />
        <p className="mb-2 text-xs text-navy/50">{q ? "תוצאות" : "הצעות המערכת, לפי מי שהכי מגיע לו"}</p>
        {suggestions.map(({ m, r }) => (
          <button key={m.id} className="row w-full text-start" onClick={() => { dispatch({ type: "assign", slot: slot!, memberId: m.id }); setSlot(null); }}>
            <span className="flex-1">
              <span className="block font-medium">{m.name}</span>
              <span className="block text-xs text-navy/50">{m.note ?? r.text}</span>
            </span>
            <span className={r.score >= 80 ? "pill-warn" : "pill-muted"}>{r.text}</span>
          </button>
        ))}
      </Sheet>

      <Sheet open={preview} onClose={() => setPreview(false)} title="שליחה בוואטסאפ">
        <WaPreview to="הגבאי השני" text={text} />
        <button className="btn-gold mt-4 w-full" onClick={() => { dispatch({ type: "message_add", to: "הגבאי השני", text }); setPreview(false); }}>
          שלח (הדגמה, לא נשלח באמת)
        </button>
      </Sheet>
    </div>
  );
}
