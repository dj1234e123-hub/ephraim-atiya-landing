import { useState } from 'react'
import { db } from '../lib/data'
import { num } from '../lib/format'
import { Button, ErrorBox, Input } from './ui'

/**
 * Setting a call's price without leaving the screen it is listed on.
 *
 * Used on the job screen, in the "דורש טיפול" list on the home screen and in
 * the day-closing screen, so the price is always one tap away from wherever
 * the missing price was noticed.
 */
export default function InlinePrice({ job, onSaved, onCancel }) {
  const [value, setValue] = useState(num(job.price) ? String(num(job.price)) : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    if (busy) return
    setBusy(true); setError(null)
    try { await db.updateJob(job.id, { price: Number(value) || 0 }); onSaved?.() }
    catch (e) { setError(e); setBusy(false) }
  }

  return (
    <div className="space-y-2">
      <Input type="number" inputMode="decimal" min="0" step="1" autoFocus value={value}
        onChange={(e) => setValue(e.target.value)} placeholder="0" />
      <div className="flex gap-2">
        <Button size="md" className="flex-1" onClick={save} disabled={busy}>{busy ? 'שומר…' : 'שמירה'}</Button>
        {onCancel && <Button size="md" variant="ghost" onClick={onCancel}>ביטול</Button>}
      </div>
      <ErrorBox error={error} />
    </div>
  )
}
