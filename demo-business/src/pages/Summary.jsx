import { useState } from 'react'
import { db, useData } from '../lib/data'
import {
  ILS, KIND, CATEGORIES, assignable, isUnpaidExpense, num, weekStart, weekEnd, monthStart, monthEnd,
  fmtDate, toISODate, localDateOf, priceOf, hoursOf,
} from '../lib/format'
import { Card, Choice, Loading, PageTitle, Section, StepNav } from '../components/ui'

export default function Summary() {
  const [mode, setMode] = useState('month')
  const [offset, setOffset] = useState(0)
  // Anchor on the 1st when stepping months: setMonth() on a 29th-31st overflows
  // into the next month, which made an arrow appear stuck and then skip a month.
  const now = new Date()
  const base = mode === 'month'
    ? new Date(now.getFullYear(), now.getMonth() + offset, 1)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset * 7)
  const anchor = toISODate(base)
  const from = mode === 'month' ? monthStart(base) : weekStart(anchor)
  const to = mode === 'month' ? monthEnd(base) : weekEnd(anchor)
  const label = mode === 'month' ? base.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }) : `${fmtDate(from)} – ${fmtDate(to)}`

  const { data, loading } = useData(async () => {
    const [payments, expenses, jobs, profiles] = await Promise.all([
      db.paymentsBetween(from, to), db.expensesBetween(from, to), db.jobs(), db.profiles(),
    ])
    return { payments, expenses, jobs, profiles }
  }, [from, to])

  const { payments = [], expenses = [], jobs = [], profiles = [] } = data || {}
  const income = payments.reduce((s, p) => s + num(p.amount), 0)
  const spent = expenses.reduce((s, e) => s + num(e.amount), 0)
  // Materials taken on account are a cost of the month even though the money
  // has not moved, so they count in the profit and are flagged separately.
  const owedToSuppliers = expenses.filter(isUnpaidExpense).reduce((s, e) => s + num(e.amount), 0)
  const profit = income - spent

  // A job finished the same day it came in often has no scheduled date at all,
  // so fall back to when it was first paid, then to when it was opened.
  const jobDate = (j) => j.scheduled_local_date || j.first_paid_at || localDateOf(j.created_at)

  // per kind: income in period, and profitability by hours for jobs done in period
  const perKind = Object.keys(KIND).map((kind) => {
    const inc = payments.filter((p) => p.job?.kind === kind).reduce((s, p) => s + num(p.amount), 0)
    const doneJobs = jobs.filter((j) => {
      if (j.kind !== kind || j.status !== 'done') return false
      const d = jobDate(j)
      return d && d >= from && d <= to
    })
    // A project's hours and price are the sum of its visits, which is what
    // makes this column mean anything for work that ran over five days.
    const withHours = doneJobs.filter((j) => hoursOf(j) > 0)
    const hours = withHours.reduce((s, j) => s + hoursOf(j), 0)
    const value = withHours.reduce((s, j) => s + priceOf(j) - num(j.expenses), 0)
    return { kind, inc, count: doneJobs.length, hours, perHour: hours > 0 ? value / hours : null }
  })
  const missingHours = jobs.filter((j) => {
    if (j.status !== 'done' || hoursOf(j) > 0) return false
    const d = jobDate(j)
    return d && d >= from && d <= to
  }).length
  // Splitting profits is "what each of them collected minus what he laid out".
  // Money handed to an outside party is income of the business but sits in
  // nobody's pocket, so it gets a line of its own and never lands on a person.
  const perPerson = assignable(profiles).map((p) => {
    const got = payments.filter((x) => x.received_by === p.id).reduce((s, x) => s + num(x.amount), 0)
    const out = expenses.filter((x) => x.paid_by === p.id).reduce((s, x) => s + num(x.amount), 0)
    return { id: p.id, name: p.full_name, got, out, net: got - out }
  })
  const toThirdParty = payments.filter((x) => x.third_party).reduce((s, x) => s + num(x.amount), 0)
  const unmarkedIn = payments.filter((x) => !x.received_by && !x.third_party).reduce((s, x) => s + num(x.amount), 0)
  const unmarkedOut = expenses.filter((x) => !x.paid_by).reduce((s, x) => s + num(x.amount), 0)

  const byCat = Object.keys(CATEGORIES).map((c) => [c, expenses.filter((e) => e.category === c).reduce((s, e) => s + num(e.amount), 0)]).filter(([, v]) => v > 0)

  return (
    <div>
      <PageTitle back="/more">סיכום</PageTitle>
      <Choice options={[['week', 'שבועי'], ['month', 'חודשי']]} value={mode} onChange={(m) => { setMode(m); setOffset(0) }} cols="grid-cols-2" />
      <div className="mt-3">
        <StepNav
          onNext={() => setOffset(offset + 1)}
          onPrev={() => setOffset(offset - 1)}
          nextDisabled={offset >= 0}
          nextLabel={mode === 'week' ? 'שבוע הבא' : 'חודש הבא'}
          prevLabel={mode === 'week' ? 'שבוע שעבר' : 'חודש שעבר'}>
          <div className="font-extrabold text-lg">{label}</div>
        </StepNav>
      </div>

      {loading ? <Loading /> : (
        <>
          <Card className="mt-3">
            <div className="grid grid-cols-3 text-center">
              <div><div className="text-xs text-slate-500">הכנסות</div><div className="text-xl font-extrabold text-emerald-700">{ILS(income)}</div></div>
              <div><div className="text-xs text-slate-500">הוצאות</div><div className="text-xl font-extrabold text-red-700">{ILS(spent)}</div></div>
              <div><div className="text-xs text-slate-500">נטו</div><div className={`text-xl font-extrabold ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{ILS(profit)}</div></div>
            </div>
            <div className="text-xs text-slate-400 text-center mt-2">{payments.length} תשלומים · {expenses.length} הוצאות</div>
            {owedToSuppliers > 0 && (
              <div className="text-xs text-amber-700 font-bold text-center mt-1">
                מתוך ההוצאות, {ILS(owedToSuppliers)} עוד לא שולמו לספקים
              </div>
            )}
          </Card>

          {perPerson.length > 0 && (
            <Section title="מי קיבל וכמה">
              <Card>
                <div className="grid grid-cols-4 text-center text-xs text-slate-500 pb-1 border-b border-slate-100">
                  <span className="text-right ps-1">&nbsp;</span><span>גבה</span><span>הוציא</span><span>מאזן</span>
                </div>
                {perPerson.map((p) => (
                  <div key={p.id} className="grid grid-cols-4 text-center py-2 border-b last:border-b-0 border-slate-100 items-baseline">
                    <span className="text-right font-extrabold truncate ps-1">{p.name}</span>
                    <span className="font-bold text-emerald-700">{ILS(p.got)}</span>
                    <span className="font-bold text-red-700">{ILS(p.out)}</span>
                    <span className={`font-extrabold ${p.net >= 0 ? 'text-slate-800' : 'text-red-700'}`}>{ILS(p.net)}</span>
                  </div>
                ))}
              </Card>
              {toThirdParty > 0 && (
                <Card className="mt-2 flex justify-between items-baseline">
                  <span className="text-slate-600">🏪 הועבר לצד שלישי</span>
                  <b className="text-indigo-700">{ILS(toThirdParty)}</b>
                </Card>
              )}
              {(unmarkedIn > 0 || unmarkedOut > 0) && (
                <p className="text-xs text-amber-700 px-1 mt-2 font-semibold">
                  {unmarkedIn > 0 && `${ILS(unmarkedIn)} שהתקבלו בלי לסמן מי קיבל. `}
                  {unmarkedOut > 0 && `${ILS(unmarkedOut)} הוצאות בלי לסמן מי שילם. `}
                  אפשר להשלים מתוך העבודה או ממסך ההוצאות.
                  {owedToSuppliers > 0 && ' חובות לספקים לא נספרים על אף אחד מכם עד שמישהו משלם אותם.'}
                </p>
              )}
              <p className="text-xs text-slate-400 px-1 mt-2">
                מאזן = כמה גבה פחות כמה הוציא מהכיס שלו. זה המספר לחלוקת הרווחים.
              </p>
            </Section>
          )}

          <Section title="פרטי מול פרויקטים">
            <div className="space-y-2">
              {perKind.map((k) => (
                <Card key={k.kind}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-extrabold text-lg">{KIND[k.kind].plural}</span>
                    <span className="font-extrabold text-emerald-700">{ILS(k.inc)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 text-center text-sm">
                    <div><div className="text-xs text-slate-500">הושלמו</div><div className="font-bold">{k.count}</div></div>
                    <div><div className="text-xs text-slate-500">שעות</div><div className="font-bold">{k.hours ? k.hours.toFixed(1) : '–'}</div></div>
                    <div><div className="text-xs text-slate-500">₪ לשעה</div><div className="font-bold">{k.perHour != null ? ILS(k.perHour) : '–'}</div></div>
                  </div>
                </Card>
              ))}
              <p className="text-xs text-slate-400 px-1">₪ לשעה מחושב מעבודות שהושלמו בתקופה ויש להן משך עבודה: (מחיר − הוצאות) ÷ שעות.</p>
              {missingHours > 0 && (
                <p className="text-xs text-amber-700 px-1 font-semibold">
                  {missingHours} עבודות שהושלמו בתקופה בלי משך עבודה, ולכן לא נכנסו לחישוב ₪ לשעה.
                </p>
              )}
            </div>
          </Section>

          {byCat.length > 0 && (
            <Section title="הוצאות לפי סוג">
              <Card>
                {byCat.map(([c, v]) => (
                  <div key={c} className="flex justify-between py-1.5 border-b last:border-b-0 border-slate-100"><span>{CATEGORIES[c]}</span><b>{ILS(v)}</b></div>
                ))}
              </Card>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
