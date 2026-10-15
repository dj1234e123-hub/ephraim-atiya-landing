/**
 * הדפסות ממותגות ל-A4. נפתחות בכתובת #print/…, בלי סרגל הניווט, עם כפתור הדפסה.
 * הדפדפן מדפיס או שומר כ-PDF. במערכת האמיתית: אותו דף נשלח גם בוואטסאפ כתמונה.
 */
import { useEffect, type ReactNode } from "react";
import { useStore, memberName } from "../store";
import { fmtDate } from "../components/ui";
import { nis } from "../seed";
import { hhmm, shabbatZmanim, weekdayZmanim } from "../lib/zmanim";
import { zmanimFor, familyName, firstName, hebrewLabel } from "../lib/shul";
import { hebrewDayInfo } from "../lib/hebcal";
import { shiftDayKey, weekStartKey } from "../lib/dates";
import { weekParsha } from "../lib/parsha";
import { track } from "../analytics";

export function Print({ route }: { route: string }) {
  const parts = route.split("/").filter(Boolean); // ["print", kind, ...]
  const kind = parts[1] ?? "shabbat";
  useEffect(() => {
    track("demo_print_view", { kind });
  }, [kind]);
  let body: ReactNode;
  let title = "";
  switch (kind) {
    case "shabbat": title = "דף שבת"; body = <ShabbatSheet />; break;
    case "month": title = "לוח זמנים חודשי"; body = <MonthBoard />; break;
    case "aliyot": title = "כרטיס עליות"; body = <AliyotCard />; break;
    case "yahrzeit": title = "רשימת אזכרות"; body = <YahrzeitList />; break;
    case "month-summary": title = "דוח חודשי לוועד"; body = <MonthSummary />; break;
    case "receipt": title = "קבלה"; body = <Receipt id={parts[2]} />; break;
    case "thanks": title = "מכתב תודה"; body = <ThankYou source={parts[2]} id={parts[3]} />; break;
    case "statement": title = "דף חשבון"; body = <Statement memberId={parts[2]} />; break;
    default: title = "הדפסה"; body = <p>לא נמצא.</p>;
  }
  return (
    <div className="print-wrap">
      <div className="no-print mx-auto flex max-w-[210mm] items-center justify-between gap-3 px-4 py-3">
        <a href="#home" className="text-sm text-navy/70" onClick={() => { history.back(); }}>→ חזרה למערכת</a>
        <span className="text-sm font-medium">{title}</span>
        <button className="btn-navy !min-h-[40px] !px-5 text-sm" onClick={() => { track("demo_print_dialog", { kind }); window.print(); }}>להדפיס / לשמור PDF</button>
      </div>
      <div className="print-page">{body}</div>
      <p className="no-print mx-auto max-w-[210mm] px-4 pb-8 pt-3 text-center text-xs text-navy/50">
        ההדפסה נושאת את שם בית הכנסת, הכתובת והסמל. במערכת האמיתית: הלוגו האמיתי, והדף נשלח גם בוואטסאפ.
      </p>
    </div>
  );
}

function Head({ sub }: { sub?: string }) {
  const { state } = useStore();
  const s = state.shul;
  return (
    <header className="print-head">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 120 150" className="h-14 w-auto" aria-hidden="true">
          <path d="M 18 142 V 70 A 42 42 0 0 1 102 70 V 142" fill="none" stroke="#14213D" strokeWidth="5" strokeLinecap="round" />
          <polygon points="47,18 73,18 69,46 51,46" fill="#C9A24A" />
          <text x="60" y="118" textAnchor="middle" fontFamily="Frank Ruhl Libre, serif" fontSize="56" fontWeight="700" fill="#14213D">{s.mark}</text>
        </svg>
        <div>
          <p className="font-title text-2xl font-bold leading-tight">בית הכנסת {s.name}</p>
          <p className="text-sm text-navy/70">{s.place} · נוסח {s.nusach}</p>
        </div>
      </div>
      {sub && <p className="text-sm text-navy/70">{sub}</p>}
    </header>
  );
}
function Foot() {
  const { state } = useStore();
  const s = state.shul;
  return <footer className="print-foot">{s.address} · {s.phone} · הופק ב-{fmtDate(state.today)}</footer>;
}

function ShabbatSheet() {
  const { state } = useStore();
  const z = zmanimFor(state);
  const info = hebrewDayInfo(state.parsha.shabbat);
  const k = state.kiddushim[0];
  const kName = k?.sponsorMemberId ? memberName(state, k.sponsorMemberId) : k?.sponsorName ?? "";
  const weekEnd = state.parsha.shabbat;
  const weekStart = shiftDayKey(weekEnd, -6);
  const events = state.events.filter((e) => e.date >= weekStart && e.date <= shiftDayKey(weekEnd, 7) && e.kind !== "יארצייט");
  const yz = state.members.filter((m) => m.yahrzeit);
  const next = shabbatZmanim(shiftDayKey(state.parsha.shabbat, 7), state.shul.lat, state.shul.lon, state.shul.rules);
  const nextP = weekParsha(shiftDayKey(weekStartKey(state.parsha.shabbat), 7));
  return (
    <>
      <Head sub={`${info.label} · ${fmtDate(state.parsha.shabbat)}`} />
      <h1 className="print-h1">שבת פרשת {state.parsha.niqqud || state.parsha.name}</h1>
      {state.parsha.note && <p className="-mt-2 mb-3 text-center text-sm">{state.parsha.note}</p>}
      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="print-h2">זמני השבת</h2>
          <table className="print-table">
            <tbody>
              <tr><td>הדלקת נרות</td><td dir="ltr">{hhmm(z.candles)}</td></tr>
              <tr><td>מנחה וקבלת שבת</td><td dir="ltr">{hhmm(z.minchaErev)}</td></tr>
              <tr><td>שחרית</td><td dir="ltr">{hhmm(z.shacharit)}</td></tr>
              <tr><td>מנחה</td><td dir="ltr">{hhmm(z.minchaShabbat)}</td></tr>
              <tr><td>שקיעה</td><td dir="ltr">{hhmm(z.sunsetSat)}</td></tr>
              <tr><td>צאת השבת וערבית</td><td dir="ltr">{hhmm(z.tzeit)}</td></tr>
            </tbody>
          </table>
          <h2 className="print-h2 mt-5">קידוש</h2>
          <p>{kName ? `באדיבות משפחת ${familyName(kName)}, לרגל ${k.occasion}. הקהל מוזמן.` : "השבת אין חסות לקידוש. מי שרוצה לתת חסות, מוזמן לפנות לגבאי."}</p>
          <h2 className="print-h2 mt-5">אזכרות השבוע</h2>
          {yz.length === 0 ? <p>אין אזכרות השבוע.</p> : (
            <ul className="print-list">
              {yz.map((m) => <li key={m.id}>{m.yahrzeitFor} של {m.name}. תנצב״ה.</li>)}
            </ul>
          )}
        </section>
        <section>
          <h2 className="print-h2">סדר העליות</h2>
          <table className="print-table">
            <tbody>
              {state.aliyot.map((a) => (
                <tr key={a.key}><td className="w-20 font-medium">{a.name}</td><td>{a.memberId ? memberName(state, a.memberId) : "—"}</td></tr>
              ))}
            </tbody>
          </table>
          <h2 className="print-h2 mt-5">הודעות ושיעורים</h2>
          <ul className="print-list">
            {events.map((e) => <li key={e.id}>{e.title} ({fmtDate(e.date)})</li>)}
            <li>שיעור בין מנחה לערבית בשבת: הלכות שבת, הרב של הקהילה.</li>
            {state.tickets.some((t) => t.status !== "סגור" && t.where === "עזרת נשים") && <li>המזגן בעזרת נשים בטיפול. סליחה על אי הנוחות.</li>}
          </ul>
        </section>
      </div>
      <div className="mt-6 rounded-lg border border-navy/20 p-3 text-sm">
        <b>השבת הבאה:</b> פרשת {nextP?.name ?? ""} · הדלקת נרות {hhmm(next.candles)} · מנחה {hhmm(next.minchaErev)} · צאת השבת {hhmm(next.tzeit)}
      </div>
      <p className="mt-6 text-center font-title text-2xl">שבת שלום ומבורך</p>
      <Foot />
    </>
  );
}

function MonthBoard() {
  const { state } = useStore();
  const month = state.parsha.shabbat.slice(0, 7);
  const rows: Array<{ shabbat: string; parsha: string }> = [];
  let ws = weekStartKey(state.parsha.shabbat);
  for (let i = 0; i < 6; i++) {
    const p = weekParsha(ws);
    const sk = shiftDayKey(ws, 6);
    if (sk.slice(0, 7) === month || i === 0) rows.push({ shabbat: sk, parsha: p?.name ?? "" });
    ws = shiftDayKey(ws, 7);
  }
  const wd = weekdayZmanim(state.today, state.shul.lat, state.shul.lon, state.shul.rules);
  const label = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "Asia/Jerusalem" }).format(new Date(month + "-15T12:00:00Z"));
  return (
    <>
      <Head sub={label} />
      <h1 className="print-h1">זמני התפילות · {hebrewLabel(state.parsha.shabbat).split(" ").slice(1).join(" ")}</h1>
      <table className="print-table print-table-grid">
        <thead>
          <tr><th>שבת</th><th>פרשה</th><th>הדלקת נרות</th><th>מנחה וקב״ש</th><th>שחרית</th><th>מנחה</th><th>צאת השבת</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const z = shabbatZmanim(r.shabbat, state.shul.lat, state.shul.lon, state.shul.rules);
            return (
              <tr key={r.shabbat}>
                <td>{fmtDate(r.shabbat)}</td><td>{r.parsha}</td>
                <td dir="ltr">{hhmm(z.candles)}</td><td dir="ltr">{hhmm(z.minchaErev)}</td><td dir="ltr">{hhmm(z.shacharit)}</td><td dir="ltr">{hhmm(z.minchaShabbat)}</td><td dir="ltr">{hhmm(z.tzeit)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h2 className="print-h2 mt-6">ימי חול</h2>
      <table className="print-table">
        <tbody>
          <tr><td>שחרית</td><td dir="ltr">{wd.shacharit}</td></tr>
          <tr><td>מנחה</td><td>{wd.mincha} (כ-{state.shul.rules.minchaWeekdayBeforeSunset} דקות לפני השקיעה, משתנה)</td></tr>
          <tr><td>ערבית</td><td>{wd.arvit} (בצאת הכוכבים)</td></tr>
        </tbody>
      </table>
      <p className="mt-4 text-sm text-navy/70">הזמנים מחושבים ל{state.shul.place}. הדלקת נרות {state.shul.rules.candleOffset} דקות לפני השקיעה.</p>
      <Foot />
    </>
  );
}

function AliyotCard() {
  const { state } = useStore();
  return (
    <>
      <Head sub={`שבת פרשת ${state.parsha.name} · ${fmtDate(state.parsha.shabbat)}`} />
      <h1 className="print-h1">סדר העליות</h1>
      <table className="print-table print-big">
        <tbody>
          {state.aliyot.map((a) => (
            <tr key={a.key}>
              <td className="w-28 font-bold">{a.name}</td>
              <td>{a.memberId ? memberName(state, a.memberId) : "____________"}</td>
              <td className="text-sm text-navy/60">{a.range}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-sm text-navy/70">מי שברך: {state.members.filter((m) => m.yahrzeit).map((m) => m.name).join(", ") || "—"}</p>
      <Foot />
    </>
  );
}

function YahrzeitList() {
  const { state } = useStore();
  const yz = state.members.filter((m) => m.yahrzeit);
  return (
    <>
      <Head sub={`שבוע פרשת ${state.parsha.name}`} />
      <h1 className="print-h1">אזכרות השבוע</h1>
      <table className="print-table print-big">
        <thead><tr><th>הנפטר/ת</th><th>המתפלל</th><th>עלייה</th></tr></thead>
        <tbody>
          {yz.map((m) => (
            <tr key={m.id}>
              <td>{m.yahrzeitFor}</td>
              <td>{m.name}</td>
              <td>{state.aliyot.find((a) => a.memberId === m.id)?.name ?? "לא שובצה"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm">לימוד משניות לעילוי נשמתם אחרי ערבית. תנצב״ה.</p>
      <Foot />
    </>
  );
}

function MonthSummary() {
  const { state } = useStore();
  const month = state.today.slice(0, 7);
  const monthDon = state.donations.filter((d) => d.date.slice(0, 7) === month);
  const monthSum = monthDon.reduce((s, d) => s + d.amount, 0);
  const soSum = state.standingOrders.reduce((s, o) => s + o.amount, 0);
  const openNedarim = state.nedarim.filter((n) => !n.paid);
  const openSum = openNedarim.reduce((s, n) => s + n.amount, 0);
  const paidNedarim = state.nedarim.filter((n) => n.paid && n.date.slice(0, 7) === month).reduce((s, n) => s + n.amount, 0);
  const expenses = [["חשמל", 1840], ["ניקיון", 1200], ["מים", 210], ["ביטוח", 390]] as Array<[string, number]>;
  const expSum = expenses.reduce((s, e) => s + e[1], 0);
  const income = monthSum + soSum + paidNedarim;
  const label = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "Asia/Jerusalem" }).format(new Date(month + "-15T12:00:00Z"));
  const top = [...state.nedarim.filter((n) => !n.paid)].reduce<Record<string, number>>((acc, n) => ((acc[n.memberId] = (acc[n.memberId] ?? 0) + n.amount), acc), {});
  return (
    <>
      <Head sub={`לוועד בית הכנסת · ${label}`} />
      <h1 className="print-h1">דוח חודשי</h1>
      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="print-h2">הכנסות</h2>
          <table className="print-table">
            <tbody>
              <tr><td>תרומות ({monthDon.length})</td><td>{nis(monthSum)}</td></tr>
              <tr><td>הוראות קבע ({state.standingOrders.length})</td><td>{nis(soSum)}</td></tr>
              <tr><td>נדרים ששולמו</td><td>{nis(paidNedarim)}</td></tr>
              <tr className="font-bold"><td>סה״כ</td><td>{nis(income)}</td></tr>
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="print-h2">הוצאות</h2>
          <table className="print-table">
            <tbody>
              {expenses.map(([t, v]) => <tr key={t}><td>{t}</td><td>{nis(v)}</td></tr>)}
              <tr className="font-bold"><td>סה״כ</td><td>{nis(expSum)}</td></tr>
            </tbody>
          </table>
        </section>
      </div>
      <h2 className="print-h2 mt-6">נדרים פתוחים: {nis(openSum)} ({openNedarim.length} נדרים)</h2>
      <table className="print-table">
        <tbody>
          {Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, v]) => <tr key={id}><td>{memberName(state, id)}</td><td>{nis(v)}</td></tr>)}
        </tbody>
      </table>
      <h2 className="print-h2 mt-6">מקומות לימים נוראים</h2>
      <p>{state.seats.filter((s) => s.memberId).length} מקומות משובצים מתוך {state.seats.length}. שולם: {nis(state.seats.filter((s) => s.paid).reduce((a, s) => a + s.price, 0))}. לגבייה: {nis(state.seats.filter((s) => s.memberId && !s.paid).reduce((a, s) => a + s.price, 0))}.</p>
      <Foot />
    </>
  );
}

function Receipt({ id }: { id?: string }) {
  const { state } = useStore();
  const d = state.donations.find((x) => x.id === id);
  if (!d) return <p>לא נמצאה תרומה.</p>;
  const name = d.memberId ? memberName(state, d.memberId) : d.donor ?? "";
  const num = 1000 + state.donations.length - state.donations.indexOf(d);
  return (
    <>
      <Head sub={`קבלה מס׳ ${num}`} />
      <h1 className="print-h1">קבלה על תרומה</h1>
      <table className="print-table print-big mx-auto max-w-md">
        <tbody>
          <tr><td>התקבל מאת</td><td>{name}</td></tr>
          <tr><td>סכום</td><td>{nis(d.amount)}</td></tr>
          <tr><td>עבור</td><td>{d.purpose}</td></tr>
          <tr><td>תאריך</td><td>{fmtDate(d.date)} · {hebrewLabel(d.date)}</td></tr>
          <tr><td>אמצעי תשלום</td><td>מזומן / העברה</td></tr>
        </tbody>
      </table>
      <p className="mt-6 text-center">תודה רבה. תזכו למצוות.</p>
      <p className="mt-10 text-center text-sm text-navy/60">עמותת בית הכנסת {state.shul.name} (ע״ר 58-000-0000) · תרומה מוכרת לפי סעיף 46 · חתימת הגזבר: ____________</p>
      <Foot />
    </>
  );
}

function ThankYou({ source, id }: { source?: string; id?: string }) {
  const { state, dispatch } = useStore();
  let name = "";
  let what = "";
  let thanked = true;
  let onMark: (() => void) | null = null;
  if (source === "so") {
    const o = state.standingOrders.find((x) => x.id === id);
    if (!o) return <p>לא נמצא.</p>;
    name = memberName(state, o.memberId);
    what = `על הוראת הקבע החדשה, ${nis(o.amount)} בכל חודש`;
    thanked = o.thanked;
    onMark = () => dispatch({ type: "so_thanked", id: o.id });
  } else {
    const d = state.donations.find((x) => x.id === id);
    if (!d) return <p>לא נמצא.</p>;
    name = d.memberId ? memberName(state, d.memberId) : d.donor ?? "";
    what = `על תרומתך, ${nis(d.amount)} עבור ${d.purpose}`;
    thanked = !!d.thanked;
    onMark = () => dispatch({ type: "donation_thanked", id: d.id });
  }
  return (
    <>
      <Head sub={hebrewLabel(state.today)} />
      <div className="mx-auto max-w-xl py-6">
        <p className="font-title text-3xl">{firstName(name)} היקר,</p>
        <p className="mt-6 text-lg leading-relaxed">
          תודה {what}. בזכותך האור דולק, המזגן עובד בשבת, הקידוש על השולחן, והילדים מקבלים סופגנייה בחנוכה.
        </p>
        <p className="mt-4 text-lg leading-relaxed">
          בית כנסת זה לא בניין. זה אנשים שלוקחים אחריות אחד על השני. אתה מהם.
        </p>
        <p className="mt-4 text-lg leading-relaxed">יהי רצון שתזכה לראות ברכה בכל מעשה ידיך, ושנזכה יחד להרבות תורה ותפילה במקום הזה.</p>
        <p className="mt-10 font-title text-xl">בברכה ובהוקרה,</p>
        <p className="font-title text-xl">הגבאים וועד בית הכנסת {state.shul.name}</p>
      </div>
      {!thanked && onMark && (
        <div className="no-print mt-4 text-center">
          <button className="btn-gold !min-h-[44px] text-sm" onClick={onMark}>סמן: המכתב נמסר</button>
        </div>
      )}
      <Foot />
    </>
  );
}

function Statement({ memberId }: { memberId?: string }) {
  const { state } = useStore();
  const m = state.members.find((x) => x.id === memberId);
  if (!m) return <p>לא נמצא מתפלל.</p>;
  const rows = state.nedarim.filter((n) => n.memberId === m.id).sort((a, b) => b.date.localeCompare(a.date));
  const open = rows.filter((n) => !n.paid).reduce((s, n) => s + n.amount, 0);
  const seat = state.seats.find((s) => s.memberId === m.id);
  return (
    <>
      <Head sub={hebrewLabel(state.today)} />
      <h1 className="print-h1">דף חשבון · {m.name}</h1>
      <p className="mb-4 text-sm text-navy/70">{m.street} · {m.phone}</p>
      <table className="print-table">
        <thead><tr><th>תאריך</th><th>עבור</th><th>סכום</th><th>מצב</th></tr></thead>
        <tbody>
          {rows.map((n) => (
            <tr key={n.id}><td>{fmtDate(n.date)}</td><td>{n.purpose}</td><td>{nis(n.amount)}</td><td>{n.paid ? "שולם" : "פתוח"}</td></tr>
          ))}
          {seat && <tr><td>—</td><td>מקום לימים נוראים (שורה {seat.row}, מקום {seat.num})</td><td>{nis(seat.price)}</td><td>{seat.paid ? "שולם" : "פתוח"}</td></tr>}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-navy p-4 text-cream">
        <span>יתרה לתשלום</span>
        <span className="font-title text-2xl">{nis(open + (seat && !seat.paid ? seat.price : 0))}</span>
      </div>
      <p className="mt-4 text-sm">אפשר להסדיר בביט למספר {state.shul.phone}, בהוראת קבע, או במזומן לגבאי. כל תשלום מקבל קבלה.</p>
      <p className="mt-2 text-sm text-navy/60">אם משהו לא מדויק, דברו איתנו. הכול ניתן לתיקון.</p>
      <Foot />
    </>
  );
}
