import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { findSimilar } from '../lib/format'
import { Button, Choice, ErrorBox, Field, Input, Loading, PageTitle, Textarea } from '../components/ui'

export default function CustomerForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const me = useOutletContext()?.profile?.id || null
  const editing = Boolean(id)
  const { data, loading } = useData(async () => {
    const [customer, dests, customers] = await Promise.all([
      editing ? db.customer(id) : Promise.resolve(null), db.payDestinations(),
      // Only needed to warn about a twin, so it is not fetched while editing.
      editing ? Promise.resolve([]) : db.customers(),
    ])
    return { customer, dests, customers }
  }, [id])
  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (loading) return
    const c = data?.customer
    setForm(c
      ? { name: c.name, phone: c.phone || '', address: c.address || '', notes: c.notes || '', payment_destination_id: c.payment_destination_id || '' }
      : { name: '', phone: '', address: '', notes: '', payment_destination_id: '' })
  }, [data, loading])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))

  // The same warning the new-call screen gives. Adding a customer from here
  // used to have no check at all, which is a second way to get a twin.
  const similar = useMemo(
    () => (editing || !form ? [] : findSimilar(data?.customers, form)),
    [editing, data, form?.name, form?.phone])

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError({ message: 'צריך שם ללקוח' })
    setBusy(true)
    try {
      const c = await db.saveCustomer({
        ...(editing ? { id } : {}),
        name: form.name.trim(), phone: form.phone || null, address: form.address || null,
        notes: form.notes || null, payment_destination_id: form.payment_destination_id || null,
      })
      nav(`/customers/${c.id}`, { replace: true })
    } catch (err) { setError(err); setBusy(false) }
  }

  async function remove() {
    if (!confirm(`להעביר את ${form.name || 'הלקוח'} לסל המיחזור? העבודות שלו יישארו במערכת, ואפשר לשחזר תוך 30 יום.`)) return
    setBusy(true)
    try {
      await db.deleteCustomer(id, me)
      nav('/customers', { replace: true })
    } catch (err) { setError(err); setBusy(false) }
  }

  if (!form) return <Loading />
  return (
    <form onSubmit={save}>
      <PageTitle back={editing ? `/customers/${id}` : '/customers'}>{editing ? 'עריכת לקוח' : 'לקוח חדש'}</PageTitle>
      <div className="space-y-4">
        <Field label="שם"><Input value={form.name} onChange={set('name')} autoFocus /></Field>
        <Field label="טלפון" hint="בלי טלפון אי אפשר לחייג מהמערכת ולא לשלוח דרישת תשלום">
          <Input type="tel" inputMode="tel" dir="ltr" value={form.phone} onChange={set('phone')} />
        </Field>

        {similar.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
            <div className="font-bold text-amber-900">
              {similar.some((c) => c.why === 'phone') ? 'כבר יש לקוח עם הטלפון הזה' : 'אולי הלקוח הזה כבר קיים?'}
            </div>
            <div className="space-y-2 mt-2">
              {similar.map((c) => (
                <Link key={c.id} to={`/customers/${c.id}`}
                  className="block rounded-xl bg-white border-2 border-amber-300 p-3 active:bg-amber-100">
                  <div className="font-extrabold">{c.name}</div>
                  <div className="text-sm text-slate-500">{[c.phone, c.address].filter(Boolean).join(' · ')}</div>
                  <div className="text-sm font-bold text-amber-800 mt-1">פתח את הכרטיס הקיים ›</div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <Field label="כתובת"><Input value={form.address} onChange={set('address')} /></Field>
        <Field label="הערות"><Textarea value={form.notes} onChange={set('notes')} /></Field>

        {(data?.dests || []).length > 0 && (
          <Field label="לאיזה חשבון הלקוח משלם?" hint="נקבע פעם אחת, וכל תזכורת תשלום אליו תצא עם הפרטים האלה">
            <Choice cols="grid-cols-2" value={form.payment_destination_id} onChange={set('payment_destination_id')}
              options={[['', 'לא נקבע'], ...data.dests.map((d) => [d.id, d.label])]} />
          </Field>
        )}
        <ErrorBox error={error} />
        <Button type="submit" size="xl" className="w-full" disabled={busy}>{busy ? 'שומר…' : 'שמירה'}</Button>

        {editing && (
          <div className="pt-6 mt-2 border-t border-slate-200">
            <Button type="button" variant="danger" size="lg" className="w-full" onClick={remove} disabled={busy}>
              🗑 מחיקת הלקוח
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
