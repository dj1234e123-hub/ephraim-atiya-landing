import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { buildSeed, type State, type Ticket } from "./seed";
import { todayKey } from "./lib/dates";

const KEY = "demo_minchat_yehuda_v1";

export type Action =
  | { type: "assign"; slot: string; memberId: string | null }
  | { type: "neder_add"; memberId: string; amount: number; purpose: string }
  | { type: "neder_paid"; id: string }
  | { type: "donation_add"; memberId: string | null; donor?: string; amount: number; purpose: string }
  | { type: "ticket_add"; title: string; where: string; urgent: boolean }
  | { type: "ticket_status"; id: string; status: Ticket["status"]; owner?: string | null }
  | { type: "message_add"; to: string; text: string }
  | { type: "reset" };

let seq = 1000;
const nid = (p: string) => `${p}${++seq}`;

function reducer(s: State, a: Action): State {
  const today = todayKey();
  switch (a.type) {
    case "assign": {
      const aliyot = s.aliyot.map((x) => (x.key === a.slot ? { ...x, memberId: a.memberId } : x));
      const members = a.memberId ? s.members.map((m) => (m.id === a.memberId ? { ...m, lastAliyah: s.parsha.shabbat } : m)) : s.members;
      return { ...s, aliyot, members, log: [`שובצה עלייה: ${a.slot}`, ...s.log] };
    }
    case "neder_add":
      return { ...s, nedarim: [{ id: nid("n"), memberId: a.memberId, amount: a.amount, purpose: a.purpose, date: today, paid: false }, ...s.nedarim], log: ["נרשם נדר", ...s.log] };
    case "neder_paid":
      return { ...s, nedarim: s.nedarim.map((n) => (n.id === a.id ? { ...n, paid: true } : n)), log: ["נדר סומן כשולם", ...s.log] };
    case "donation_add":
      return { ...s, donations: [{ id: nid("d"), memberId: a.memberId, donor: a.donor, amount: a.amount, purpose: a.purpose, date: today }, ...s.donations], log: ["נרשמה תרומה", ...s.log] };
    case "ticket_add":
      return { ...s, tickets: [{ id: nid("t"), title: a.title, where: a.where, urgent: a.urgent, status: "פתוח", owner: null, opened: today }, ...s.tickets], log: ["נפתחה תקלה", ...s.log] };
    case "ticket_status":
      return { ...s, tickets: s.tickets.map((t) => (t.id === a.id ? { ...t, status: a.status, owner: a.owner === undefined ? t.owner : a.owner } : t)) };
    case "message_add":
      return { ...s, messages: [{ id: nid("x"), to: a.to, text: a.text, date: today }, ...s.messages], log: ["נשלחה הודעה (הדגמה)", ...s.log] };
    case "reset":
      return buildSeed();
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.version === 1 && s.today === todayKey()) return s;
    }
  } catch {
    /* localStorage לא זמין: מתחילים מהזרע */
  }
  return buildSeed();
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* best effort */
    }
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
