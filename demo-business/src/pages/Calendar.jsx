import { useSearchParams, useNavigate } from 'react-router-dom'
import { db, useData } from '../lib/data'
import {
  today, addDays, weekStart, weekDays, dayRangeISO, rangeISO,
  fmtDayLong, fmtDayShort, relativeDay, localDateOf, assigneeColor, assignable, assigneesOf, hebrewDate,
} from '../lib/format'
import { Button, Choice, Empty, Loading, ErrorBox, StepNav } from '../components/ui'
import JobRow from '../components/JobRow'

export default function Calendar() {
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()

  // The viewed day lives in the URL so the view survives refresh and back/forward.
  const date = params.get('date') || today()
  const view = params.get('view') === 'week' ? 'week' : 'day'
  const who = params.get('who') || 'all'

  const setParam = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)))
    setParams(next, { replace: true })
  }

  const [fromISO, toISO] = view === 'week'
    ? rangeISO(weekStart(date), addDays(weekStart(date), 6))
    : dayRangeISO(date)

  const { data, loading, error } = useData(async () => {
    const [jobs, profiles] = await Promise.all([db.jobsInRange(fromISO, toISO), db.profiles()])
    return { jobs, profiles }
  }, [fromISO, toISO])

  const profiles = data?.profiles || []
  const all = (data?.jobs || []).filter((j) => j.status !== 'cancelled')
  const jobs = who === 'all' ? all
    : who === 'none' ? all.filter((j) => !assigneesOf(j).length)
    : all.filter((j) => assigneesOf(j).includes(who))

  const step = view === 'week' ? 7 : 1
  const title = view === 'week'
    ? `${fmtDayShort(weekStart(date))} – ${fmtDayShort(addDays(weekStart(date), 6))}`
    : `${fmtDayLong(date)}${relativeDay(date) !== fmtDayShort(date) ? ` · ${relativeDay(date)}` : ''}`
  const subtitle = view === 'week'
    ? `${hebrewDate(weekStart(date))} – ${hebrewDate(addDays(weekStart(date), 6), { withYear: true })}`
    : hebrewDate(date, { withYear: true })

  const whoOptions = [
    ['all', 'הכל'],
    ...assignable(profiles).map((p) => [p.id, p.full_name, assigneeColor(p.id, profiles).active]),
    ['none', 'לא שויך'],
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h1 className="text-2xl font-extrabold flex-1">יומן</h1>
        <Button size="md" variant={date === today() ? 'secondary' : 'primary'} onClick={() => setParam({ date: today() })}>היום</Button>
      </div>

      <Choice options={[['day', 'יום'], ['week', 'שבוע']]} value={view} onChange={(v) => setParam({ view: v === 'day' ? null : v })} cols="grid-cols-2" />

      <div className="mt-3">
        <StepNav
          onNext={() => setParam({ date: addDays(date, step) })}
          onPrev={() => setParam({ date: addDays(date, -step) })}
          nextLabel={view === 'week' ? 'שבוע הבא' : 'יום הבא'}
          prevLabel={view === 'week' ? 'שבוע שעבר' : 'יום קודם'}>
          <div className="font-extrabold">{title}</div>
          <div className="text-base text-accent font-extrabold">{subtitle}</div>
        </StepNav>
      </div>

      {profiles.length > 0 && (
        <div className="mt-3">
          <Choice options={whoOptions} value={who} onChange={(v) => setParam({ who: v === 'all' ? null : v })} cols="grid-cols-4" />
        </div>
      )}

      <Button className="w-full mt-3" size="lg"
        onClick={() => nav('/quick-add', { state: { from: `/calendar?${params}`, date } })}>
        ＋ קריאה חדשה לתאריך הזה
      </Button>

      <ErrorBox error={error} />

      {loading ? <Loading /> : view === 'day' ? (
        <div className="mt-4 space-y-2">
          {jobs.length === 0
            ? <Empty>אין עבודות ביום הזה</Empty>
            : jobs.map((j) => <JobRow key={j.id} job={j} profiles={profiles} variant="calendar" showKind />)}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {weekDays(date).map((d) => {
            const dayJobs = jobs.filter((j) => localDateOf(j.scheduled_at) === d)
            const isToday = d === today()
            return (
              <section key={d}>
                <div className="flex items-center justify-between mb-1.5">
                  <button type="button" onClick={() => setParam({ date: d, view: null })}
                    className={`font-extrabold text-lg ${isToday ? 'text-accent' : 'text-slate-700'}`}>
                    {fmtDayShort(d)}{isToday && ' · היום'}
                    <span className="block text-sm font-bold text-accent">{hebrewDate(d)}</span>
                  </button>
                  <span className="text-sm text-slate-400">{dayJobs.length ? `${dayJobs.length} עבודות` : 'פנוי'}</span>
                </div>
                {dayJobs.length > 0 && (
                  <div className="space-y-2">
                    {dayJobs.map((j) => <JobRow key={j.id} job={j} profiles={profiles} variant="calendar" />)}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
