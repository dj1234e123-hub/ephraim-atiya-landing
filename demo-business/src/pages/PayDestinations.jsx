import { useEffect, useState } from 'react'
import { db, useData } from '../lib/data'
import { num } from '../lib/format'
import {
  Button, Card, ErrorBox, Field, Input, Loading, PageTitle, Section, Toggle,
} from '../components/ui'

const EMPTY = {
  label: '', account_name: '', bank_name: '', bank_branch: '',
  bank_account: '', bit_phone: '', adds_vat: false, note: '',
}

/**
 * The accounts a customer can be told to pay into.
 *
 * Deliberately a list and not two fields in the code: the brothers change a
 * number without waiting for anyone, and the next plumbing business that gets
 * this system fills in its own. `adds_vat` is what makes a reminder show the
 * VAT on top of the price, since prices are stored net.
 */
export default function PayDestinations() {
  const { data, loading, reload } = useData(async () => {
    const [workspace, dests] = await Promise.all([db.workspace(), db.payDestinations()])
    return { workspace, dests }
  })
  const [vat, setVat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)   // a destination, or EMPTY for a new one

  useEffect(() => { if (data?.workspace) setVat(String(data.workspace.vat_percent ?? 18)) }, [data?.workspace?.id])

  if (loading) return <Loading />
  const dests = data?.dests || []
  const ws = data?.workspace

  async function saveVat() {
    if (!ws) return
    setBusy(true); setError(null)
    try { await db.saveWorkspace({ id: ws.id, vat_percent: num(vat) }); reload() }
    catch (e) { setError(e) } finally { setBusy(false) }
  }

  async function save() {
    if (busy) return
    if (!editing.label.trim()) return setError({ message: 'צריך שם ליעד, למשל "שמעון - מזרחי"' })
    setBusy(true); setError(null)
    try {
      const { id, label, account_name, bank_name, bank_branch, bank_account, bit_phone, adds_vat, note } = editing
      await db.savePayDestination({
        ...(id ? { id } : {}),
        label: label.trim(),
        account_name: account_name?.trim() || null,
        bank_name: bank_name?.trim() || null,
        bank_branch: bank_branch?.trim() || null,
        bank_account: bank_account?.trim() || null,
        bit_phone: bit_phone?.trim() || null,
        adds_vat: !!adds_vat,
        note: note?.trim() || null,
        sort_order: id ? undefined : dests.length + 1,
      })
      setEditing(null); reload()
    } catch (e) { setError(e) } finally { setBusy(false) }
  }

  async function remove(d) {
    if (!confirm(`למחוק את "${d.label}"?`)) return
    try { await db.deletePayDestination(d.id); reload() } catch (e) { setError(e) }
  }

  const set = (key) => (e) => setEditing((f) => ({ ...f, [key]: e?.target ? e.target.value : e }))

  if (editing) {
    return (
      <div>
        <PageTitle back="/pay-destinations">{editing.id ? 'עריכת יעד תשלום' : 'יעד תשלום חדש'}</PageTitle>
        <div className="space-y-4">
          <Field label="שם היעד" hint="מה שאתם רואים כשבוחרים, למשל: שמעון - מזרחי">
            <Input value={editing.label} onChange={set('label')} autoFocus />
          </Field>
          <Field label="שם בעל החשבון" hint="מה שהלקוח רואה בהודעה">
            <Input value={editing.account_name || ''} onChange={set('account_name')} placeholder="שמעון אינסטלציה" />
          </Field>
          <Field label="בנק"><Input value={editing.bank_name || ''} onChange={set('bank_name')} placeholder="בנק מזרחי" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="סניף"><Input dir="ltr" value={editing.bank_branch || ''} onChange={set('bank_branch')} /></Field>
            <Field label="חשבון"><Input dir="ltr" value={editing.bank_account || ''} onChange={set('bank_account')} /></Field>
          </div>
          <Field label="ביט"><Input type="tel" dir="ltr" value={editing.bit_phone || ''} onChange={set('bit_phone')} placeholder="050-0000000" /></Field>
          <Toggle checked={!!editing.adds_vat} onChange={set('adds_vat')} label={'להוסיף מע"מ למחיר'}
            hint={'המחירים במערכת נרשמים ללא מע"מ. ביעד הזה ההודעה ללקוח תציג את המע"מ ואת הסה"כ.'} />
          <Field label="שורת הערה" hint="נוספת בסוף ההודעה ללקוח. לא חובה.">
            <Input value={editing.note || ''} onChange={set('note')} placeholder="למשל: התשלום עד 14 יום" />
          </Field>
          <ErrorBox error={error} />
          <div className="flex gap-2">
            <Button size="xl" className="flex-1" onClick={save} disabled={busy}>{busy ? 'שומר…' : 'שמירה'}</Button>
            <Button size="xl" variant="ghost" onClick={() => { setEditing(null); setError(null) }}>ביטול</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageTitle back="/more">פרטי תשלום</PageTitle>
      <p className="text-slate-500 leading-relaxed">
        החשבונות שאליהם הלקוחות מעבירים כסף. בכרטיס כל לקוח אפשר לקבוע לאיזה יעד הוא משלם,
        וההודעה אליו תצא עם הפרטים הנכונים לבד.
      </p>

      <Section title="היעדים שלכם">
        <div className="space-y-3">
          {dests.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-extrabold text-lg">{d.label}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {[d.bank_name, d.bank_branch && `סניף ${d.bank_branch}`, d.bank_account && `חשבון ${d.bank_account}`]
                      .filter(Boolean).join(' · ') || 'אין פרטי בנק'}
                  </div>
                  {d.bit_phone && <div className="text-sm text-slate-500" dir="ltr">ביט {d.bit_phone}</div>}
                  {d.adds_vat && <div className="text-sm font-bold text-amber-700 mt-1">ההודעה מוסיפה מע"מ</div>}
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="md" variant="secondary" onClick={() => setEditing(d)}>עריכה</Button>
                  <Button size="md" variant="ghost" onClick={() => remove(d)}>מחיקה</Button>
                </div>
              </div>
            </Card>
          ))}
          <Button size="xl" className="w-full" onClick={() => setEditing({ ...EMPTY })}>＋ יעד תשלום חדש</Button>
        </div>
      </Section>

      <Section title={'מע"מ'}>
        <Card>
          <Field label={'אחוז מע"מ'} hint={'משמש לחישוב בהודעות ללקוח, ביעדים שמסומנים להוספת מע"מ'}>
            <div className="flex gap-2">
              <Input type="number" inputMode="decimal" min="0" max="100" step="0.5" value={vat}
                onChange={(e) => setVat(e.target.value)} />
              <Button size="md" onClick={saveVat} disabled={busy}>שמירה</Button>
            </div>
          </Field>
        </Card>
      </Section>

      <ErrorBox error={error} />
    </div>
  )
}
