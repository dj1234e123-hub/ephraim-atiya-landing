import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { db, useData } from '../lib/data'
import {
  ILS, KIND, STATUS, STATUS_ORDER, METHODS, CATEGORIES, DEBT_STATUSES, assigneeBars, assigneesOf,
  awaitingPayment, receivedByText, isUnpaidExpense, nameOf, fmtDate, fmtTime, fmtHours, localDateOf, num, today, hebrewDate,
  PRICING, PROJECT_LOOK, isPerVisit, priceOf, hoursOf,
} from '../lib/format'
import {
  Block, Button, Card, Choice, Empty, ErrorBox, Field, Input, Loading,
  PageTitle, Pill, Progress, Section, Sheet, Textarea, Toggle, UrgentTag,
} from '../components/ui'
import PhoneActions from '../components/PhoneActions'
import NavigateButton from '../components/NavigateButton'
import CompletionSheet from '../components/CompletionSheet'
import JobPhotos from '../components/JobPhotos'
import ScheduleInline from '../components/ScheduleInline'
import InlinePrice from '../components/InlinePrice'
import VisitLog from '../components/VisitLog'
import AssigneeChoice from '../components/AssigneeChoice'
import MoneyWho from '../components/MoneyWho'
import NotifyAssignee, { notifyTargets } from '../components/NotifyAssignee'
import DebtReminder from '../components/DebtReminder'

export default function JobDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const meProfile = useOutletContext()?.profile || null
  const me = meProfile?.id || null
  const justCreated = useLocation().state?.justCreated
  const { data, loading, reload } = useData(async () => {
    const [job, payments, expenses, profiles] = await Promise.all([
      db.job(id), db.paymentsOfJob(id), db.expensesOfJob(id), db.profiles(),
    ])
    const [customer, dests, workspace] = await Promise.all([
      job.customer_id ? db.customer(job.customer_id) : Promise.resolve(null),
      db.payDestinations(), db.workspace(),
    ])
    return { job, payments, expenses, profiles, customer, dests, workspace }
  }, [id])

  const [sheet, setSheet] = useState(null)      // 'payment' | 'expense' | 'hours'
  const [editDate, setEditDate] = useState(false)
  const [editPrice, setEditPrice] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return <Loading />
  if (!data?.job) return <Empty>הקריאה לא נמצאה</Empty>
  const { job, payments, expenses, profiles, customer, dests = [], workspace: ws } = data
  const k = KIND[job.kind]
  const price = priceOf(job), paid = num(job.paid), balance = num(job.balance), spent = num(job.expenses)
  const isProject = job.kind === 'project'
  const perVisit = isPerVisit(job)
  const bars = assigneeBars(job, profiles)

  const patch = async (p) => {
    try { await db.updateJob(id, p); reload() } catch (e) { setError(e) }
  }

  const setStatus = async (v) => {
    await patch({ status: v })
    // Nobody goes back later to fill these in, so ask once, on completion.
    if (v === 'done' && (!hoursOf(job) || priceOf(job) <= 0 || num(job.balance) > 0)) {
      setSheet('complete')
    }
  }

  async function remove() {
    if (!confirm(`להעביר את "${job.title}" לסל המיחזור? אפשר לשחזר תוך 30 יום מ־⋯ עוד ← סל מיחזור.`)) return
    await db.deleteJob(id, me)
    nav('/jobs', { replace: true })
  }

  return (
    <div>
      <PageTitle back="/jobs" action={<Button to={`/job/${id}/edit`} variant="secondary" size="md">עריכה</Button>}>
        {job.title}
      </PageTitle>

      {justCreated && notifyTargets(job, profiles, me).length > 0 && (
        <Card className="border-2 border-emerald-300 bg-emerald-50/70">
          <div className="font-extrabold text-lg">✅ הקריאה נשמרה</div>
          <p className="text-sm text-slate-600 mt-1">אפשר לעדכן את מי שקבעת לו את העבודה בלחיצה אחת:</p>
          <NotifyAssignee job={job} profiles={profiles} me={me} />
        </Card>
      )}

      {job.quote_id && (
        <Link to={`/quotes/${job.quote_id}`} className="mb-3 flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3">
          <span className="text-sm font-bold text-slate-600">📄 נפתחה מהצעת מחיר שאושרה</span>
          <span className="text-sm font-bold text-brand">להצעה ›</span>
        </Link>
      )}

      {/* header card */}
      <Card className={`p-0 overflow-hidden ${isProject ? `border-2 ${PROJECT_LOOK.card}` : ''}`}>
        <div className="flex">
          <span className="w-1.5 shrink-0 flex flex-col" aria-hidden="true">
            {bars.map((c, i) => <span key={i} className={`flex-1 ${c.bar}`} />)}
          </span>
          <div className="flex-1 min-w-0 p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {isProject
                ? <Pill cls={PROJECT_LOOK.pill}>{PROJECT_LOOK.icon} פרויקט{job.issue_type ? ` · ${job.issue_type}` : ''}</Pill>
                : <span className="text-slate-500 text-sm">{k.label}{job.issue_type ? ` · ${job.issue_type}` : ''}</span>}
              <div className="flex items-center gap-2">
                {job.is_urgent && <UrgentTag />}
                {awaitingPayment(job)
                  ? <Pill cls="bg-amber-500 text-white">ממתין לתשלום</Pill>
                  : <Pill cls={STATUS[job.status].cls}>{STATUS[job.status].label}</Pill>}
              </div>
            </div>

            {job.customer_id && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <Link to={`/customers/${job.customer_id}`} className="font-bold text-lg underline decoration-dotted truncate">
                  {job.customer_name}
                </Link>
                <PhoneActions phone={job.customer_phone} size="sm"
                  text={`שלום ${job.customer_name || ''}, לגבי ${job.title}`} />
              </div>
            )}

            {job.customer_address && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600 truncate">📍 {job.customer_address}</span>
                <NavigateButton address={job.customer_address} />
              </div>
            )}

            {isProject && num(job.visits_count) > 0 ? (
              <div className="mt-2 text-sm text-slate-600">
                ⏱ {hoursOf(job) > 0 ? fmtHours(hoursOf(job)) : 'בלי שעות'} · {job.visits_count} ביקורים
              </div>
            ) : (
              <button type="button" onClick={() => setSheet('hours')} className="mt-2 text-sm text-slate-600 underline decoration-dotted">
                ⏱ {job.duration_hours ? fmtHours(job.duration_hours) : 'הוסף משך עבודה'}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 📅 date block */}
      <div className="mt-3">
        <Block icon="📅" title="מועד העבודה">
          {editDate ? (
            <ScheduleInline job={job} onSaved={() => { setEditDate(false); reload() }} onCancel={() => setEditDate(false)} />
          ) : job.scheduled_at ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold">{fmtDate(localDateOf(job.scheduled_at))}</div>
                <div className="text-accent font-bold">{hebrewDate(localDateOf(job.scheduled_at), { withYear: true })}</div>
                <div className="text-lg font-bold text-slate-600 tabular-nums">{fmtTime(job.scheduled_at)}</div>
              </div>
              <Button size="md" variant="secondary" onClick={() => setEditDate(true)}>שנה מועד</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-bold text-slate-400">טרם נקבע מועד</span>
              <Button size="md" onClick={() => setEditDate(true)}>קבע מועד</Button>
            </div>
          )}
        </Block>
      </div>

      {/* 💰 price block */}
      <div className="mt-3">
        <Block icon="💰" title={'מחיר העבודה · לפני מע"מ'}>
          {isProject && (
            <div className="mb-3">
              <Choice cols="grid-cols-2" value={job.pricing_mode || 'total'}
                onChange={(v) => patch({ pricing_mode: v })}
                options={Object.entries(PRICING).map(([k, v]) => [k, v.label])} />
              <p className="text-xs text-slate-400 mt-1">{PRICING[job.pricing_mode || 'total'].hint}</p>
            </div>
          )}

          {perVisit ? (
            price > 0 ? (
              <div>
                <div className="text-2xl font-extrabold">{ILS(price)}</div>
                <div className="text-sm text-slate-500 mt-0.5">מחובר מ־{job.visits_count} ביקורים</div>
              </div>
            ) : (
              <span className="text-lg font-bold text-slate-400">
                {num(job.visits_count) > 0 ? 'לביקורים עוד לא נרשם מחיר' : 'רשמו ביקור ותנו לו מחיר'}
              </span>
            )
          ) : editPrice ? (
            <InlinePrice job={job} onSaved={() => { setEditPrice(false); reload() }} onCancel={() => setEditPrice(false)} />
          ) : price > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <div className="text-2xl font-extrabold">{ILS(price)}</div>
              <Button size="md" variant="secondary" onClick={() => setEditPrice(true)}>שנה מחיר</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-bold text-slate-400">טרם נקבע מחיר</span>
              <Button size="md" onClick={() => setEditPrice(true)}>קבע מחיר</Button>
            </div>
          )}

          {price > 0 && (
            <>
              <div className="grid grid-cols-3 text-center mt-4 pt-3 border-t border-slate-100">
                <div><div className="text-xs text-slate-500">מחיר</div><div className="text-lg font-extrabold">{ILS(price)}</div></div>
                <div><div className="text-xs text-slate-500">שולם</div><div className="text-lg font-extrabold text-emerald-700">{ILS(paid)}</div></div>
                <div><div className="text-xs text-slate-500">יתרה</div><div className={`text-lg font-extrabold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{ILS(balance)}</div></div>
              </div>
              <div className="mt-3"><Progress value={paid} max={price} /></div>
              {spent > 0 && (
                <div className="mt-3 flex justify-between text-sm font-semibold border-t border-slate-100 pt-3">
                  <span className="text-slate-600">הוצאות: {ILS(spent)}</span>
                  <span className={price - spent >= 0 ? 'text-emerald-700' : 'text-red-700'}>רווח: {ILS(price - spent)}</span>
                </div>
              )}
            </>
          )}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Button variant="success" size="md" onClick={() => setSheet('payment')}>＋ תשלום</Button>
            <Button variant="secondary" size="md" onClick={() => setSheet('expense')}>＋ הוצאה</Button>
          </div>
        </Block>
      </div>

      {isProject && (
        <Section title={`${PROJECT_LOOK.icon} יומן עבודה בפרויקט`}>
          <VisitLog job={job} profiles={profiles} me={me} onChanged={reload} />
        </Section>
      )}

      <Section title="תמונות לפני ואחרי">
        <JobPhotos jobId={id} />
      </Section>

      <Section title="מי מטפל">
        <AssigneeChoice profiles={profiles} value={assigneesOf(job)} onChange={(v) => patch({ assignees: v })} />
        <NotifyAssignee job={job} profiles={profiles} me={me} />
      </Section>

      <Section title="סטטוס">
        <Choice cols="grid-cols-3" value={job.status} onChange={setStatus}
          options={STATUS_ORDER.map((s) => [s, STATUS[s].label, STATUS[s].active])} />
        {job.status === 'scheduled' && !job.scheduled_at && (
          <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
            <div className="font-bold text-amber-900">מסומן "נקבעה" בלי תאריך</div>
            <p className="text-sm text-slate-600 mt-1">בלי מועד הקריאה לא תופיע ביומן. אפשר לקבוע אותו כאן:</p>
            <div className="mt-2"><ScheduleInline job={job} onSaved={reload} /></div>
          </div>
        )}
        <div className="mt-3">
          <Toggle checked={job.is_urgent} onChange={(v) => patch({ is_urgent: v })} label="דחוף" />
        </div>
      </Section>

      <Section title="מה הלקוח אמר">
        <Card>
          {job.description
            ? <p className="whitespace-pre-wrap text-slate-700">{job.description}</p>
            : <p className="text-slate-400">לא נרשם. אפשר להוסיף במסך העריכה.</p>}
        </Card>
      </Section>

      <Section title="מה נעשה בפועל">
        <WorkNotes job={job} onSaved={reload} />
      </Section>

      {customer?.phone && num(job.balance) > 0 && DEBT_STATUSES.includes(job.status) && (
        <Section title="דרישת תשלום ללקוח">
          <DebtReminder customer={customer} jobs={[job]} dests={dests} vatPercent={ws?.vat_percent ?? 18}
            businessName={ws?.business_name} from={meProfile?.full_name} onSaved={reload} />
        </Section>
      )}

      <Section title="תשלומים">
        {payments.length === 0 ? <Empty>עדיין לא נרשמו תשלומים</Empty> : (
          <div className="space-y-2">
            {payments.map((p) => (
              <Card key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-bold text-lg text-emerald-700">{ILS(p.amount)}</div>
                  <div className="text-sm text-slate-500">
                    {fmtDate(p.paid_at)} · {METHODS[p.method]}{p.note ? ` · ${p.note}` : ''}
                  </div>
                  {receivedByText(p, profiles) && (
                    <div className="text-sm font-semibold text-slate-600 mt-0.5">{receivedByText(p, profiles)}</div>
                  )}
                </div>
                <button type="button" className="text-slate-400 min-h-10 min-w-10"
                  onClick={async () => { if (confirm('להעביר את התשלום לסל המיחזור?')) { await db.deletePayment(p.id, me); reload() } }}>🗑</button>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {expenses.length > 0 && (
        <Section title="הוצאות על העבודה">
          <div className="space-y-2">
            {expenses.map((e) => (
              <Card key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-bold text-lg text-red-700">{ILS(e.amount)}</div>
                  <div className="text-sm text-slate-500">{fmtDate(e.spent_at)} · {CATEGORIES[e.category]}{e.note ? ` · ${e.note}` : ''}</div>
                  {isUnpaidExpense(e)
                    ? <div className="text-sm font-bold text-amber-700 mt-0.5">⏳ טרם שולם{e.supplier ? ` · ${e.supplier}` : ''}</div>
                    : nameOf(e.paid_by, profiles) && (
                      <div className="text-sm font-semibold text-slate-600 mt-0.5">שילם: {nameOf(e.paid_by, profiles)}</div>
                    )}
                </div>
                <button type="button" className="text-slate-400 min-h-10 min-w-10"
                  onClick={async () => { if (confirm('להעביר את ההוצאה לסל המיחזור?')) { await db.deleteExpense(e.id, me); reload() } }}>🗑</button>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <ErrorBox error={error} />
      <div className="mt-10"><Button variant="danger" size="md" className="w-full" onClick={remove}>מחיקת {k.label}</Button></div>

      <Sheet open={sheet === 'payment'} onClose={() => setSheet(null)} title="רישום תשלום">
        <PaymentForm jobId={id} suggested={balance > 0 ? balance : ''} profiles={profiles} me={me}
          onDone={() => { setSheet(null); reload() }} />
      </Sheet>
      <Sheet open={sheet === 'expense'} onClose={() => setSheet(null)} title="הוצאה על העבודה">
        <ExpenseForm jobId={id} profiles={profiles} me={me} onDone={() => { setSheet(null); reload() }} />
      </Sheet>
      <Sheet open={sheet === 'hours'} onClose={() => setSheet(null)} title="משך העבודה">
        <HoursForm job={job} onDone={() => { setSheet(null); reload() }} />
      </Sheet>
      <Sheet open={sheet === 'complete'} onClose={() => setSheet(null)} title="סיימת את העבודה 👏">
        <CompletionSheet job={job} profiles={profiles} me={me} onDone={() => { setSheet(null); reload() }} />
      </Sheet>
    </div>
  )
}

/** Free-text log of what was actually done, saved automatically on blur. */
function WorkNotes({ job, onSaved }) {
  const [text, setText] = useState(job.work_notes || '')
  const [state, setState] = useState('idle')   // idle | saving | saved | error
  const saved = useRef(job.work_notes || '')

  // Re-seed only when moving to a different job. Re-seeding on every refresh
  // used to silently replace text the plumber had just typed.
  useEffect(() => { setText(job.work_notes || ''); saved.current = job.work_notes || '' }, [job.id])

  async function flush() {
    if (text === saved.current) return
    setState('saving')
    try {
      await db.updateJob(job.id, { work_notes: text.trim() || null })
      saved.current = text
      setState('saved')
      onSaved?.()
      setTimeout(() => setState('idle'), 2000)
    } catch (e) {
      // Never fail quietly here - the text is still in the box, say so.
      console.error(e)
      setState('error')
    }
  }

  return (
    <div>
      <Textarea value={text} onBlur={flush} onChange={(e) => setText(e.target.value)}
        placeholder="מה בוצע, אילו חלקים הוחלפו, מה עוד צריך…" rows={4} />
      <div className="text-xs mt-1 h-4 text-slate-400">
        {state === 'saving' ? 'שומר…'
          : state === 'saved' ? '✓ נשמר'
          : state === 'error' ? <span className="text-red-600 font-bold">לא נשמר. בדקו חיבור ולחצו שוב מחוץ לשדה.</span>
          : 'נשמר אוטומטית כשיוצאים מהשדה'}
      </div>
    </div>
  )
}

function PaymentForm({ jobId, suggested, profiles, me, onDone }) {
  const [amount, setAmount] = useState(suggested)
  const [method, setMethod] = useState('cash')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [who, setWho] = useState({ received_by: me || null, third_party: null })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    if (!(Number(amount) > 0)) return setError({ message: 'צריך סכום' })
    if (!who.received_by && !who.third_party?.trim()) return setError({ message: 'צריך לסמן מי קיבל את הכסף' })
    setBusy(true); setError(null)
    try {
      await db.addPayment({
        job_id: jobId, amount: Number(amount), method, paid_at: date, note: note || null,
        received_by: who.received_by, third_party: who.third_party?.trim() || null,
      })
      onDone()
    } catch (err) { setError(err); setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="סכום (₪)"><Input type="number" inputMode="decimal" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></Field>
      <Field label="אופן תשלום"><Choice options={Object.entries(METHODS)} value={method} onChange={setMethod} activeCls="bg-emerald-600 text-white border-emerald-600" /></Field>
      <Field label="מי קיבל את הכסף?" hint="זה מה שמאפשר לחלק רווחים בסוף החודש">
        <MoneyWho profiles={profiles} me={me} value={who} onChange={setWho} allowThirdParty />
      </Field>
      <Field label="תאריך"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="הערה"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="לא חובה" /></Field>
      <ErrorBox error={error} />
      <Button type="submit" variant="success" size="xl" className="w-full" disabled={busy}>{busy ? 'שומר…' : 'שמירת תשלום'}</Button>
    </form>
  )
}

export function ExpenseForm({ jobId = null, jobs = null, profiles = [], me = null, onDone }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('materials')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [job, setJob] = useState(jobId || '')
  const [who, setWho] = useState({ received_by: me || null, third_party: null })
  const [supplier, setSupplier] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    if (!(Number(amount) > 0)) return setError({ message: 'צריך סכום' })
    setBusy(true); setError(null)
    try {
      // Goods taken on account have no payer and no payment date yet; the
      // cost is recorded now, and settling with the shop comes later.
      await db.addExpense({
        job_id: job || null, amount: Number(amount), category, spent_at: date,
        note: note || null, paid_by: who.received_by,
        supplier: supplier.trim() || null,
        paid_at: who.received_by ? date : null,
      })
      onDone()
    }
    catch (err) { setError(err); setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="סכום (₪)"><Input type="number" inputMode="decimal" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></Field>
      <Field label="סוג הוצאה"><Choice options={Object.entries(CATEGORIES)} value={category} onChange={setCategory} activeCls="bg-red-600 text-white border-red-600" /></Field>
      {jobs && (
        <Field label="שייך לעבודה / פרויקט">
          <select className="w-full min-h-14 rounded-2xl border-2 border-slate-200 bg-white px-4 text-lg" value={job} onChange={(e) => setJob(e.target.value)}>
            <option value="">הוצאה כללית</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{KIND[j.kind].label}: {j.title}</option>)}
          </select>
        </Field>
      )}
      <Field label="חנות / ספק" hint="לא חובה, אבל עוזר לדעת למי חייבים">
        <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="למשל: חנות הצנרת" />
      </Field>
      <Field label="מי שילם?" hint="אם לקחתם על החשבון בחנות - בחרו 'עוד לא שולם'">
        <MoneyWho profiles={profiles} me={me} value={who} onChange={setWho}
          allowNone noneLabel="⏳ עוד לא שולם" />
      </Field>
      {!who.received_by && (
        <p className="text-sm text-amber-700 font-semibold">
          ההוצאה תירשם עכשיו ותופיע ב"חובות לספקים" עד שתשלמו.
        </p>
      )}
      <Field label="תאריך"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="הערה"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="למשל: צנרת מהחנות" /></Field>
      <ErrorBox error={error} />
      <Button type="submit" size="xl" className="w-full" disabled={busy}>{busy ? 'שומר…' : 'שמירת הוצאה'}</Button>
    </form>
  )
}

function HoursForm({ job, onDone }) {
  const [hours, setHours] = useState(job.duration_hours ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const quick = [0.5, 1, 2, 3, 4, 8]
  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    try {
      await db.updateJob(job.id, { duration_hours: hours === '' ? null : Number(hours) })
      onDone()
    } catch (err) { setError(err); setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-slate-500 text-sm">כמה שעות עבודה לקח? זה מה שמאפשר לראות בסיכום מה משתלם יותר.</p>
      <div className="grid grid-cols-6 gap-2">
        {quick.map((h) => (
          <button key={h} type="button" onClick={() => setHours(h)}
            className={`min-h-12 rounded-xl border-2 font-bold ${Number(hours) === h ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200'}`}>{h}</button>
        ))}
      </div>
      <Field label="שעות"><Input type="number" inputMode="decimal" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
      <ErrorBox error={error} />
      <Button type="submit" size="xl" className="w-full" disabled={busy}>{busy ? 'שומר…' : 'שמירה'}</Button>
    </form>
  )
}
