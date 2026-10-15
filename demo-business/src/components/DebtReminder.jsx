import { useState } from 'react'
import { db } from '../lib/data'
import { ILS, debtBreakdown, debtMessage, whatsappHref } from '../lib/format'
import { Button, Card, Choice, ErrorBox, Sheet } from './ui'

/**
 * Asking a customer for money, without the part that makes people put it off.
 *
 * The message is built from the rows themselves - what was done and when, what
 * it cost, what came in, what is left - and carries the account that customer
 * pays into. Which account that is belongs to the customer, not to the job or
 * to whoever did the work, so it is remembered on his card and only has to be
 * decided once.
 */
export default function DebtReminder({ customer, jobs, dests = [], vatPercent = 18, businessName, from, onSaved }) {
  const [open, setOpen] = useState(false)
  const [destId, setDestId] = useState(customer?.payment_destination_id || dests[0]?.id || '')
  const [error, setError] = useState(null)

  const dest = dests.find((d) => d.id === destId) || null
  const b = debtBreakdown(jobs, dest, vatPercent)
  const text = debtMessage({ customer, jobs, dest, vatPercent, businessName, from })
  const canSend = !!customer?.phone

  /** Picking an account here also settles it for next time. */
  async function choose(id) {
    setDestId(id)
    if (!customer?.id || customer.payment_destination_id === id) return
    try { await db.updateCustomer(customer.id, { payment_destination_id: id }); onSaved?.() }
    catch (e) { setError(e) }
  }

  return (
    <>
      <Button size="md" variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        📲 שלח תזכורת תשלום
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title={`תזכורת תשלום · ${customer?.name || 'לקוח'}`}>
        <div className="space-y-3">
          {dests.length > 1 && (
            <div>
              <div className="font-bold mb-1">לאיזה חשבון ישלם?</div>
              <Choice cols="grid-cols-2" value={destId} onChange={choose}
                options={dests.map((d) => [d.id, d.label])} />
              <p className="text-xs text-slate-400 mt-1">הבחירה נשמרת ללקוח, כך שבפעם הבאה היא כבר מסומנת.</p>
            </div>
          )}

          {dests.length === 0 && (
            <Card className="border-2 border-amber-300 bg-amber-50">
              עוד לא הוגדרו פרטי תשלום. אפשר להוסיף אותם ב־⋯ עוד ← פרטי תשלום.
            </Card>
          )}

          <Card className="bg-slate-50">
            <div className="flex justify-between"><span className="text-slate-500">סכום העבודה</span><b>{ILS(b.net)}</b></div>
            {b.vat > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">מע"מ {b.vatPercent}%</span><b>{ILS(b.vat)}</b></div>
            )}
            {b.paid > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">שולם</span><b className="text-emerald-700">{ILS(b.paid)}</b></div>
            )}
            <div className="flex justify-between text-lg mt-1 pt-1 border-t border-slate-200">
              <span className="font-bold">נותר לתשלום</span><b className="text-amber-700">{ILS(b.due)}</b>
            </div>
          </Card>

          <div>
            <div className="font-bold mb-1">ההודעה שתישלח</div>
            <pre dir="rtl" className="whitespace-pre-wrap font-sans text-sm bg-white border-2 border-slate-200 rounded-2xl p-3 leading-relaxed">{text}</pre>
            <p className="text-xs text-slate-400 mt-1">אפשר לערוך אותה בוואטסאפ לפני השליחה.</p>
          </div>

          <ErrorBox error={error} />

          {canSend ? (
            <a href={whatsappHref(customer.phone, text)} target="_blank" rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="min-h-14 rounded-2xl bg-[#25D366] text-white font-extrabold text-lg flex items-center justify-center gap-2 active:scale-[0.99] transition">
              📲 פתח בוואטסאפ
            </a>
          ) : (
            <Card className="border-2 border-amber-300 bg-amber-50">ללקוח הזה אין מספר טלפון שמור, אז אי אפשר לשלוח לו הודעה.</Card>
          )}
        </div>
      </Sheet>
    </>
  )
}
