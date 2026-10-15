import { useState } from 'react'
import { db } from '../lib/data'
import { ILS, METHODS, isPerVisit, num, priceOf, today } from '../lib/format'
import { Button, Choice, ErrorBox, Field, Input } from './ui'
import MoneyWho from './MoneyWho'

/**
 * Shown the moment a job is marked "הושלם". The three things nobody ever goes
 * back to fill in later, asked once here while the job is fresh:
 *
 * - how long it took, which is what makes the private-vs-projects comparison
 *   possible at all;
 * - what the work costs. This used to be left out, and a call closed without
 *   it kept a price of zero: record a payment against that and the balance
 *   goes negative and the collections total stops meaning anything;
 * - what happened with the money. Elisha's four cases: I took it, my brother
 *   took it, it went to an outside party, or nothing came in yet. The last one
 *   writes no payment, so the call stays open until the money arrives.
 *
 * Skippable, because a plumber standing in a stairwell is allowed to be busy.
 */
export default function CompletionSheet({ job, profiles = [], me = null, onDone }) {
  // A project priced per visit already has its figure, added up from the
  // visits. Asking for a price here would write to a column nobody reads.
  const perVisit = isPerVisit(job)
  const paid = num(job.paid)
  const [hours, setHours] = useState(job.duration_hours ?? '')
  const [price, setPrice] = useState(num(job.price) || '')
  const [amount, setAmount] = useState(() => {
    const open = Math.max(0, priceOf(job) - paid)
    return open > 0 ? String(open) : ''
  })
  // Once he has typed a sum of his own, filling in the price stops overwriting it.
  const [amountTouched, setAmountTouched] = useState(false)
  const [method, setMethod] = useState('cash')
  // Starts on "עוד לא שילם" on purpose: nothing is recorded unless he says so.
  const [who, setWho] = useState({ received_by: null, third_party: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const quick = [0.5, 1, 1.5, 2, 3, 4, 6, 8]

  const balance = Math.max(0, (perVisit ? priceOf(job) : Number(price) || 0) - paid)
  const gotPaid = !!(who.received_by || who.third_party)

  function changePrice(v) {
    setPrice(v)
    if (!amountTouched) {
      const open = Math.max(0, (Number(v) || 0) - paid)
      setAmount(open > 0 ? String(open) : '')
    }
  }

  async function save() {
    if (busy) return
    if (gotPaid && !(Number(amount) > 0)) return setError({ message: 'צריך לרשום כמה שולם' })
    if (who.third_party != null && !who.third_party.trim()) return setError({ message: 'צריך לרשום למי הועבר התשלום' })
    setBusy(true); setError(null)
    try {
      const patch = {}
      if (hours !== '' && Number(hours) !== num(job.duration_hours)) patch.duration_hours = Number(hours)
      if (!perVisit && (Number(price) || 0) !== num(job.price)) patch.price = Number(price) || 0
      if (Object.keys(patch).length) await db.updateJob(job.id, patch)
      if (gotPaid) {
        await db.addPayment({
          job_id: job.id, amount: Number(amount), method, paid_at: today(), note: null,
          received_by: who.received_by, third_party: who.third_party?.trim() || null,
        })
      }
      onDone()
    } catch (e) { setError(e); setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-600">{perVisit ? 'שאלות קצרות וסוגרים את העבודה.' : 'שלוש שאלות קצרות וסוגרים את העבודה.'}</p>

      <Field label="כמה שעות לקח?" hint="זה מה שמאפשר לדעת בסוף החודש מה משתלם יותר">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {quick.map((h) => (
            <button key={h} type="button" onClick={() => setHours(h)}
              className={`min-h-12 rounded-xl border-2 font-bold ${Number(hours) === h ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200'}`}>
              {h}
            </button>
          ))}
        </div>
        <Input type="number" inputMode="decimal" min="0" step="0.5" value={hours}
          onChange={(e) => setHours(e.target.value)} placeholder="שעות" />
      </Field>

      {perVisit ? (
        <p className="text-sm text-slate-500">
          המחיר של הפרויקט מחובר מהביקורים: <b className="text-slate-800">{ILS(priceOf(job))}</b>
        </p>
      ) : (
        <Field label={'כמה העבודה עולה? · לפני מע"מ'} hint="בלי מחיר אי אפשר לדעת מה נשאר לגבות">
          <Input type="number" inputMode="decimal" min="0" step="1" value={price}
            onChange={(e) => changePrice(e.target.value)} placeholder="0" />
        </Field>
      )}

      {balance > 0 && (
        <Field label="התקבל תשלום?" hint={`נשארו ${ILS(balance)} לתשלום`}>
          <MoneyWho profiles={profiles} me={me} value={who} onChange={setWho} allowThirdParty allowNone />
        </Field>
      )}

      {gotPaid && (
        <Field label="כמה שולם עכשיו?">
          <Input type="number" inputMode="decimal" min="0" value={amount}
            onChange={(e) => { setAmountTouched(true); setAmount(e.target.value) }} placeholder="0" />
          <div className="mt-2">
            <Choice options={Object.entries(METHODS)} value={method} onChange={setMethod}
              activeCls="bg-emerald-600 text-white border-emerald-600" />
          </div>
        </Field>
      )}

      {balance > 0 && !gotPaid && (
        <p className="text-sm text-amber-700 font-semibold">
          העבודה תישאר ברשימת "ממתינות לתשלום" עד שהכסף ייכנס.
        </p>
      )}

      <ErrorBox error={error} />
      <div className="flex gap-2">
        <Button size="xl" className="flex-1" variant="success" onClick={save} disabled={busy}>
          {busy ? 'שומר…' : 'סיום'}
        </Button>
        <Button size="xl" variant="ghost" onClick={onDone} disabled={busy}>דלג</Button>
      </div>
    </div>
  )
}
