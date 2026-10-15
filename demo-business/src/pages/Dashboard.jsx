import { useOutletContext } from 'react-router-dom'
import { db, useData } from '../lib/data'
import {
  ILS, num, today, addDays, dayRangeISO, rangeISO, greeting,
  fmtDate, localDateOf, monthStart, monthEnd, relativeDay, assigneesOf, DEBT_STATUSES,
  hebrewDate, jobGaps, closingList, needsClosing,
} from '../lib/format'
import { Button, Card, Empty, Loading, Section, Stat } from '../components/ui'
import JobRow from '../components/JobRow'
import NeedsAttention from '../components/NeedsAttention'
import DemoTry, { DemoCta } from '../components/DemoTry'
import { quoteTotals, isExpired } from '../lib/quotes'

export default function Dashboard() {
  const { profile, reloadProfile, waiting = [], reloadWaiting } = useOutletContext() || {}
  const t = today()
  const [dayFrom, dayTo] = dayRangeISO(t)
  const [, weekTo] = rangeISO(t, addDays(t, 14))
  const mFrom = monthStart(), mTo = monthEnd()

  const { data, loading, reload } = useData(async () => {
    const [todayJobs, upcoming, payments, expenses, allJobs, profiles, quotes] = await Promise.all([
      db.jobsInRange(dayFrom, dayTo),
      db.jobsInRange(dayTo, weekTo),
      db.paymentsBetween(mFrom, mTo),
      db.expensesBetween(mFrom, mTo),
      db.jobs(),
      db.profiles(),
      db.quotes(),
    ])
    return { todayJobs, upcoming, payments, expenses, allJobs, profiles, quotes }
  }, [t])

  if (loading) return <Loading />
  const { todayJobs = [], upcoming = [], payments = [], expenses = [], allJobs = [], profiles = [], quotes = [] } = data || {}
  // הצעות שמחכות לתשובת הלקוח: כסף שעוד לא נכנס ליומן, אבל כבר על השולחן.
  const waitingQuotes = quotes.filter((q) => q.status === 'sent')
  const waitingQuotesSum = waitingQuotes.reduce((s, q) => s + quoteTotals(q).net, 0)
  const expiredQuotes = waitingQuotes.filter(isExpired).length

  const live = (list) => list.filter((j) => j.status !== 'cancelled')
  const todays = live(todayJobs)
  const mine = profile?.id ? todays.filter((j) => assigneesOf(j).includes(profile.id)) : todays
  const myUrgent = mine.filter((j) => j.is_urgent).length

  const income = payments.reduce((s, p) => s + num(p.amount), 0)
  const spent = expenses.reduce((s, e) => s + num(e.amount), 0)
  const debts = allJobs.filter((j) => DEBT_STATUSES.includes(j.status) && num(j.balance) > 0)
  const debtSum = debts.reduce((s, j) => s + num(j.balance), 0)
  const activeProjects = allJobs.filter((j) => j.kind === 'project' && ['new', 'scheduled', 'in_progress'].includes(j.status))

  // Both counts come off the same full list of calls, so the home screen can
  // never claim everything is in order while a call sits with no date on it.
  const stuck = allJobs.filter((j) => jobGaps(j).length > 0)
  const toClose = closingList(todays, allJobs).filter(needsClosing)

  // On a brand-new account "0 עבודות שלך היום" reads like something is broken.
  const bits = allJobs.length === 0 ? ['בואו נתחיל'] : [
    `${mine.length} ${mine.length === 1 ? 'עבודה שלך היום' : 'עבודות שלך היום'}`,
    myUrgent > 0 ? `${myUrgent} ${myUrgent === 1 ? 'מהן דחופה' : 'מהן דחופות'}` : null,
    stuck.length > 0 ? `${stuck.length} דורשות טיפול` : null,
  ].filter(Boolean)

  return (
    <div>
      <div className="rounded-2xl bg-brand text-white p-4">
        <div className="text-xl font-extrabold">{greeting(profile?.full_name)} 👋</div>
        <div className="text-white/80 text-sm mt-1 leading-relaxed">{bits.join(' · ')}</div>
        <div className="text-white/60 text-xs mt-1 font-semibold">{hebrewDate(t, { withYear: true })}</div>
      </div>

      <DemoTry />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Stat label="הכנסות החודש" value={ILS(income)} cls="text-emerald-700" to="/summary" />
        <Stat label="הוצאות החודש" value={ILS(spent)} cls="text-red-700" to="/expenses" />
        <Stat label="🏗️ פרויקטים פעילים" value={activeProjects.length} cls="text-indigo-700" to="/projects" />
        <Stat label="לגבייה" value={ILS(debtSum)} sub={`${debts.length} עבודות`} cls="text-amber-700" to="/collections" />
      </div>

      <Card to="/quotes" className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-500">📄 הצעות מחיר</div>
          <div className="font-extrabold text-lg truncate">
            {waitingQuotes.length === 0 ? 'אין הצעות שמחכות לתשובה'
              : `${waitingQuotes.length} ${waitingQuotes.length === 1 ? 'הצעה מחכה' : 'הצעות מחכות'} לתשובה · ${ILS(waitingQuotesSum)}`}
          </div>
          {expiredQuotes > 0 && <div className="text-xs font-bold text-amber-700 mt-0.5">{expiredQuotes === 1 ? 'אחת פגה תוקף' : `${expiredQuotes} פגו תוקף`}, שווה לשאול את הלקוח</div>}
        </div>
        <span className="text-2xl text-slate-300">‹</span>
      </Card>

      {/* The evening run: everything that is closed at the end of the day, in
          one screen instead of one visit per call. */}
      {toClose.length > 0 && (
        <Button to="/close-day" variant="brand" size="lg" className="w-full mt-3">
          🌙 סגירת יום · {toClose.length}
        </Button>
      )}

      <Button to="/expenses/new" variant="secondary" size="lg" className="w-full mt-3">
        🧾 רישום הוצאה
      </Button>

      {allJobs.length === 0 && (
        <Card className="mt-4 text-center border-2 border-dashed border-slate-300 shadow-none">
          <div className="text-4xl">👋</div>
          <div className="font-extrabold text-lg mt-2">ברוכים הבאים</div>
          <p className="text-slate-500 mt-1 leading-relaxed">
            עוד לא נפתחו קריאות. לחצו על הכפתור הירוק <b>קריאה חדשה</b> שלמטה כדי לפתוח את הראשונה.
            <br />אפשר גם בלי תאריך - היא תחכה לכם ברשימת "דורש טיפול".
          </p>
        </Card>
      )}

      {waiting.length > 0 && (
        <Card className="mt-4 border-2 border-red-300 bg-red-50/70">
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold text-lg">🔔 חדש אצלך · {waiting.length}</span>
            <Button size="md" variant="ghost" onClick={async () => {
              if (!profile?.id) return
              await db.markAssignmentsSeen(profile.id)
              reloadProfile?.(); reloadWaiting?.()
            }}>ראיתי</Button>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {waiting.length === 1 ? 'עבודה שקבעו לך' : 'עבודות שקבעו לך'} ועוד לא ראית.
          </p>
          <div className="space-y-2 mt-3">
            {waiting.map((j) => <JobRow key={j.id} job={j} profiles={profiles} showKind />)}
          </div>
        </Card>
      )}

      <NeedsAttention jobs={allJobs} profiles={profiles} me={profile?.id || null} onSaved={reload} />

      <Section title={`עבודות היום · ${fmtDate(t)} · ${hebrewDate(t)}`}>
        {todays.length === 0 ? <Empty>אין עבודות מתוכננות להיום</Empty> : (
          <div className="space-y-2">
            {todays.map((j) => <JobRow key={j.id} job={j} profiles={profiles} variant="calendar" showKind />)}
          </div>
        )}
      </Section>

      <Section title="עבודות קרובות" action={<Button to="/calendar" variant="ghost" size="md">ליומן ›</Button>}>
        {live(upcoming).length === 0 ? <Empty>אין עבודות בשבועיים הקרובים</Empty> : (
          <div className="space-y-2">
            {live(upcoming).slice(0, 8).map((j) => (
              <div key={j.id}>
                <div className="text-xs font-bold text-slate-400 mb-1 px-1">
                  {relativeDay(localDateOf(j.scheduled_at))}
                </div>
                <JobRow job={j} profiles={profiles} variant="calendar" showKind />
              </div>
            ))}
          </div>
        )}
      </Section>

      <DemoCta />
    </div>
  )
}
