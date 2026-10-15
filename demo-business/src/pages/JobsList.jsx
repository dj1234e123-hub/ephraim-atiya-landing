import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { KIND, assigneeColor, assignable, assigneesOf, awaitingPayment, isOpenJob } from '../lib/format'
import { Choice, Empty, Input, Loading } from '../components/ui'
import JobRow from '../components/JobRow'

// "פתוחות" means the work is not finished OR the money has not come in:
// a job nobody paid for is not a closed job.
const STATUS_FILTERS = [
  ['open', 'פתוחות'], ['unpaid', '💰 לתשלום'], ['unscheduled', 'ללא מועד'], ['done', 'הושלמו'], ['all', 'הכל'],
]

export default function JobsList() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('kind')
  const kind = raw === 'private' || raw === 'project' ? raw : 'all'
  const who = params.get('who') || 'all'
  const [filter, setFilter] = useState('open')
  const [search, setSearch] = useState('')

  const setParam = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v == null || v === 'all' ? next.delete(k) : next.set(k, v)))
    setParams(next, { replace: true })
  }

  const { data, loading } = useData(async () => {
    const [jobs, profiles] = await Promise.all([db.jobs(), db.profiles()])
    return { jobs, profiles }
  })
  const profiles = data?.profiles || []

  const list = useMemo(() => (data?.jobs || []).filter((j) => {
    if (kind !== 'all' && j.kind !== kind) return false
    const on = assigneesOf(j)
    if (who === 'none' ? on.length : who !== 'all' && !on.includes(who)) return false
    if (filter === 'open' && !isOpenJob(j)) return false
    if (filter === 'unpaid' && !awaitingPayment(j)) return false
    if (filter === 'unscheduled' && (j.scheduled_at || j.status === 'cancelled' || j.status === 'done')) return false
    if (filter === 'done' && j.status !== 'done') return false
    if (search) {
      const s = search.toLowerCase()
      return (j.title || '').toLowerCase().includes(s) ||
             (j.customer_name || '').toLowerCase().includes(s) ||
             (j.issue_type || '').toLowerCase().includes(s)
    }
    return true
  }), [data, kind, who, filter, search])

  const title = kind === 'all' ? 'קריאות' : KIND[kind].plural

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-3">{title}</h1>

      <Choice cols="grid-cols-3" value={kind} onChange={(v) => setParam({ kind: v })}
        options={[['all', 'הכל'], ['private', 'פרטיות', 'bg-accent text-white border-accent'], ['project', 'פרויקטים', 'bg-brand text-white border-brand']]} />

      {profiles.length > 0 && (
        <div className="mt-2">
          <Choice cols="grid-cols-4" value={who} onChange={(v) => setParam({ who: v })}
            options={[['all', 'כולם'], ...assignable(profiles).map((p) => [p.id, p.full_name, assigneeColor(p.id, profiles).active]), ['none', 'לא שויך']]} />
        </div>
      )}

      <div className="mt-2">
        <Choice cols="grid-cols-3" value={filter} onChange={setFilter} options={STATUS_FILTERS} />
      </div>

      <div className="mt-3">
        <Input placeholder="חיפוש לפי עבודה, לקוח או תקלה…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mt-4 space-y-2">
        {loading ? <Loading /> : list.length === 0
          ? <Empty>אין קריאות להצגה</Empty>
          : list.map((j) => <JobRow key={j.id} job={j} profiles={profiles} showKind={kind === 'all'} />)}
      </div>
    </div>
  )
}
