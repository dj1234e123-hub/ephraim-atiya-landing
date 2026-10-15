import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { db, useData } from '../lib/data'
import {
  ILS, METHODS, STATUS, assigneeBars, closingList, dayRangeISO, fmtDate, fmtTime,
  hebrewDate, hoursOf, isPerVisit, needsClosing, num, priceOf, today,
} from '../lib/format'
import { Button, Card, Choice, Empty, ErrorBox, Input, Loading, PageTitle, Pill, UrgentTag } from '../components/ui'
import MoneyWho from '../components/MoneyWho'

const HOUR_CHIPS = [0.5, 1, 1.5, 2, 3, 4, 6, 8]

/**
 * The evening run, in one screen.
 *
 * Every call was being closed one at a time: open the call, scroll to the
 * status row, mark it done, answer the sheet, scroll back up, set the price,
 * go back, open the next one. Nine calls in half an hour, every night, all of
 * it after ten. Here the same nine sit on one page with only the four fields
 * that actually get filled in at night, and one save at the end.
 *
 * The price lives here too. The completion sheet never asked for it, which is
 * how a call ended up with a payment recorded against a price of zero and a
 * balance of minus two hundred and fifty.
 */
export default function CloseDay() {
  const me = useOutletContext()?.profile?.id || null
  const t = today()
  const [dayFrom, dayTo] = dayRangeISO(t)

  const { data, loading, reload } = useData(async () => {
    const [todayJobs, allJobs, profiles] = await Promise.all([
      db.jobsInRange(dayFrom, dayTo), db.jobs(), db.profiles(),
    ])
    return { todayJobs, allJobs, profiles }
  }, [t])

  const profiles = data?.profiles || []
  const list = useMemo(() => {
    const rows = closingList(data?.todayJobs || [], data?.allJobs || [])
    // What still needs a hand comes first; what is already closed stays on the
    // page, ticked, so the evening ends on a list that is visibly finished.
    return rows.sort((a, b) =>
      (needsClosing(b) === true) - (needsClosing(a) === true) ||
      String(a.scheduled_at || '').localeCompare(String(b.scheduled_at || '')))
  }, [data])

  // Re-seeded whenever the rows change underneath, so a save leaves the screen
  // showing what is now in the database rather than what was typed.
  const seed = list.map((j) => `${j.id}:${j.updated_at}:${j.paid}`).join('|')
  const [edits, setEdits] = useState({})
  const [results, setResults] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setEdits(Object.fromEntries(list.map((j) => [j.id, {
      hours: j.duration_hours ?? '',
      price: num(j.price) || '',
      done: j.status === 'done',
      open: false,
      payOpen: false,
      amount: '',
      method: 'cash',
      who: { received_by: null, third_party: null },
    }])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const setRow = (id, patch) => setEdits((s) => ({ ...s, [id]: { ...s[id], ...patch } }))

  const pending = list.filter((j) => {
    const e = edits[j.id]
    return e && (hasPatch(j, e) || paymentOf(j, e) || payStarted(e))
  })

  async function saveAll() {
    if (saving) return
    setError(null)

    for (const job of list) {
      const e = edits[job.id]
      if (!e) continue
      const amount = Number(e.amount) || 0
      const whoSet = !!(e.who.received_by || e.who.third_party?.trim())
      if (amount > 0 && !whoSet) {
        return setError({ message: `ב"${job.title}" צריך לסמן מי קיבל את הכסף` })
      }
      // Half a payment is worse than none: it would be dropped without a word.
      if (whoSet && amount <= 0) {
        return setError({ message: `ב"${job.title}" צריך לרשום כמה שולם` })
      }
      // Money against a price of zero is how a call ended up owing minus 250
      // and the collections total stopped adding up. The price box is on the
      // same row, so this is one tap from being right.
      const priced = isPerVisit(job) ? priceOf(job) : Number(e.price) || 0
      if (amount > 0 && priced <= 0) {
        return setError({ message: `ב"${job.title}" נרשם תשלום בלי מחיר. קבעו מחיר לעבודה קודם.` })
      }
    }

    setSaving(true)
    // One call at a time, so a single failure is attributable to its row and
    // never takes the rest of the evening's work with it.
    const res = {}
    for (const job of list) {
      const e = edits[job.id]
      if (!e) continue
      const patch = jobPatch(job, e)
      const pay = paymentOf(job, e)
      if (!Object.keys(patch).length && !pay) continue
      try {
        if (Object.keys(patch).length) await db.updateJob(job.id, patch)
        if (pay) await db.addPayment(pay)
        res[job.id] = 'ok'
      } catch (err) {
        console.error(err)
        res[job.id] = err
      }
    }
    setResults(res)
    setSaving(false)
    reload()
  }

  if (loading) return <Loading />

  const openCount = list.filter(needsClosing).length
  const failed = Object.values(results).filter((r) => r !== 'ok')
  const savedCount = Object.values(results).filter((r) => r === 'ok').length

  return (
    <div>
      <PageTitle back="/">סגירת יום</PageTitle>

      <Card>
        <div className="font-extrabold text-lg">{fmtDate(t)}</div>
        <div className="text-accent font-bold">{hebrewDate(t, { withYear: true })}</div>
        <div className="text-sm text-slate-500 mt-1">
          {openCount === 0 ? 'הכל סגור 🎉'
            : openCount === 1 ? 'עבודה אחת לסגירה'
            : `${openCount} עבודות לסגירה`}
        </div>
      </Card>

      {savedCount > 0 && failed.length === 0 && (
        <Card className="mt-3 border-2 border-emerald-300 bg-emerald-50/70">
          <div className="font-extrabold">
            ✅ {savedCount === 1 ? 'נשמרה עבודה אחת' : `נשמרו ${savedCount} עבודות`}
          </div>
        </Card>
      )}
      {failed.length > 0 && (
        <Card className="mt-3 border-2 border-red-300 bg-red-50/70">
          <div className="font-extrabold text-red-800">
            {failed.length === 1 ? 'עבודה אחת לא נשמרה' : `${failed.length} עבודות לא נשמרו`}
          </div>
          <p className="text-sm text-slate-600 mt-1">הן מסומנות למטה. בדקו חיבור ונסו שוב, מה שנשמר לא ייכפל.</p>
        </Card>
      )}

      <div className="mt-4 space-y-3">
        {list.length === 0 ? <Empty>אין עבודות לסגור היום</Empty> : list.map((job) => (
          <Row key={job.id} job={job} profiles={profiles} me={me} edit={edits[job.id]} result={results[job.id]}
            onChange={(patch) => setRow(job.id, patch)} />
        ))}
      </div>

      {list.length > 0 && (
        <div className="mt-6">
          <ErrorBox error={error} />
          <Button size="xl" variant="success" className="w-full mt-2" onClick={saveAll}
            disabled={saving || pending.length === 0}>
            {saving ? 'שומר…'
              : pending.length === 0 ? 'אין מה לשמור'
              : pending.length === 1 ? 'שמירת עבודה אחת'
              : `שמירת ${pending.length} עבודות`}
          </Button>
          <p className="text-xs text-slate-400 text-center mt-2">
            נשמר רק מה ששיניתם. אפשר לסגור חלק עכשיו ואת השאר מחר.
          </p>
        </div>
      )}
    </div>
  )
}

/** What changed on the call itself: hours, price, and whether it is finished. */
function jobPatch(job, e) {
  const patch = {}
  const hours = e.hours === '' ? null : Number(e.hours)
  const was = job.duration_hours == null ? null : num(job.duration_hours)
  if (hours !== was) patch.duration_hours = hours

  // A job priced per visit keeps its own price column at zero: the figure
  // lives in the visits, so writing this box would be writing to nothing.
  if (!isPerVisit(job)) {
    const price = Number(e.price) || 0
    if (price !== num(job.price)) patch.price = price
  }

  // Un-ticking a call that was marked finished puts it back on the road
  // rather than into limbo.
  if (e.done && job.status !== 'done') patch.status = 'done'
  if (!e.done && job.status === 'done') patch.status = 'in_progress'
  return patch
}

const hasPatch = (job, e) => Object.keys(jobPatch(job, e)).length > 0

/** A payment the plumber has begun filling in, complete or not. */
const payStarted = (e) =>
  !!e?.payOpen && !!(Number(e.amount) > 0 || e.who?.received_by || e.who?.third_party?.trim())

/** The payment to record for this row, or null when no money was entered. */
function paymentOf(job, e) {
  const amount = Number(e?.amount) || 0
  if (amount <= 0) return null
  return {
    job_id: job.id, amount, method: e.method, paid_at: today(), note: null,
    received_by: e.who.received_by, third_party: e.who.third_party?.trim() || null,
  }
}

function Row({ job, profiles, me, edit, result, onChange }) {
  if (!edit) return null
  const st = STATUS[job.status] || STATUS.new
  const price = isPerVisit(job) ? priceOf(job) : Number(edit.price) || 0
  const balance = price - num(job.paid)
  const settled = !needsClosing(job)

  return (
    <Card className={`p-0 overflow-hidden ${result && result !== 'ok' ? 'border-2 border-red-300' : ''}`}>
      <div className="flex">
        <span className="w-1.5 shrink-0 flex flex-col" aria-hidden="true">
          {assigneeBars(job, profiles).map((c, i) => <span key={i} className={`flex-1 ${c.bar}`} />)}
        </span>

        <div className="flex-1 min-w-0 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/job/${job.id}`} className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {job.scheduled_at && <span className="font-extrabold tabular-nums">{fmtTime(job.scheduled_at)}</span>}
                <span className="font-extrabold truncate">{job.title}</span>
                {job.is_urgent && <UrgentTag />}
              </div>
              <div className="text-sm text-slate-500 truncate">{job.customer_name || 'ללא לקוח'}</div>
            </Link>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Pill cls={st.cls}>{st.label}</Pill>
              {result === 'ok' && <span className="text-emerald-700 font-extrabold text-sm">✓ נשמר</span>}
              {result && result !== 'ok' && <span className="text-red-700 font-extrabold text-sm">✕ לא נשמר</span>}
            </div>
          </div>

          {settled && !edit.open ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-emerald-700">
                ✓ סגור · {ILS(priceOf(job))}{hoursOf(job) > 0 ? ` · ${hoursOf(job)} שעות` : ''}
              </span>
              <button type="button" onClick={() => onChange({ open: true })}
                className="text-sm text-slate-500 underline decoration-dotted shrink-0">עריכה</button>
            </div>
          ) : (
            <>
              <div className="mt-3">
                <span className="block text-xs font-bold text-slate-500 mb-1">⏱ כמה שעות</span>
                <div className="grid grid-cols-8 gap-1">
                  {HOUR_CHIPS.map((h) => (
                    <button key={h} type="button" onClick={() => onChange({ hours: Number(edit.hours) === h ? '' : h })}
                      className={`min-h-10 rounded-lg border-2 text-sm font-bold ${
                        Number(edit.hours) === h ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200'}`}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 items-end">
                {isPerVisit(job) ? (
                  <div>
                    <span className="block text-xs font-bold text-slate-500 mb-1">💲 מחיר לפי ביקורים</span>
                    <Link to={`/job/${job.id}`}
                      className="min-h-14 rounded-2xl border-2 border-slate-200 bg-white px-4 flex items-center justify-between">
                      <span className="font-extrabold">{ILS(priceOf(job))}</span>
                      <span className="text-sm text-brand font-bold">＋ ביקור ›</span>
                    </Link>
                  </div>
                ) : (
                  <label className="block">
                    <span className="block text-xs font-bold text-slate-500 mb-1">💲 מחיר לפני מע"מ</span>
                    <Input type="number" inputMode="decimal" min="0" step="1" value={edit.price}
                      onChange={(e) => onChange({ price: e.target.value })} placeholder="0" />
                  </label>
                )}
                <button type="button" onClick={() => onChange({ done: !edit.done })} aria-pressed={edit.done}
                  className={`min-h-14 rounded-2xl border-2 font-extrabold ${
                    edit.done ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-700'}`}>
                  {edit.done ? '✅ הושלם' : 'סמן כהושלם'}
                </button>
              </div>

              {!edit.payOpen ? (
                <Button size="md" variant="success" className="w-full mt-3"
                  onClick={() => onChange({ payOpen: true, amount: balance > 0 ? String(balance) : '' })}>
                  ＋ תשלום{balance > 0 ? ` · נשאר ${ILS(balance)}` : ''}
                </Button>
              ) : (
                <div className="mt-3 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">💰 כמה נכנס</span>
                    <button type="button" className="text-sm text-slate-500 underline decoration-dotted"
                      onClick={() => onChange({ payOpen: false, amount: '' })}>ביטול</button>
                  </div>
                  <Input type="number" inputMode="decimal" min="0" value={edit.amount}
                    onChange={(e) => onChange({ amount: e.target.value })} placeholder="0" />
                  <Choice options={Object.entries(METHODS)} value={edit.method}
                    onChange={(m) => onChange({ method: m })}
                    activeCls="bg-emerald-600 text-white border-emerald-600" />
                  <MoneyWho profiles={profiles} me={me} value={edit.who} onChange={(w) => onChange({ who: w })} allowThirdParty />
                </div>
              )}

              {num(job.paid) > 0 && (
                <div className="mt-2 text-xs text-slate-500">כבר שולם: {ILS(job.paid)}</div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
