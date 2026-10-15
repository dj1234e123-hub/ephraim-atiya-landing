import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GAP, GAP_ORDER, ILS, assigneeBars, isPerVisit, num, stuckJobs } from '../lib/format'
import { Button, Card, Pill, UrgentTag } from './ui'
import ScheduleInline from './ScheduleInline'
import InlinePrice from './InlinePrice'
import InlinePayment from './InlinePayment'

const MAX_ROWS = 6

/**
 * Every open call that is missing something, on the screen that opens first
 * in the morning, with the fix for each one in place.
 *
 * This replaced the "ממתינות לקביעת מועד" list, which answered only one of
 * the three questions and used a narrower rule than the calls screen did, so
 * the home screen could report that everything was scheduled while priced
 * calls sat with no date at all.
 */
export default function NeedsAttention({ jobs = [], profiles = [], me = null, onSaved }) {
  const [open, setOpen] = useState(null)   // `${job.id}:${gap}`

  // A call is listed once, under the first thing that blocks it, and carries a
  // chip for everything else it is missing. Listing it per gap made the same
  // call appear three times and buried the rest.
  const rows = stuckJobs(jobs).sort((a, b) =>
    (b.job.is_urgent === true) - (a.job.is_urgent === true) ||
    GAP_ORDER.indexOf(a.gaps[0]) - GAP_ORDER.indexOf(b.gaps[0]))

  if (rows.length === 0) return null
  const shown = rows.slice(0, MAX_ROWS)

  return (
    <Card className="mt-4 border-2 border-amber-300 bg-amber-50/60 p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <span className="font-extrabold text-lg">⚠️ דורש טיפול · {rows.length}</span>
        <Button to="/jobs" variant="ghost" size="md">לכל הקריאות ›</Button>
      </div>

      <div className="p-3 space-y-2">
        {shown.map(({ job, gaps }) => (
          <div key={job.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex">
            <span className="w-1.5 shrink-0 flex flex-col" aria-hidden="true">
              {assigneeBars(job, profiles).map((c, i) => <span key={i} className={`flex-1 ${c.bar}`} />)}
            </span>
            <div className="flex-1 min-w-0 p-3">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/job/${job.id}`} className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold truncate">{job.title}</span>
                    {job.is_urgent && <UrgentTag />}
                  </div>
                  <div className="text-sm text-slate-500 truncate">
                    {job.customer_name || 'ללא לקוח'}
                    {num(job.balance) > 0 ? ` · נשאר ${ILS(job.balance)}` : ''}
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {gaps.map((g) => <Pill key={g} cls={GAP[g].cls}>{GAP[g].icon} {GAP[g].label}</Pill>)}
                </div>
              </div>

              <div className="mt-2">
                {open?.startsWith(`${job.id}:`) ? (
                  <Fix job={job} gap={open.split(':')[1]} profiles={profiles} me={me}
                    onDone={() => { setOpen(null); onSaved?.() }} onCancel={() => setOpen(null)} />
                ) : (
                  <div className={`grid gap-2 ${gaps.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {gaps.map((g) => fixAt(job, g) ? (
                      <Button key={g} size="md" to={fixAt(job, g)}>📋 רשמו ביקור</Button>
                    ) : (
                      <Button key={g} size="md" variant={g === 'unpaid' ? 'success' : 'primary'}
                        onClick={() => setOpen(`${job.id}:${g}`)}>
                        {GAP[g].icon} {GAP[g].action}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {rows.length > shown.length && (
          <Link to="/jobs" className="block text-center text-sm font-bold text-slate-500 py-2">
            ועוד {rows.length - shown.length} קריאות ›
          </Link>
        )}
      </div>
    </Card>
  )
}

function Fix({ job, gap, profiles, me, onDone, onCancel }) {
  if (gap === 'no_date') return <ScheduleInline job={job} onSaved={onDone} onCancel={onCancel} />
  if (gap === 'no_price') return <InlinePrice job={job} onSaved={onDone} onCancel={onCancel} />
  return <InlinePayment job={job} profiles={profiles} me={me} onSaved={onDone} onCancel={onCancel} />
}

/**
 * A project priced per visit has no price box to fill: its figure is the sum
 * of its visits, so the only way out of that gap is to go and log one. A
 * price box here would save happily and change nothing.
 */
const fixAt = (job, gap) => (gap === 'no_price' && isPerVisit(job) ? `/job/${job.id}` : null)
