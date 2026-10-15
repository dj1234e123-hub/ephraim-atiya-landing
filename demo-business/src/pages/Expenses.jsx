import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { ILS, CATEGORIES, fmtDate, isUnpaidExpense, monthStart, monthEnd, nameOf, num, KIND } from '../lib/format'
import { Button, Card, Empty, Loading, PageTitle, Section, StepNav } from '../components/ui'
import { ExpenseForm } from './JobDetail'

function shiftMonth(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1) }

export default function Expenses({ newMode = false }) {
  const nav = useNavigate()
  const me = useOutletContext()?.profile?.id || null
  const [month, setMonth] = useState(() => shiftMonth(new Date(), 0))
  const from = monthStart(month), to = monthEnd(month)
  const { data, loading, reload } = useData(async () => {
    const [expenses, jobs, profiles] = await Promise.all([
      db.expensesBetween(from, to), newMode ? db.jobs() : Promise.resolve([]), db.profiles(),
    ])
    return { expenses, jobs, profiles }
  }, [from, to, newMode])

  if (newMode) {
    if (loading) return <Loading />
    const activeJobs = (data?.jobs || []).filter((j) => !['done', 'cancelled'].includes(j.status))
    return (
      <div>
        <PageTitle back="/expenses">הוצאה חדשה</PageTitle>
        <ExpenseForm jobs={activeJobs} profiles={data?.profiles || []} me={me}
          onDone={() => nav('/expenses', { replace: true })} />
      </div>
    )
  }

  const expenses = data?.expenses || []
  const total = expenses.reduce((s, e) => s + num(e.amount), 0)
  const unpaid = expenses.filter(isUnpaidExpense).reduce((s, e) => s + num(e.amount), 0)
  const byCat = Object.keys(CATEGORIES).map((c) => [c, expenses.filter((e) => e.category === c).reduce((s, e) => s + num(e.amount), 0)]).filter(([, v]) => v > 0)

  return (
    <div>
      <PageTitle back="/more">הוצאות</PageTitle>
      <Button to="/expenses/new" size="xl" className="w-full">＋ הוצאה חדשה</Button>
      <div className="mt-4">
        <StepNav
          onNext={() => setMonth(shiftMonth(month, 1))}
          onPrev={() => setMonth(shiftMonth(month, -1))}
          nextLabel="חודש הבא" prevLabel="חודש שעבר">
          <div className="font-extrabold text-lg">{month.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</div>
        </StepNav>
      </div>
      <Card className="mt-3">
        <div className="flex justify-between items-baseline"><span className="text-slate-500">סה"כ החודש</span><span className="text-2xl font-extrabold text-red-700">{ILS(total)}</span></div>
        {unpaid > 0 && (
          <div className="mt-1 text-sm font-bold text-amber-700">
            מתוכן {ILS(unpaid)} טרם שולמו · <Link to="/supplier-debts" className="underline">חובות לספקים</Link>
          </div>
        )}
        {byCat.length > 0 && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">{byCat.map(([c, v]) => <span key={c}>{CATEGORIES[c]}: <b>{ILS(v)}</b></span>)}</div>}
      </Card>
      <Section title="פירוט">
        {loading ? <Loading /> : expenses.length === 0 ? <Empty>אין הוצאות בחודש הזה</Empty> : (
          <div className="space-y-2">
            {expenses.map((e) => (
              <Card key={e.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="font-bold text-lg text-red-700">{ILS(e.amount)} <span className="text-sm font-semibold text-slate-600">· {CATEGORIES[e.category]}</span></div>
                  <div className="text-sm text-slate-500 truncate">{fmtDate(e.spent_at)}{e.job ? ` · ${KIND[e.job.kind].label}: ${e.job.title}` : ''}{e.note ? ` · ${e.note}` : ''}</div>
                  {isUnpaidExpense(e)
                    ? <div className="text-sm font-bold text-amber-700">⏳ טרם שולם{e.supplier ? ` · ${e.supplier}` : ''}</div>
                    : nameOf(e.paid_by, data?.profiles) && (
                      <div className="text-sm font-semibold text-slate-600">
                        שילם: {nameOf(e.paid_by, data?.profiles)}{e.supplier ? ` · ${e.supplier}` : ''}
                      </div>
                    )}
                </div>
                <button type="button" className="text-slate-400 min-h-10 min-w-10" onClick={async () => { if (confirm('להעביר את ההוצאה לסל המיחזור?')) { await db.deleteExpense(e.id, me); reload() } }}>🗑</button>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
