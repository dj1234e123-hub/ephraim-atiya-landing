import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { ILS, KIND, METHODS, PROJECT_LOOK, findSimilar, localDateTimeToISO, today } from '../lib/format'
import { Button, Choice, ErrorBox, Field, Input, Loading, PageTitle, Textarea, Toggle, Card } from '../components/ui'
import AssigneeChoice from '../components/AssigneeChoice'
import MoneyWho from '../components/MoneyWho'
import WorkTypeChoice from '../components/WorkTypeChoice'
import DateTimePicker from '../components/DateTimePicker'
import StagedPhotos from '../components/StagedPhotos'
import { photos } from '../lib/photos'

/**
 * The single "new call" engine for the whole app. Reached from the raised +
 * in the nav bar, from the calendar (with a date prefilled) and from a
 * customer card. Returns the user to wherever they came from.
 */
export default function QuickAdd() {
  const nav = useNavigate()
  const { state } = useLocation()
  const me = useOutletContext()?.profile?.id || null
  const from = state?.from || null
  // Coming from the calendar: default to the day being viewed, at 09:00.
  const presetDateTime = state?.date ? `${state.date}T09:00` : ''

  const { data, loading, reload } = useData(async () => {
    const [customers, profiles, workTypes] = await Promise.all([db.customers(), db.profiles(), db.workTypes()])
    return { customers, profiles, workTypes }
  })
  const customers = data?.customers || []
  const profiles = data?.profiles || []

  const [kind, setKind] = useState(state?.kind === 'project' ? 'project' : 'private')
  const [mode, setMode] = useState('new')           // 'new' | 'existing' customer
  const [customerId, setCustomerId] = useState(state?.customerId || '')
  const [search, setSearch] = useState('')
  const [cust, setCust] = useState({ name: '', phone: '', address: '' })
  // A project is a site, not a person: the customer is optional and folded away.
  const [withCustomer, setWithCustomer] = useState(!!state?.customerId)

  const [title, setTitle] = useState('')
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [when, setWhen] = useState(presetDateTime)
  const [price, setPrice] = useState('')
  const [assignedTo, setAssignedTo] = useState([])
  const [urgent, setUrgent] = useState(false)
  // Money taken on the spot. David opens the call standing at the customer's
  // door, and having to save it and then open a second form for the payment
  // was one step too many. Starts on "עוד לא שילם": nothing is recorded
  // unless he says so.
  const [who, setWho] = useState({ received_by: null, third_party: null })
  const [payAmount, setPayAmount] = useState('')
  const [payTouched, setPayTouched] = useState(false)
  const [method, setMethod] = useState('cash')
  const [doneNow, setDoneNow] = useState(false)
  const [pics, setPics] = useState([])          // chosen before the job exists
  const [progress, setProgress] = useState(null) // 'מעלה תמונה 2 מתוך 3'

  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  // Survives a failed save so a retry reuses the customer instead of creating a twin.
  const createdCustomer = useRef(null)
  // Same for the call: if the payment fails after the call is saved, a retry
  // must not open the call a second time.
  const createdJob = useRef(null)

  const gotPaid = !!(who.received_by || who.third_party != null)
  const priceNum = Number(price) || 0
  const paidNum = gotPaid ? Number(payAmount) || 0 : 0
  const debt = Math.max(0, priceNum - paidNum)
  const paidInFull = gotPaid && paidNum > 0 && (priceNum === 0 || paidNum >= priceNum)

  // Until he types a sum of his own, "paid" means paid the whole price.
  function changePrice(v) {
    setPrice(v)
    if (!payTouched) setPayAmount(v)
  }
  function changeWho(v) {
    setWho(v)
    if (!payTouched && !payAmount) setPayAmount(price)
    const paying = !!(v.received_by || v.third_party != null)
    // Paid in full at the door is, for a private call, a call that is done.
    if (kind === 'private' && paying && (!priceNum || (Number(payAmount || price) || 0) >= priceNum)) setDoneNow(true)
  }

  // Arriving with a customer already chosen (from a customer card).
  useEffect(() => { if (state?.customerId) setMode('existing') }, [state?.customerId])

  // Live check while typing a new customer, on the phone AND on the name.
  // Matching the phone alone missed the man who was already in the book
  // without one, and he was opened a second time for the same blockage.
  const similar = useMemo(() => findSimilar(customers, cust), [customers, cust.name, cust.phone])
  const samePhone = similar.some((c) => c.why === 'phone')

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return customers.slice(0, 8)
    return customers.filter((c) =>
      (c.name || '').toLowerCase().includes(s) ||
      (c.phone || '').includes(s) ||
      (c.address || '').toLowerCase().includes(s)).slice(0, 12)
  }, [customers, search])

  const selected = customers.find((c) => c.id === customerId)

  function pickExisting(c) {
    setMode('existing'); setCustomerId(c.id); setSearch('')
  }

  async function save(e) {
    e.preventDefault()
    setError(null)

    let finalCustomerId = null
    const wantsCustomer = kind !== 'project' || withCustomer
    if (wantsCustomer && mode === 'existing') {
      if (!customerId) return setError({ message: 'צריך לבחור לקוח, או לעבור ללקוח חדש' })
      finalCustomerId = customerId
    }

    const finalTitle = title.trim() || issueType || 'קריאת שירות'
    if (kind === 'project' && !title.trim()) return setError({ message: 'לפרויקט צריך שם' })

    const hasCustomerDetails = cust.name.trim() || cust.phone.trim() || cust.address.trim()
    if (wantsCustomer && mode === 'new' && !hasCustomerDetails && !title.trim() && !issueType) {
      return setError({ message: 'צריך לפחות שם לקוח, טלפון או סוג עבודה' })
    }

    if (gotPaid) {
      if (!(paidNum > 0)) return setError({ message: 'צריך לרשום כמה שולם' })
      if (who.third_party != null && !who.third_party.trim()) return setError({ message: 'צריך לרשום למי הועבר התשלום' })
      if (priceNum > 0 && paidNum > priceNum) return setError({ message: 'הסכום ששולם גבוה מהמחיר. לתקן את המחיר או את הסכום.' })
    }

    setBusy(true)
    try {
      if (wantsCustomer && mode === 'new' && hasCustomerDetails) {
        if (createdCustomer.current) {
          finalCustomerId = createdCustomer.current
        } else {
          const created = await db.saveCustomer({
            // Taking the number first and the name later is normal, so never
            // drop a phone just because the name field is still empty.
            name: cust.name.trim() || cust.phone.trim() || 'לקוח ללא שם',
            phone: cust.phone.trim() || null,
            address: cust.address.trim() || null,
          })
          createdCustomer.current = created.id
          finalCustomerId = created.id
        }
      }

      // Work finished on the spot is dated now, so it lands on today in the
      // calendar and in the month's figures.
      const isDone = kind === 'private' && doneNow
      const scheduledAt = localDateTimeToISO(when) || (isDone ? new Date().toISOString() : null)
      // A payment is never recorded against a price of zero - that sends the
      // balance negative. With no price given, what he took is the price.
      const finalPrice = priceNum || (gotPaid ? paidNum : 0)
      // Money changed hands, so the work has started: a part payment leaves
      // the call open with its debt on the collections screen.
      const status = isDone ? 'done' : gotPaid ? 'in_progress' : scheduledAt ? 'scheduled' : 'new'
      const job = createdJob.current || await db.saveJob({
        kind,
        customer_id: finalCustomerId,
        title: finalTitle,
        issue_type: issueType || null,
        description: description.trim() || null,   // "what the customer said"
        status,
        scheduled_at: scheduledAt,
        price: finalPrice,
        assignees: assignedTo,
        is_urgent: urgent,
      })
      createdJob.current = job

      if (gotPaid) {
        await db.addPayment({
          job_id: job.id, amount: paidNum, method, paid_at: today(), note: null,
          received_by: who.received_by, third_party: who.third_party?.trim() || null,
        })
      }

      // The call is saved at this point. Photos are uploaded after it, and a
      // failure here must never lose the call itself - it just sends the
      // plumber to the job screen to retry there.
      if (pics.length) {
        try {
          for (let i = 0; i < pics.length; i++) {
            setProgress(`מעלה תמונה ${i + 1} מתוך ${pics.length}`)
            await photos.upload(job.id, 'before', pics[i].file)
          }
        } catch (err) {
          setProgress(null); setBusy(false)
          setError({ message: `הקריאה נשמרה, אבל התמונות לא עלו: ${err.message || err}. אפשר להוסיף אותן מתוך הקריאה.` })
          return nav(`/job/${job.id}`, { replace: true })
        }
      }

      // A call booked for the other one lands on the job screen, where the
      // "tell him on WhatsApp" button is waiting - going back to the calendar
      // would quietly skip the only step that actually reaches him.
      const forSomeoneElse = assignedTo.some((x) => x !== me)
      nav(forSomeoneElse ? `/job/${job.id}` : (from || `/job/${job.id}`),
        { replace: true, state: { justCreated: true } })
    } catch (err) { setError(err); setProgress(null); setBusy(false) }
  }

  if (loading) return <Loading />

  return (
    <form onSubmit={save}>
      <PageTitle back={from || '/'}>קריאה חדשה</PageTitle>

      <div className="space-y-5">
        <Field label="סוג">
          <Choice cols="grid-cols-2" value={kind} onChange={setKind}
            options={[['private', KIND.private.label, 'bg-accent text-white border-accent'],
                      ['project', `${PROJECT_LOOK.icon} ${KIND.project.label}`, 'bg-indigo-600 text-white border-indigo-600']]} />
        </Field>

        {kind === 'project' ? (
          <>
        <div className={`rounded-2xl border-2 p-3 ${PROJECT_LOOK.card}`}>
          <Field label={`${PROJECT_LOOK.icon} שם הפרויקט`} hint="השם שלפיו תזהו אותו - לא שם הלקוח">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
              placeholder="למשל: בניין רמב״ן 9 · צנרת ראשית" />
          </Field>
        </div>
        {withCustomer ? (
        <div>
          <Choice cols="grid-cols-2" value={mode} onChange={setMode}
            options={[['new', 'לקוח חדש'], ['existing', 'לקוח קיים']]} />

          {mode === 'new' ? (
            <div className="space-y-3 mt-3">
              <Field label="שם הלקוח" hint="אם עוד אין שם, מספיק למלא טלפון - הוא לא ילך לאיבוד">
                <Input value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} placeholder="שם מלא" autoFocus={kind !== 'project'} />
              </Field>
              <Field label="טלפון">
                <Input type="tel" inputMode="tel" dir="ltr" value={cust.phone}
                  onChange={(e) => setCust({ ...cust, phone: e.target.value })} placeholder="050-0000000" />
              </Field>

              {!cust.phone.trim() && (cust.name.trim() || cust.address.trim()) && (
                <p className="text-sm text-amber-700 font-semibold -mt-1">
                  בלי טלפון אי אפשר לחייג מהמערכת ולא לשלוח דרישת תשלום.
                </p>
              )}

              {similar.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
                  <div className="font-bold text-amber-900">
                    {samePhone ? 'כבר יש לקוח עם הטלפון הזה' : 'אולי זה לקוח שכבר קיים?'}
                  </div>
                  <div className="space-y-2 mt-2">
                    {similar.map((c) => (
                      <button key={c.id} type="button" onClick={() => pickExisting(c)}
                        className="w-full text-right rounded-xl bg-white border-2 border-amber-300 p-3 active:bg-amber-100">
                        <div className="font-extrabold">{c.name}</div>
                        <div className="text-sm text-slate-500">{[c.phone, c.address].filter(Boolean).join(' · ')}</div>
                        <div className="text-sm font-bold text-amber-800 mt-1">פתח קריאה ללקוח הזה ›</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Field label="כתובת">
                <Input value={cust.address} onChange={(e) => setCust({ ...cust, address: e.target.value })} placeholder="רחוב, מספר, עיר" />
              </Field>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {selected ? (
                <Card className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-extrabold text-lg truncate">{selected.name}</div>
                    <div className="text-sm text-slate-500 truncate">{[selected.phone, selected.address].filter(Boolean).join(' · ')}</div>
                  </div>
                  <Button type="button" size="md" variant="secondary" onClick={() => setCustomerId('')}>שנה</Button>
                </Card>
              ) : (
                <>
                  <Input placeholder="חיפוש לקוח לפי שם או טלפון…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  {filtered.map((c) => (
                    <button key={c.id} type="button" onClick={() => setCustomerId(c.id)}
                      className="w-full text-right rounded-2xl bg-white border-2 border-slate-200 p-3 active:bg-slate-50">
                      <div className="font-extrabold">{c.name}</div>
                      <div className="text-sm text-slate-500">{[c.phone, c.address].filter(Boolean).join(' · ')}</div>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="text-slate-400 text-center py-4">לא נמצא לקוח</p>}
                </>
              )}
            </div>
          )}
        </div>

        ) : (
          <button type="button" onClick={() => setWithCustomer(true)}
            className="w-full min-h-12 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold">
            ＋ שיוך ללקוח (לא חובה)
          </button>
        )}
        <Field label="סוג העבודה" hint="אפשר להוסיף סוג משלכם">
          <WorkTypeChoice types={data?.workTypes} value={issueType} onChange={setIssueType} onAdded={reload} />
        </Field>
          </>
        ) : (
          <>
        <div>
          <Choice cols="grid-cols-2" value={mode} onChange={setMode}
            options={[['new', 'לקוח חדש'], ['existing', 'לקוח קיים']]} />

          {mode === 'new' ? (
            <div className="space-y-3 mt-3">
              <Field label="שם הלקוח" hint="אם עוד אין שם, מספיק למלא טלפון - הוא לא ילך לאיבוד">
                <Input value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} placeholder="שם מלא" autoFocus={kind !== 'project'} />
              </Field>
              <Field label="טלפון">
                <Input type="tel" inputMode="tel" dir="ltr" value={cust.phone}
                  onChange={(e) => setCust({ ...cust, phone: e.target.value })} placeholder="050-0000000" />
              </Field>

              {!cust.phone.trim() && (cust.name.trim() || cust.address.trim()) && (
                <p className="text-sm text-amber-700 font-semibold -mt-1">
                  בלי טלפון אי אפשר לחייג מהמערכת ולא לשלוח דרישת תשלום.
                </p>
              )}

              {similar.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
                  <div className="font-bold text-amber-900">
                    {samePhone ? 'כבר יש לקוח עם הטלפון הזה' : 'אולי זה לקוח שכבר קיים?'}
                  </div>
                  <div className="space-y-2 mt-2">
                    {similar.map((c) => (
                      <button key={c.id} type="button" onClick={() => pickExisting(c)}
                        className="w-full text-right rounded-xl bg-white border-2 border-amber-300 p-3 active:bg-amber-100">
                        <div className="font-extrabold">{c.name}</div>
                        <div className="text-sm text-slate-500">{[c.phone, c.address].filter(Boolean).join(' · ')}</div>
                        <div className="text-sm font-bold text-amber-800 mt-1">פתח קריאה ללקוח הזה ›</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Field label="כתובת">
                <Input value={cust.address} onChange={(e) => setCust({ ...cust, address: e.target.value })} placeholder="רחוב, מספר, עיר" />
              </Field>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {selected ? (
                <Card className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-extrabold text-lg truncate">{selected.name}</div>
                    <div className="text-sm text-slate-500 truncate">{[selected.phone, selected.address].filter(Boolean).join(' · ')}</div>
                  </div>
                  <Button type="button" size="md" variant="secondary" onClick={() => setCustomerId('')}>שנה</Button>
                </Card>
              ) : (
                <>
                  <Input placeholder="חיפוש לקוח לפי שם או טלפון…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  {filtered.map((c) => (
                    <button key={c.id} type="button" onClick={() => setCustomerId(c.id)}
                      className="w-full text-right rounded-2xl bg-white border-2 border-slate-200 p-3 active:bg-slate-50">
                      <div className="font-extrabold">{c.name}</div>
                      <div className="text-sm text-slate-500">{[c.phone, c.address].filter(Boolean).join(' · ')}</div>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="text-slate-400 text-center py-4">לא נמצא לקוח</p>}
                </>
              )}
            </div>
          )}
        </div>

        <Field label="סוג העבודה" hint="אפשר להוסיף סוג משלכם">
          <WorkTypeChoice types={data?.workTypes} value={issueType} onChange={setIssueType} onAdded={reload} />
        </Field>
        <Field label="שם קצר לעבודה" hint="לא חובה - אם ריק ייכנס סוג העבודה">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={issueType || 'קריאת שירות'} />
        </Field>
          </>
        )}

        <Field label="תמונות" hint="מה שרואים עכשיו, לפני העבודה. יעלו אוטומטית עם שמירת הקריאה.">
          <StagedPhotos files={pics} onChange={setPics} disabled={busy} />
        </Field>

        <Field label="מה הלקוח אמר">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="בלשון הלקוח - מה קרה, איפה, ממתי…" />
        </Field>

        <Field label="מועד" hint="לא חובה - אפשר לקבוע אחר כך מלוח הבקרה">
          <DateTimePicker value={when} onChange={setWhen} />
          {when && (
            <button type="button" onClick={() => setWhen('')} className="mt-2 text-sm text-slate-500 underline decoration-dotted">
              נקה מועד
            </button>
          )}
        </Field>

        <Field label="מחיר (₪)" hint={'לפני מע"מ · לא חובה'}>
          <Input type="number" inputMode="decimal" min="0" step="1" value={price} onChange={(e) => changePrice(e.target.value)} placeholder="0" />
        </Field>

        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-3 space-y-3">
          <Field label="💰 קיבלת כסף?" hint="אם כן - מי קיבל. נרשם יחד עם הקריאה, בלי מסך נוסף.">
            <MoneyWho profiles={profiles} me={me} value={who} onChange={changeWho} allowThirdParty allowNone />
          </Field>

          {gotPaid && (
            <Field label="כמה שולם?">
              <Input type="number" inputMode="decimal" min="0" value={payAmount}
                onChange={(e) => { setPayTouched(true); setPayAmount(e.target.value) }} placeholder="0" />
              {priceNum > 0 && Number(payAmount) !== priceNum && (
                <button type="button" onClick={() => { setPayTouched(true); setPayAmount(String(priceNum)) }}
                  className="mt-2 text-sm font-bold text-emerald-800 underline decoration-dotted">
                  שילם הכל ({ILS(priceNum)})
                </button>
              )}
              <div className="mt-2">
                <Choice options={Object.entries(METHODS)} value={method} onChange={setMethod}
                  activeCls="bg-emerald-600 text-white border-emerald-600" />
              </div>
            </Field>
          )}

          {kind === 'private' && (priceNum > 0 || gotPaid) && (
            <Toggle checked={doneNow} onChange={setDoneNow} label="✅ העבודה כבר בוצעה"
              hint="הקריאה נשמרת כ״הושלם״. אם נשאר חוב - הוא עובר ישר לגבייה." />
          )}

          {(priceNum > 0 || gotPaid) && (
            <div className="rounded-xl bg-white border border-emerald-200 p-3 text-sm font-semibold">
              {paidInFull ? (
                <span className="text-emerald-700">✅ שולם הכל{priceNum ? ` - ${ILS(priceNum)}` : ''}. אין חוב.</span>
              ) : gotPaid ? (
                <span className="text-amber-800">
                  שולם {ILS(paidNum)} · נשאר חוב <b>{ILS(debt)}</b> - יופיע בגבייה
                </span>
              ) : doneNow ? (
                <span className="text-amber-800">⏳ לא שולם · חוב של <b>{ILS(priceNum)}</b> - יופיע בגבייה</span>
              ) : (
                <span className="text-slate-600">⏳ לא שולם. החוב ייכנס לגבייה כשהעבודה תסומן כבוצעה.</span>
              )}
            </div>
          )}
        </div>

        <Field label="מי מטפל" hint="אפשר לסמן את שניכם">
          <AssigneeChoice profiles={profiles} value={assignedTo} onChange={setAssignedTo} />
        </Field>

        <Toggle checked={urgent} onChange={setUrgent} label="דחוף" hint="יופיע מודגש ביומן ובלוח הבקרה" />

        <ErrorBox error={error} />
        <Button type="submit" size="xl" className="w-full" disabled={busy}>
          {progress || (busy ? 'שומר…' : pics.length ? `שמירה והעלאת ${pics.length} תמונות` : gotPaid ? 'שמירת הקריאה והתשלום' : 'שמירת הקריאה')}
        </Button>
      </div>
    </form>
  )
}
