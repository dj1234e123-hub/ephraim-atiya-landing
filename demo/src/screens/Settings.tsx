import { useState } from "react";
import { useStore } from "../store";
import { hhmm } from "../lib/zmanim";
import { zmanimFor } from "../lib/shul";
import type { ShulSettings } from "../seed";

/** פרטי בית הכנסת: מה שהופך את ההדפסות וההודעות ל"שלהם". */
export function Settings() {
  const { state, dispatch } = useStore();
  const s = state.shul;
  const [draft, setDraft] = useState<ShulSettings>(s);
  const z = zmanimFor({ ...state, shul: draft });
  const set = (patch: Partial<ShulSettings>) => setDraft({ ...draft, ...patch });
  const setRule = (patch: Partial<ShulSettings["rules"]>) => setDraft({ ...draft, rules: { ...draft.rules, ...patch } });
  const dirty = JSON.stringify(draft) !== JSON.stringify(s);
  const field = (label: string, key: keyof ShulSettings) => (
    <label className="block">
      <span className="mb-1 block text-xs text-navy/60">{label}</span>
      <input className="input" value={String(draft[key])} onChange={(e) => set({ [key]: e.target.value } as Partial<ShulSettings>)} />
    </label>
  );
  const num = (label: string, key: keyof ShulSettings["rules"]) => (
    <label className="block">
      <span className="mb-1 block text-xs text-navy/60">{label}</span>
      <input className="input" type="number" value={draft.rules[key] as number} onChange={(e) => setRule({ [key]: Number(e.target.value) } as Partial<ShulSettings["rules"]>)} />
    </label>
  );

  return (
    <div className="fade space-y-3">
      <div className="card space-y-3">
        <p className="font-medium">בית הכנסת</p>
        {field("שם", "name")}
        {field("יישוב", "place")}
        {field("כתובת להדפסות", "address")}
        {field("טלפון", "phone")}
        <label className="block">
          <span className="mb-1 block text-xs text-navy/60">נוסח</span>
          <div className="flex gap-2">
            {(["ספרד", "אשכנז", "עדות המזרח"] as const).map((n) => (
              <button key={n} className={`chip ${draft.nusach === n ? "chip-on" : ""}`} onClick={() => set({ nusach: n })}>{n}</button>
            ))}
          </div>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {field("גבאי", "gabbai")}
          {field("גבאי שני", "gabbai2")}
          {field("מנקה", "cleaner")}
        </div>
      </div>

      <div className="card space-y-3">
        <p className="font-medium">כללי הזמנים</p>
        <p className="text-xs text-navy/50">השקיעה מחושבת למיקום ({draft.lat}, {draft.lon}). הכללים קובעים את זמני התפילה שעל הדף.</p>
        <div className="grid grid-cols-2 gap-2">
          {num("הדלקת נרות: דקות לפני השקיעה", "candleOffset")}
          {num("מנחה ע״ש: דקות לפני ההדלקה", "minchaErevBeforeCandles")}
          <label className="block">
            <span className="mb-1 block text-xs text-navy/60">שחרית שבת</span>
            <input className="input" value={draft.rules.shacharitShabbat} onChange={(e) => setRule({ shacharitShabbat: e.target.value })} />
          </label>
          {num("מנחה שבת: דקות לפני השקיעה", "minchaShabbatBeforeSunset")}
          <label className="block">
            <span className="mb-1 block text-xs text-navy/60">שחרית חול</span>
            <input className="input" value={draft.rules.shacharitWeekday} onChange={(e) => setRule({ shacharitWeekday: e.target.value })} />
          </label>
          {num("מנחה חול: דקות לפני השקיעה", "minchaWeekdayBeforeSunset")}
        </div>
        <div className="rounded-xl bg-navy p-3 text-sm text-cream">
          <p className="mb-1 text-xs text-cream/60">תצוגה מקדימה לשבת הקרובה</p>
          <p>הדלקת נרות {hhmm(z.candles)} · מנחה {hhmm(z.minchaErev)} · שחרית {hhmm(z.shacharit)} · מנחה {hhmm(z.minchaShabbat)} · צאת השבת {hhmm(z.tzeit)}</p>
        </div>
      </div>

      <button className="btn-navy w-full" disabled={!dirty} onClick={() => dispatch({ type: "settings", patch: draft })}>
        לשמור
      </button>
      <p className="text-center text-xs text-navy/50">הלוגו, הצבעים ותבנית דף השבת נקבעים באפיון. בהדגמה: שם, כתובת וכללים.</p>
    </div>
  );
}
