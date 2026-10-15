import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, useData } from '../lib/data'
import {
  KIND, STATUS, STATUS_ORDER, PRICING, assigneesOf, isPerVisit,
  isoToLocalInput, localDateTimeToISO,
} from '../lib/format'
import { Button, Choice, ErrorBox, Field, Input, Loading, PageTitle, Select, Textarea, Toggle } from '../components/ui'
import AssigneeChoice from '../components/AssigneeChoice'
import WorkTypeChoice from '../components/WorkTypeChoice'
import DateTimePicker from '../components/DateTimePicker'

/** Full edit form for an existing call. New calls are created in /quick-add. */
export default function JobForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data, loading, reload } = useData(async () => {
    const [job, customers, profiles, workTypes] = await Promise.all([db.job(id), db.customers(), db.profiles(), db.workTypes()])
    return { job, customers, profiles, workTypes }
  }, [id])

  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const j = data?.job
    if (!j) return
    setForm({
      kind: j.kind,
      pricing_mode: j.pricing_mode || 'total',
      title: j.title || '',
      customer_id: j.customer_id || '',
      issue_type: j.issue_type || '',
      status: j.status,
      price: j.price ?? '',
      when: isoToLocalInput(j.scheduled_at),
      duration_hours: j.duration_hours ?? '',
      description: j.description || '',
      work_notes: j.work_notes || '',
      assignees: assigneesOf(j),
      is_urgent: !!j.is_urgent,
    })
  }, [data])

  if (loading || !form) return <Loading />
  const { customers = [], profiles = [] } = data
  const k = KIND[form.kind] || KIND[data.job.kind]
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }))

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError({ message: 'צריך שם לעבודה' })
    setBusy(true); setError(null)
    // Keep status and date consistent, the way ScheduleInline does.
    let status = form.status
    const scheduledAt = localDateTimeToISO(form.when)
    if (scheduledAt && ['new', 'quote'].includes(status)) status = 'scheduled'
    if (!scheduledAt && status === 'scheduled') status = 'new'

    try {
      await db.updateJob(id, {
        kind: form.kind,
        pricing_mode: form.kind === 'project' ? form.pricing_mode : 'total',
        title: form.title.trim(),
        customer_id: form.customer_id || null,
        issue_type: form.issue_type || null,
        status,
        price: Number(form.price) || 0,
        scheduled_at: scheduledAt,
        duration_hours: form.duration_hours === '' ? null : Number(form.duration_hours),
        description: form.description.trim() || null,
        work_notes: form.work_notes.trim() || null,
        assignees: form.assignees,
        is_urgent: form.is_urgent,
      })
      nav(`/job/${id}`, { replace: true })
    } catch (err) { setError(err); setBusy(false) }
  }

  return (
    <form onSubmit={save}>
      <PageTitle back={`/job/${id}`}>עריכת {k.label}</PageTitle>
      <div className="space-y-4">
        <Field label="סוג" hint="קריאה שהתגלגלה לעבודה מתמשכת אפשר להפוך לפרויקט, וכל מה שנרשם בה נשאר">
          <Choice cols="grid-cols-2" value={form.kind} onChange={(v) => setForm((f) => ({ ...f, kind: v }))}
            options={[['private', KIND.private.label, 'bg-accent text-white border-accent'],
                      ['project', KIND.project.label, 'bg-brand text-white border-brand']]} />
        </Field>

        {form.kind === 'project' && (
          <Field label="איך מתמחרים את הפרויקט">
            <Choice cols="grid-cols-2" value={form.pricing_mode}
              onChange={(v) => setForm((f) => ({ ...f, pricing_mode: v }))}
              options={Object.entries(PRICING).map(([k, v]) => [k, v.label])} />
            <span className="block text-xs text-slate-400 mt-1">{PRICING[form.pricing_mode].hint}</span>
          </Field>
        )}

        <Field label={form.kind === 'project' ? 'שם הפרויקט' : 'שם העבודה'}>
          <Input value={form.title} onChange={set('title')} />
        </Field>

        <Field label="לקוח">
          <Select value={form.customer_id} onChange={set('customer_id')}>
            <option value="">ללא לקוח</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
          </Select>
        </Field>

        <Field label="סוג העבודה">
          <WorkTypeChoice types={data?.workTypes} value={form.issue_type}
            onChange={(v) => setForm((f) => ({ ...f, issue_type: v }))} onAdded={reload} />
        </Field>

        <Field label="סטטוס">
          <Choice cols="grid-cols-3" value={form.status} onChange={set('status')}
            options={STATUS_ORDER.map((s) => [s, STATUS[s].label, STATUS[s].active])} />
        </Field>

        <Field label="מי מטפל">
          <AssigneeChoice profiles={profiles} value={form.assignees} onChange={set('assignees')} />
        </Field>

        <Field label="מועד">
          <DateTimePicker value={form.when} onChange={(v) => setForm((f) => ({ ...f, when: v }))} />
          {form.when && (
            <button type="button" onClick={() => setForm((f) => ({ ...f, when: '' }))}
              className="mt-2 text-sm text-slate-500 underline decoration-dotted">נקה מועד</button>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="מחיר (₪)" hint={form.kind === 'project' && form.pricing_mode === 'per_visit'
            ? 'נקבע מהביקורים' : 'לפני מע"מ'}>
            <Input type="number" inputMode="decimal" min="0" step="1" value={form.price} onChange={set('price')}
              placeholder="0" disabled={form.kind === 'project' && form.pricing_mode === 'per_visit'} />
          </Field>
          <Field label="משך העבודה (שעות)">
            <Input type="number" inputMode="decimal" min="0" step="0.5" value={form.duration_hours} onChange={set('duration_hours')} placeholder="למשל 2.5" />
          </Field>
        </div>

        <Field label="מה הלקוח אמר">
          <Textarea value={form.description} onChange={set('description')} />
        </Field>

        <Field label="מה נעשה בפועל">
          <Textarea value={form.work_notes} onChange={set('work_notes')} />
        </Field>

        <Toggle checked={form.is_urgent} onChange={(v) => setForm((f) => ({ ...f, is_urgent: v }))} label="דחוף" />

        <ErrorBox error={error} />
        <Button type="submit" size="xl" className="w-full" disabled={busy}>{busy ? 'שומר…' : 'שמירה'}</Button>
      </div>
    </form>
  )
}
