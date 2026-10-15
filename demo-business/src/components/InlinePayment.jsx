import { useState } from 'react'
import { db } from '../lib/data'
import { ILS, METHODS, num, today } from '../lib/format'
import { Button, Choice, ErrorBox, Input } from './ui'
import MoneyWho from './MoneyWho'

/**
 * Recording money against a call from inside a list.
 *
 * The short version of the payment form on the job screen: how much, how, and
 * whose pocket it landed in. Date and note are left to the full form, because
 * money is nearly always entered on the day it came in and a note is rare.
 *
 * "Who got it" has no default on purpose. One brother collects in the field
 * and the other enters the evening, so guessing the person signed in would
 * quietly credit the wrong pocket at month end.
 */
export default function InlinePayment({ job, profiles = [], me = null, onSaved, onCancel }) {
  const balance = Math.max(0, num(job.balance))
  const [amount, setAmount] = useState(balance > 0 ? String(balance) : '')
  const [method, setMethod] = useState('cash')
  const [who, setWho] = useState({ received_by: null, third_party: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    if (busy) return
    if (!(Number(amount) > 0)) return setError({ message: 'צריך סכום' })
    if (!who.received_by && !who.third_party?.trim()) return setError({ message: 'צריך לסמן מי קיבל את הכסף' })
    setBusy(true); setError(null)
    try {
      await db.addPayment({
        job_id: job.id, amount: Number(amount), method, paid_at: today(), note: null,
        received_by: who.received_by, third_party: who.third_party?.trim() || null,
      })
      onSaved?.()
    } catch (e) { setError(e); setBusy(false) }
  }

  return (
    <div className="space-y-2">
      <Input type="number" inputMode="decimal" min="0" autoFocus value={amount}
        onChange={(e) => setAmount(e.target.value)} placeholder={balance > 0 ? String(balance) : '0'} />
      {balance > 0 && <div className="text-xs text-slate-400">יתרה פתוחה: {ILS(balance)}</div>}
      <Choice options={Object.entries(METHODS)} value={method} onChange={setMethod}
        activeCls="bg-emerald-600 text-white border-emerald-600" />
      <MoneyWho profiles={profiles} me={me} value={who} onChange={setWho} allowThirdParty />
      <div className="flex gap-2">
        <Button size="md" variant="success" className="flex-1" onClick={save} disabled={busy}>
          {busy ? 'שומר…' : 'שמירת תשלום'}
        </Button>
        {onCancel && <Button size="md" variant="ghost" onClick={onCancel}>ביטול</Button>}
      </div>
      <ErrorBox error={error} />
    </div>
  )
}
