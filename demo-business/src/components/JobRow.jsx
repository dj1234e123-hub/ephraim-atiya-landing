import { Link } from 'react-router-dom'
import { Pill, Progress, UrgentTag } from './ui'
import { ILS, STATUS, KIND, PROJECT_LOOK, assigneeBars, assigneeText, awaitingPayment, fmtDate, fmtTime, fmtHours, hoursOf, localDateOf, num, priceOf } from '../lib/format'

/**
 * One job in a list. `variant="calendar"` leads with the time instead of the date.
 */
export default function JobRow({ job, profiles = [], showKind = false, variant = 'list' }) {
  const st = STATUS[job.status] || STATUS.new
  const bars = assigneeBars(job, profiles)
  const price = priceOf(job), paid = num(job.paid), balance = num(job.balance)
  // Elisha: a project should be told apart at a glance, "in other colours".
  const isProject = job.kind === 'project'

  return (
    <Link to={`/job/${job.id}`}
      className={`relative flex rounded-2xl shadow-sm border overflow-hidden ${
        isProject ? `${PROJECT_LOOK.card} border-2 active:bg-indigo-100` : 'bg-white border-slate-100 active:bg-slate-50'}`}>
      {/* colour bar identifies who the job belongs to - two colours when it is shared */}
      <span className="w-1.5 shrink-0 flex flex-col" aria-hidden="true">
        {bars.map((c, i) => <span key={i} className={`flex-1 ${c.bar}`} />)}
      </span>
      <div className="flex-1 min-w-0 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {variant === 'calendar' && job.scheduled_at && (
                <span className="font-extrabold text-lg tabular-nums">{fmtTime(job.scheduled_at)}</span>
              )}
              <span className="font-extrabold text-lg truncate">{job.title}</span>
              {job.is_urgent && <UrgentTag />}
              {isProject && <Pill cls={PROJECT_LOOK.pill}>{PROJECT_LOOK.icon} פרויקט</Pill>}
            </div>
            <div className="text-slate-500 text-sm truncate mt-0.5">
              {job.customer_name || 'ללא לקוח'}
              {variant !== 'calendar' && job.scheduled_at && ` · ${fmtDate(localDateOf(job.scheduled_at))} ${fmtTime(job.scheduled_at)}`}
              {hoursOf(job) > 0 ? ` · ${fmtHours(hoursOf(job))}` : ''}
              {num(job.visits_count) > 0 ? ` · ${job.visits_count} ביקורים` : ''}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {assigneeText(job)}
              {showKind && !isProject && ` · ${KIND[job.kind].label}`}
              {job.issue_type && ` · ${job.issue_type}`}
            </div>
          </div>
          {awaitingPayment(job)
            ? <Pill cls="bg-amber-500 text-white">ממתין לתשלום</Pill>
            : <Pill cls={st.cls}>{st.label}</Pill>}
        </div>

        {price > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span className="text-slate-600">{ILS(price)}</span>
              <span className={balance > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                {balance > 0 ? `נשאר ${ILS(balance)}` : 'שולם במלואו'}
              </span>
            </div>
            <Progress value={paid} max={price} />
          </div>
        )}
      </div>
    </Link>
  )
}
