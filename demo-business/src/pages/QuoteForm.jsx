import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { ILS, findSimilar, num } from '../lib/format'
import { ITEM_TEMPLATES, VALID_DAYS, lineTotal, quoteTotals } from '../lib/quotes'
import { Button, Card, Choice, ErrorBox, Field, Input, Loading, PageTitle, Textarea, Toggle } from '../components/ui'

const newItem = (desc = '', unit_price = '', qty = 1) =>
  ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, desc, qty, unit_price })

/**
 * בניית הצעת מחיר. אותו מסלול כמו "קריאה חדשה": לקוח קיים או חדש, ואז שורות.
 * השורות המוכנות למטה חוסכות הקלדה, והסכומים מתעדכנים תוך כדי.
 */
export default function QuoteForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state } = useLocation()
  const editing = Boolean(id)

  const { data, loading } = useData(async () => {
    const [quote, customers, workspace] = await Promise.all([
      editing ? db.quote(id) : Promise.resolve(null), db.customers(), db.workspace(),
    ])
    return { quote, customers, workspace }
  }, [id])
  const customers = data?.customers || []
  const vat = data?.workspace?.vat_percent ?? 18

  const [mode, setMode] = useState(state?.customerId ? 'existing' : 'existing')
  const [customerId, setCustomerId] = useState(state?.customerId || '')
  const [search, setSearch] = useState('')
  const [cust, setCust] = useState({ name: '', phone: '', address: '' })
  const [form, setForm] = useState({ title: '', items: [newItem()], adds_vat: false, discount: '', valid_days: 14, notes: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const q = data?.quote
    if (!q) return
    setForm({ title: q.title || '', items: q.items.length ? q.items.map((it) => ({ ...it })) : [newItem()], adds_vat: !!q.adds_vat, discount: num(q.discount) || '', valid_days: q.valid_days ?? 14, notes: q.notes || '' })
    if (q.customer_id) { setMode('existing'); setCustomerId(q.customer_id) }
  }, [data?.quote])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setItem = (iid, patch) => set('items', form.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)))
  const addItem = (tpl) => set('items', [...form.items.filter((it) => it.desc || it.unit_price !== ''), newItem(tpl?.desc || '', tpl ? tpl.unit_price || '' : '')])
  const dropItem = (iid) => set('items', form.items.length > 1 ? form.items.filter((it) => it.id !== iid) : [newItem()])

  const similar = useMemo(() => findSimilar(customers, cust), [customers, cust.name, cust.phone])
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return customers.slice(0, 8)
    return customers.filter((c) => (c.name || '').toLowerCase().includes(s) || (c.phone || '').includes(s)).slice(0, 12)
  }, [customers, search])
  const selected = customers.find((c) => c.id === customerId)
  const totals = quoteTotals({ ...form, items: form.items }, vat)

  async function save(e) {
    e.preventDefault()
    setError(null)
    const items = form.items.filter((it) => it.desc.trim()).map((it) => ({ id: it.id, desc: it.desc.trim(), qty: num(it.qty) || 1, unit_price: num(it.unit_price) }))
    if (!form.title.trim()) return setError({ message: 'צריך שם להצעה, למשל "שיפוץ חדר רחצה"' })
    if (!items.length) return setError({ message: 'צריך לפחות שורה אחת עם תיאור' })
    let finalCustomerId = null
    if (mode === 'existing') {
      if (!customerId) return setError({ message: 'צריך לבחור לקוח, או לעבור ללקוח חדש' })
      finalCustomerId = customerId
    }
    setBusy(true)
    try {
      if (mode === 'new') {
        if (!cust.name.trim() && !cust.phone.trim()) throw new Error('צריך שם או טלפון ללקוח')
        const c = await db.saveCustomer({ name: cust.name.trim() || cust.phone.trim(), phone: cust.phone.trim() || null, address: cust.address.trim() || null })
        finalCustomerId = c.id
      }
      const saved = await db.saveQuote({
        ...(editing ? { id } : {}),
        customer_id: finalCustomerId,
        title: form.title.trim(),
        items,
        adds_vat: form.adds_vat,
        discount: num(form.discount),
        valid_days: num(form.valid_days) || 14,
        notes: form.notes.trim() || null,
      })
      nav(`/quotes/${saved.id}`, { replace: true, state: { justSaved: true } })
    } catch (err) { setError(err); setBusy(false) }
  }

  if (loading) return <Loading />

  return (
    <form onSubmit={save}>
      <PageTitle back={editing ? `/quotes/${id}` : (state?.from || '/quotes')}>{editing ? 'עריכת הצעת מחיר' : 'הצעת מחיר חדשה'}</PageTitle>

      <div className="space-y-5">
        <div>
          <Choice cols="grid-cols-2" value={mode} onChange={setMode} options={[['existing', 'לקוח קיים'], ['new', 'לקוח חדש']]} />
          {mode === 'existing' ? (
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
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              <Field label="שם הלקוח"><Input value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} placeholder="שם מלא" /></Field>
              <Field label="טלפון" hint="בלי טלפון אי אפשר לשלוח את ההצעה בוואטסאפ">
                <Input type="tel" inputMode="tel" dir="ltr" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} placeholder="050-0000000" />
              </Field>
              {similar.length > 0 && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
                  <div className="font-bold text-amber-900">{similar.some((c) => c.why === 'phone') ? 'כבר יש לקוח עם הטלפון הזה' : 'אולי זה לקוח שכבר קיים?'}</div>
                  <div className="space-y-2 mt-2">
                    {similar.map((c) => (
                      <button key={c.id} type="button" onClick={() => { setMode('existing'); setCustomerId(c.id) }}
                        className="w-full text-right rounded-xl bg-white border-2 border-amber-300 p-3 active:bg-amber-100">
                        <div className="font-extrabold">{c.name}</div>
                        <div className="text-sm text-slate-500">{[c.phone, c.address].filter(Boolean).join(' · ')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Field label="כתובת"><Input value={cust.address} onChange={(e) => setCust({ ...cust, address: e.target.value })} placeholder="רחוב, מספר, עיר" /></Field>
            </div>
          )}
        </div>

        <Field label="שם ההצעה" hint="מה הלקוח יראה בכותרת ההודעה">
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="למשל: שיפוץ חדר רחצה מלא" />
        </Field>

        <div>
          <span className="block text-sm font-semibold text-slate-600 mb-1">מה כלול</span>
          <div className="space-y-2">
            {form.items.map((it, i) => (
              <div key={it.id} className="rounded-2xl border-2 border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{i + 1}.</span>
                  <input className="flex-1 min-w-0 min-h-11 rounded-xl border-2 border-slate-200 px-3 text-base focus:border-accent focus:outline-none"
                    value={it.desc} onChange={(e) => setItem(it.id, { desc: e.target.value })} placeholder="תיאור השורה" />
                  <button type="button" onClick={() => dropItem(it.id)} aria-label="מחיקת שורה" className="text-slate-400 min-h-10 min-w-10 text-lg">🗑</button>
                </div>
                <div className="mt-2 grid grid-cols-[1fr_1.4fr_1.2fr] gap-2 items-end">
                  <label className="block">
                    <span className="block text-xs text-slate-500 mb-1">כמות</span>
                    <input type="number" inputMode="decimal" min="0" step="1" value={it.qty} onChange={(e) => setItem(it.id, { qty: e.target.value })}
                      className="w-full min-h-11 rounded-xl border-2 border-slate-200 px-3 text-base text-center focus:border-accent focus:outline-none" />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-slate-500 mb-1">מחיר ליחידה (₪)</span>
                    <input type="number" inputMode="decimal" min="0" step="1" value={it.unit_price} onChange={(e) => setItem(it.id, { unit_price: e.target.value })} placeholder="0"
                      className="w-full min-h-11 rounded-xl border-2 border-slate-200 px-3 text-base text-center focus:border-accent focus:outline-none" />
                  </label>
                  <div className="text-left pb-2">
                    <span className="block text-xs text-slate-500">סה"כ שורה</span>
                    <span className="font-extrabold">{ILS(lineTotal(it))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => addItem()} className="min-h-10 rounded-xl border-2 border-dashed border-slate-300 px-3 text-sm font-bold text-slate-600">＋ שורה ריקה</button>
            {ITEM_TEMPLATES.map((t) => (
              <button key={t.desc} type="button" onClick={() => addItem(t)}
                className="min-h-10 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 active:scale-[0.97]">
                ＋ {t.desc}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="הנחה (₪)" hint="לא חובה">
            <Input type="number" inputMode="decimal" min="0" step="1" value={form.discount} onChange={(e) => set('discount', e.target.value)} placeholder="0" />
          </Field>
          <Field label="בתוקף (ימים)">
            <Choice cols="grid-cols-3" value={num(form.valid_days)} onChange={(v) => set('valid_days', v)} options={VALID_DAYS.map((d) => [d, String(d)])} />
          </Field>
        </div>

        <Toggle checked={form.adds_vat} onChange={(v) => set('adds_vat', v)} label={'להוסיף מע"מ בהודעה ללקוח'}
          hint={'המחירים נרשמים לפני מע"מ. כשמסומן, הלקוח יראה את המע"מ ואת הסה"כ.'} onCls="bg-brand border-brand text-white" />

        <Field label="הערות ללקוח" hint="מה לא כלול, כמה זמן זה לוקח, תנאי תשלום">
          <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="למשל: לא כולל אריחים וריצוף. משך העבודה כ-4 ימים." />
        </Field>

        <Card className="bg-slate-50">
          <div className="flex justify-between"><span className="text-slate-500">סה"כ שורות</span><b>{ILS(totals.gross)}</b></div>
          {totals.discount > 0 && <div className="flex justify-between"><span className="text-slate-500">הנחה</span><b className="text-red-700">-{ILS(totals.discount)}</b></div>}
          <div className="flex justify-between"><span className="text-slate-500">לפני מע"מ</span><b>{ILS(totals.net)}</b></div>
          {totals.vat > 0 && <div className="flex justify-between"><span className="text-slate-500">מע"מ {totals.vatPercent}%</span><b>{ILS(totals.vat)}</b></div>}
          <div className="flex justify-between text-lg mt-1 pt-1 border-t border-slate-200"><span className="font-bold">{totals.vat > 0 ? 'סה"כ לתשלום' : 'סה"כ (לפני מע"מ)'}</span><b className="text-brand">{ILS(totals.total)}</b></div>
        </Card>

        <ErrorBox error={error} />
        <Button type="submit" size="xl" className="w-full" disabled={busy}>{busy ? 'שומר…' : editing ? 'שמירת השינויים' : 'שמירת ההצעה'}</Button>
      </div>
    </form>
  )
}
