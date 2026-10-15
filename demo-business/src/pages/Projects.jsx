import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { ILS, PROJECT_LOOK, STATUS, fmtDate, fmtHours, isPerVisit, num, priceOf } from '../lib/format'
import { Card, Choice, Empty, Loading, Pill, Progress } from '../components/ui'

const FILTERS = [['open', 'פתוחים'], ['done', 'הסתיימו'], ['all', 'הכל']]

/**
 * Every project as a file: days on site, hours on site, man-hours, what it is
 * worth and what came in. Elisha wants this so the next quote is built on what
 * the last one actually took, not on a guess.
 */
export default function Projects() {
  const nav = useNavigate()
  const [filter, setFilter] = useState('open')
  const { data, loading } = useData(() => db.jobs('project'), [])

  if (loading) return <Loading />
  const all = (data || []).filter((j) => j.status !== 'cancelled')
  // Open until the work is finished and the money is in.
  const isOpen = (j) => j.status !== 'done' || num(j.balance) > 0
  const list = all
    .filter((j) => (filter === 'all' ? true : filter === 'open' ? isOpen(j) : !isOpen(j)))
    .sort((a, b) => String(b.last_visit_on || b.created_at).localeCompare(String(a.last_visit_on || a.created_at)))

  const totals = list.reduce((t, j) => ({
    man: t.man + num(j.man_hours), worth: t.worth + priceOf(j),
  }), { man: 0, worth: 0 })

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h1 className="text-2xl font-extrabold">{PROJECT_LOOK.icon} פרויקטים</h1>
        <button type="button" onClick={() => nav('/quick-add', { state: { from: '/projects', kind: 'project' } })}
          className="min-h-12 px-4 rounded-2xl bg-indigo-600 text-white font-extrabold active:scale-[0.98]">
          ＋ פרויקט חדש
        </button>
      </div>

      <Choice cols="grid-cols-3" value={filter} onChange={setFilter} options={FILTERS}
        activeCls="bg-indigo-600 text-white border-indigo-600" />

      {list.length > 0 && (
        <Card className={`mt-3 border-2 ${PROJECT_LOOK.card}`}>
          <div className="grid grid-cols-3 text-center">
            <div><div className="text-xs text-slate-500">פרויקטים</div><div className="text-xl font-extrabold">{list.length}</div></div>
            <div><div className="text-xs text-slate-500">שעות אדם</div><div className={`text-xl font-extrabold ${PROJECT_LOOK.text}`}>{fmtHours(totals.man) || '0'}</div></div>
            <div><div className="text-xs text-slate-500">שווי</div><div className="text-xl font-extrabold">{ILS(totals.worth)}</div></div>
          </div>
        </Card>
      )}

      <div className="mt-3 space-y-3">
        {list.length === 0
          ? <Empty>{filter === 'open' ? 'אין פרויקטים פתוחים' : 'אין פרויקטים להצגה'}</Empty>
          : list.map((j) => {
            const st = STATUS[j.status] || STATUS.new
            const price = priceOf(j), paid = num(j.paid), balance = num(j.balance)
            return (
              <Card key={j.id} to={`/job/${j.id}`} className={`border-2 ${PROJECT_LOOK.card}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-extrabold text-lg truncate">{j.title}</div>
                    <div className="text-sm text-slate-500 truncate">
                      {j.customer_name || 'ללא לקוח'}{j.issue_type ? ` · ${j.issue_type}` : ''}
                      {isPerVisit(j) ? ' · מתומחר לפי ביקור' : ''}
                    </div>
                  </div>
                  <Pill cls={st.cls}>{st.label}</Pill>
                </div>

                <div className="grid grid-cols-3 text-center mt-3 bg-white/70 rounded-xl py-2">
                  <div><div className="text-xs text-slate-500">ימים</div><div className="font-extrabold">{num(j.visit_days)}</div></div>
                  <div><div className="text-xs text-slate-500">שעות בשטח</div><div className="font-extrabold">{fmtHours(j.visits_hours) || '0'}</div></div>
                  <div><div className="text-xs text-slate-500">שעות אדם</div><div className={`font-extrabold ${PROJECT_LOOK.text}`}>{fmtHours(j.man_hours) || '0'}</div></div>
                </div>

                {price > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span>{ILS(price)}</span>
                      <span className={balance > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                        {balance > 0 ? `נשאר ${ILS(balance)}` : 'שולם במלואו'}
                      </span>
                    </div>
                    <Progress value={paid} max={price} />
                  </div>
                )}

                {j.last_visit_on && (
                  <div className="text-xs text-slate-400 mt-2">עבודה אחרונה: {fmtDate(j.last_visit_on)}</div>
                )}
              </Card>
            )
          })}
      </div>
    </div>
  )
}
