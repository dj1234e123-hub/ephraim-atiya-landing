import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { buildSeed, type State, type Ticket, type ShulSettings, type StandingOrder } from "./seed";
import { todayKey } from "./lib/dates";

const KEY = "demo_minchat_yehuda_v2";

export type Action =
  | { type: "assign"; slot: string; memberId: string | null }
  | { type: "neder_add"; memberId: string; amount: number; purpose: string }
  | { type: "neder_paid"; id: string }
  | { type: "donation_add"; memberId: string | null; donor?: string; amount: number; purpose: string }
  | { type: "donation_thanked"; id: string }
  | { type: "ticket_add"; title: string; where: string; urgent: boolean }
  | { type: "ticket_status"; id: string; status: Ticket["status"]; owner?: string | null }
  | { type: "message_add"; to: string; text: string }
  | { type: "reminder_sent"; key: string; to: string; text: string }
  | { type: "prep_toggle"; id: string }
  | { type: "prep_add"; title: string; owner: string }
  | { type: "holiday_toggle"; holidayId: string; taskId: string }
  | { type: "clock_checked"; id: string }
  | { type: "kiddush_set"; shabbat: string; sponsorMemberId: string | null; sponsorName?: string; occasion: string }
  | { type: "so_add"; memberId: string; amount: number; method: StandingOrder["method"] }
  | { type: "so_thanked"; id: string }
  | { type: "integration_toggle"; id: string }
  | { type: "seat_assign"; seatId: string; memberId: string | null }
  | { type: "seat_paid"; seatId: string }
  | { type: "settings"; patch: Partial<ShulSettings> }
  | { type: "reset" };

let seq = 1000;
const nid = (p: string) => `${p}${++seq}`;

function reducer(s: State, a: Action): State {
  const today = todayKey();
  switch (a.type) {
    case "assign": {
      const aliyot = s.aliyot.map((x) => (x.key === a.slot ? { ...x, memberId: a.memberId } : x));
      const members = a.memberId ? s.members.map((m) => (m.id === a.memberId ? { ...m, lastAliyah: s.parsha.shabbat } : m)) : s.members;
      const allSet = aliyot.every((x) => x.memberId);
      const prep = { ...s.prep, tasks: s.prep.tasks.map((t) => (t.id === "p-aliyot" ? { ...t, done: allSet || t.done } : t)) };
      return { ...s, aliyot, members, prep, log: [`שובצה עלייה: ${a.slot}`, ...s.log] };
    }
    case "neder_add":
      return { ...s, nedarim: [{ id: nid("n"), memberId: a.memberId, amount: a.amount, purpose: a.purpose, date: today, paid: false }, ...s.nedarim], log: ["נרשם נדר", ...s.log] };
    case "neder_paid":
      return { ...s, nedarim: s.nedarim.map((n) => (n.id === a.id ? { ...n, paid: true } : n)), log: ["נדר סומן כשולם", ...s.log] };
    case "donation_add":
      return { ...s, donations: [{ id: nid("d"), memberId: a.memberId, donor: a.donor, amount: a.amount, purpose: a.purpose, date: today, thanked: false }, ...s.donations], log: ["נרשמה תרומה", ...s.log] };
    case "donation_thanked":
      return { ...s, donations: s.donations.map((d) => (d.id === a.id ? { ...d, thanked: true } : d)), log: ["נשלח מכתב תודה (הדגמה)", ...s.log] };
    case "ticket_add":
      return { ...s, tickets: [{ id: nid("t"), title: a.title, where: a.where, urgent: a.urgent, status: "פתוח", owner: null, opened: today }, ...s.tickets], log: ["נפתחה תקלה", ...s.log] };
    case "ticket_status":
      return { ...s, tickets: s.tickets.map((t) => (t.id === a.id ? { ...t, status: a.status, owner: a.owner === undefined ? t.owner : a.owner } : t)) };
    case "message_add":
      return { ...s, messages: [{ id: nid("x"), to: a.to, text: a.text, date: today }, ...s.messages], log: ["נשלחה הודעה (הדגמה)", ...s.log] };
    case "reminder_sent":
      return { ...s, sentReminders: [...s.sentReminders, a.key], messages: [{ id: nid("x"), to: a.to, text: a.text, date: today }, ...s.messages], log: ["נשלחה תזכורת (הדגמה)", ...s.log] };
    case "prep_toggle":
      return { ...s, prep: { ...s.prep, tasks: s.prep.tasks.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t)) } };
    case "prep_add":
      return { ...s, prep: { ...s.prep, tasks: [...s.prep.tasks, { id: nid("p"), title: a.title, owner: a.owner, dueMin: null, done: false }] }, log: ["נוספה משימה להכנות", ...s.log] };
    case "holiday_toggle":
      return { ...s, holidays: s.holidays.map((h) => (h.id === a.holidayId ? { ...h, tasks: h.tasks.map((t) => (t.id === a.taskId ? { ...t, done: !t.done } : t)) } : h)) };
    case "clock_checked":
      return { ...s, clocks: s.clocks.map((c) => (c.id === a.id ? { ...c, lastChecked: today } : c)), log: ["שעון שבת נבדק", ...s.log] };
    case "kiddush_set":
      return {
        ...s,
        kiddushim: s.kiddushim.map((k) => (k.shabbat === a.shabbat ? { ...k, sponsorMemberId: a.sponsorMemberId, sponsorName: a.sponsorName, occasion: a.occasion } : k)),
        log: ["נרשמה חסות לקידוש", ...s.log],
      };
    case "so_add":
      return { ...s, standingOrders: [{ id: nid("so"), memberId: a.memberId, amount: a.amount, method: a.method, day: 10, since: today, thanked: false }, ...s.standingOrders], log: ["נרשמה הוראת קבע", ...s.log] };
    case "so_thanked":
      return { ...s, standingOrders: s.standingOrders.map((o) => (o.id === a.id ? { ...o, thanked: true } : o)), log: ["נשלחה תודה על הוראת קבע (הדגמה)", ...s.log] };
    case "integration_toggle":
      return { ...s, integrations: s.integrations.map((i) => (i.id === a.id ? { ...i, connected: !i.connected } : i)), log: ["שונה חיבור (הדגמה)", ...s.log] };
    case "seat_assign":
      return { ...s, seats: s.seats.map((x) => (x.id === a.seatId ? { ...x, memberId: a.memberId, paid: a.memberId ? x.paid : false } : x)), log: ["שונה שיבוץ מקום", ...s.log] };
    case "seat_paid":
      return { ...s, seats: s.seats.map((x) => (x.id === a.seatId ? { ...x, paid: true } : x)), log: ["מקום סומן כשולם", ...s.log] };
    case "settings":
      return { ...s, shul: { ...s.shul, ...a.patch, rules: { ...s.shul.rules, ...(a.patch.rules ?? {}) } }, log: ["עודכנו פרטי בית הכנסת", ...s.log] };
    case "reset":
      return buildSeed();
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.version === 2 && s.today === todayKey()) return s;
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

/** שם מתפלל לפי מזהה, עם ברירת מחדל */
export function memberName(s: State, id: string | null | undefined, fallback = "—"): string {
  if (!id) return fallback;
  return s.members.find((m) => m.id === id)?.name ?? fallback;
}
