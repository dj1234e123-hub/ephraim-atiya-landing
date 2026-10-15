import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { ILS, num, today, daysBetween, localDateOf, fmtDate, normalizePhone, DEBT_STATUSES } from '../lib/format'
import { Button, Card, Empty, ErrorBox, Input, Loading, PageTitle, Pill } from '../components/ui'
import PhoneActions from '../components/PhoneActions'
import DebtReminder from '../components/DebtReminder'

const AGED_DAYS = 30

/** When the debt started: the work date if there is one, else when it was opened. */
const debtSince = (job) => localDateOf(job.scheduled_at) || localDateOf(job.created_at) || today()

export default function Collections() {
  const me = useOutletContext()?.profile || null
  const { data, loading, reload } = useData(async () => {
    const [jobs, customers, dests, workspace] = await Promise.all([
      db.jobs(), db.customers(), db.payDestinations(), db.workspace(),
    ])
    return { jobs, customers, dests, workspace }
  })

  if (loading) return <Loading />
  const customers = data?.customers || []
  const dests = data?.dests || []
  const ws = data?.workspace || null
  // A quote nobody approved, or a job booked for next week, is not money owed.
  const open = (data?.jobs || []).filter((j) => DEBT_STATUSES.includes(j.status) && num(j.balance) > 0)

  // one row per customer, carrying its jobs and the age of its oldest debt
  const groups = []
  const byCustomer = new Map()
  for (const j of open) {
    const key = j.customer_id || '__none__'
    if (!byCustomer.has(key)) {
      const c = customers.find((x) => x.id === j.customer_id)
      const g = { key, customer: c, name: c?.name || 'ללא לקוח', phone: c?.phone || null, jobs: [], total: 0, oldest: debtSince(j) }
      byCustomer.set(key, g); groups.push(g)
    }
    const g = byCustomer.get(key)
    g.jobs.push(j)
    g.total += num(j.balance)
    if (debtSince(j) < g.oldest) g.oldest = debtSince(j)
  }
  for (const g of groups) g.age = Math.max(0, daysBetween(g.oldest, today()))
  groups.sort((a, b) => b.age - a.age || b.total - a.total)

  const total = groups.reduce((s, g) => s + g.total, 0)
  const aged = groups.filter((g) => g.age > AGED_DAYS)
  // Nearly all of the open money was owed by customers with no number on file,
  // and for those every button on this screen is dead. Say how much, up top.
  const unreachable = groups.filter((g) => !g.phone).reduce((s, g) => s + g.total, 0)

  return (
    <div>
      <PageTitle back="/more">גבייה וחובות</PageTitle>

      <Card>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-500">סה"כ לגבייה</span>
          <span className="text-2xl font-extrabold text-amber-700">{ILS(total)}</span>
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {groups.length} לקוחות{aged.length > 0 ? ` · ${aged.length} מעל ${AGED_DAYS} יום` : ''}
        </div>
        {unreachable > 0 && (
          <div className="text-sm text-amber-700 font-bold mt-2">
            {ILS(unreachable)} אצל לקוחות בלי טלפון. אפשר להשלים מספר למטה ואז לשלוח דרישה.
          </div>
        )}
      </Card>

      <div className="mt-4 space-y-3">
        {groups.length === 0 ? <Empty>אין חובות פתוחים 🎉</Empty> : groups.map((g) => {
          const old = g.age > AGED_DAYS
          return (
            <Card key={g.key} className={old ? 'border-amber-300 border-2 bg-amber-50/60' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {g.customer
                    ? <Link to={`/customers/${g.customer.id}`} className="font-extrabold text-lg truncate underline decoration-dotted">{g.name}</Link>
                    : <span className="font-extrabold text-lg text-slate-500">{g.name}</span>}
                  <div className="mt-1">
                    {old
                      ? <Pill cls="bg-amber-500 text-white">פתוח כבר {g.age} ימים</Pill>
                      : <span className="text-sm text-slate-500">פתוח {g.age} ימים</span>}
                  </div>
                </div>
                <div className="text-xl font-extrabold text-amber-800 shrink-0">{ILS(g.total)}</div>
              </div>

              <div className="mt-3 space-y-1">
                {g.jobs.map((j) => (
                  <Link key={j.id} to={`/job/${j.id}`} className="flex justify-between text-sm py-1 border-b last:border-b-0 border-slate-100">
                    <span className="truncate text-slate-700">{j.title}</span>
                    <span className="shrink-0 text-slate-500">
                      {fmtDate(debtSince(j))} · <b className="text-amber-800">{ILS(j.balance)}</b>
                    </span>
                  </Link>
                ))}
              </div>

              {g.phone ? (
                <div className="mt-3 space-y-2">
                  <PhoneActions phone={g.phone}
                    text={`שלום ${g.name}, מזכיר לגבי יתרה פתוחה של ${ILS(g.total)} על העבודות שביצענו. תודה!`} />
                  {g.customer && (
                    <DebtReminder customer={g.customer} jobs={g.jobs} dests={dests}
                      vatPercent={ws?.vat_percent ?? 18} businessName={ws?.business_name}
                      from={me?.full_name} onSaved={reload} />
                  )}
                </div>
              ) : g.customer ? (
                <AddPhone customer={g.customer} onSaved={reload} />
              ) : null}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The missing phone number, filled in from the screen where its absence is
 * actually felt. Saving it turns the dead row above into one with a call
 * button and a payment demand.
 */
function AddPhone({ customer, onSaved }) {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    if (busy) return
    const v = phone.trim()
    if (normalizePhone(v).length < 7) return setError({ message: 'המספר קצר מדי' })
    setBusy(true); setError(null)
    try { await db.updateCustomer(customer.id, { phone: v }); onSaved?.() }
    catch (e) { setError(e); setBusy(false) }
  }

  return (
    <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-white p-3">
      <div className="font-bold text-amber-900 text-sm">אין טלפון ללקוח הזה</div>
      <p className="text-xs text-slate-500 mt-0.5">בלי מספר אי אפשר לחייג ולא לשלוח דרישת תשלום.</p>
      <div className="flex gap-2 mt-2">
        <div className="flex-1 min-w-0">
          <Input type="tel" inputMode="tel" dir="ltr" value={phone}
            onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" />
        </div>
        <Button size="md" onClick={save} disabled={busy}>{busy ? 'שומר…' : 'שמירה'}</Button>
      </div>
      <ErrorBox error={error} />
    </div>
  )
}
