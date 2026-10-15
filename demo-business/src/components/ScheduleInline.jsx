import { useState } from 'react'
import { db } from '../lib/data'
import { isoToLocalInput, localDateTimeToISO, today } from '../lib/format'
import { Button, ErrorBox } from './ui'
import DateTimePicker from './DateTimePicker'

/**
 * Inline date/time editor for a job. Setting a date also moves an unscheduled
 * job to the "scheduled" status. The value always goes through
 * localDateTimeToISO so the stored instant matches Israel wall-clock time.
 */
export default function ScheduleInline({ job, onSaved, onCancel }) {
  const [value, setValue] = useState(isoToLocalInput(job.scheduled_at) || `${today()}T09:00`)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setBusy(true); setError(null)
    try {
      const scheduled_at = localDateTimeToISO(value)
      const patch = { scheduled_at }
      // Only promote a not-yet-started job; never drag a finished one backwards.
      if (scheduled_at && ['new', 'quote'].includes(job.status)) patch.status = 'scheduled'
      await db.updateJob(job.id, patch)
      onSaved?.()
    } catch (e) { setError(e); setBusy(false) }
  }

  async function clear() {
    setBusy(true); setError(null)
    try {
      await db.updateJob(job.id, { scheduled_at: null, ...(job.status === 'scheduled' ? { status: 'new' } : {}) })
      onSaved?.()
    } catch (e) { setError(e); setBusy(false) }
  }

  return (
    <div className="space-y-2">
      <DateTimePicker value={value} onChange={setValue} />
      <div className="flex gap-2">
        <Button size="md" className="flex-1" onClick={save} disabled={busy}>{busy ? 'שומר…' : 'שמירה'}</Button>
        {job.scheduled_at && <Button size="md" variant="secondary" onClick={clear} disabled={busy}>בטל מועד</Button>}
        {onCancel && <Button size="md" variant="ghost" onClick={onCancel}>ביטול</Button>}
      </div>
      <ErrorBox error={error} />
    </div>
  )
}
