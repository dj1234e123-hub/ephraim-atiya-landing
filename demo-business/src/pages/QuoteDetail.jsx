import { useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { ILS, KIND, PROJECT_LOOK, fmtDate, fmtDateTime, localDateOf, num, whatsappHref } from '../lib/format'
import { QUOTE_STATUS, expiresOn, isExpired, lineTotal, quoteMessage, quoteToDescription, quoteTotals } from '../lib/quotes'
import { Block, Button, Card, Choice, Empty, ErrorBox, Loading, PageTitle, Pill, Sheet } from '../components/ui'
import PhoneActions from '../components/PhoneActions'
import { track } from '../lib/analytics'

/**
 * הצעה אחת: מה כלול, כמה זה עולה, ההודעה שתישלח, ומה קרה איתה.
 * הפעולה החשובה כאן היא "הלקוח אישר": ההצעה הופכת לקריאה עם המחיר שסוכם.
 */
export default function QuoteDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const justSaved = useLocation().state?.justSaved
  const me = useOutletContext()?.profile || null
  const { data, loading, reload } = useData(async () => {
    const quote = await db.quote(id)
    const [customer, workspace, job] = await Promise.all([
      quote.customer_id ? db.customer(quote.customer_id) : Promise.resolve(null),
      db.workspace(),
      quote.job_id ? db.job(quote.job_id).catch(() => null) : Promise.resolve(null),
    ])
    return { quote, customer, workspace, job }
  }, [id])
  const [sheet, setSheet] = useState(null)   // 'approve'
  const [kind, setKind] = useState('private')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return <Loading />
  if (!data?.quote) return <Empty>הצעת המחיר לא נמצאה</Empty>
  const { quote: q, customer, workspace: ws, job } = data
  const vat = ws?.vat_percent ?? 18
  const t = quoteTotals(q, vat)
  const st = QUOTE_STATUS[q.status] || QUOTE_STATUS.draft
  const expired = isExpired(q)
  const text = quoteMessage({ quote: q, customer, businessName: ws?.business_name, from: me?.full_name, vatPercent: vat })

  const patch = async (p) => {
    setBusy(true); setError(null)
    try { await db.updateQuote(id, p); reload() } catch (e) { setError(e) } finally { setBusy(false) }
  }

  /** נשלחה: גם אם וואטסאפ עצמו לא נפתח בהדגמה, ההצעה מסומנת כנשלחה עכשיו. */
  function markSent() {
    track('demo_quote_sent')
    if (q.status === 'draft') patch({ status: 'sent', sent_at: new Date().toISOString() })
  }

  async function approve() {
    if (busy) return
    setBusy(true); setError(null)
    try {
      const decided_at = new Date().toISOString()
      const created = await db.saveJob({
        kind,
        customer_id: q.customer_id,
        title: q.title,
        status: 'new',
        price: t.net,
        description: quoteToDescription({ ...q, decided_at }),
        assignees: me?.id ? [me.id] : [],
        quote_id: q.id,
      })
      await db.updateQuote(id, { status: 'approved', decided_at, job_id: created.id })
      track('demo_quote_approved', { kind })
      nav(`/job/${created.id}`, { replace: true, state: { fromQuote: true } })
    } catch (e) { setError(e); setBusy(false) }
  }

  async function duplicate() {
    const copy = await db.saveQuote({
      customer_id: q.customer_id, title: q.title, items: q.items.map((it) => ({ ...it })),
      adds_vat: q.adds_vat, discount: q.discount, valid_days: q.valid_days, notes: q.notes, status: 'draft',
    })
    nav(`/quotes/${copy.id}`)
  }

  async function remove() {
    if (!confirm(`למחוק את ההצעה "${q.title}"?`)) return
    await db.deleteQuote(id)
    nav('/quotes', { replace: true })
  }

  const editable = ['draft', 'sent'].includes(q.status)

  return (
    <div>
      <PageTitle back="/quotes" action={editable && <Button to={`/quotes/${id}/edit`} variant="secondary" size="md">עריכה</Button>}>
        {q.title}
      </PageTitle>

      {justSaved && q.status === 'draft' && (
        <Card className="border-2 border-emerald-300 bg-emerald-50/70 mb-3">
          <div className="font-extrabold text-lg">✅ ההצעה נשמרה כטיוטה</div>
          <p className="text-sm text-slate-600 mt-1">בדקו את ההודעה למטה, ואז שלחו ללקוח בלחיצה אחת.</p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-slate-500 text-sm">📄 הצעת מחיר · נוצרה {fmtDate(localDateOf(q.created_at))}</span>
          <Pill cls={expired ? 'bg-amber-500 text-white' : st.cls}>{expired ? 'פג תוקף' : st.label}</Pill>
        </div>
        {customer ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <Link to={`/customers/${customer.id}`} className="font-bold text-lg underline decoration-dotted truncate">{customer.name}</Link>
            <PhoneActions phone={customer.phone} size="sm" text={`שלום ${customer.name}, לגבי הצעת המחיר ל${q.title}`} />
          </div>
        ) : <div className="mt-3 text-slate-400">ללא לקוח</div>}
        {customer?.address && <div className="mt-1 text-sm text-slate-600">📍 {customer.address}</div>}
        <div className="mt-2 text-xs text-slate-400 space-x-2">
          {q.sent_at && <span>נשלחה {fmtDateTime(q.sent_at)}</span>}
          {q.status === 'sent' && expiresOn(q) && <span> · {expired ? 'פג תוקף ב-' : 'בתוקף עד '}{fmtDate(expiresOn(q))}</span>}
          {q.decided_at && <span> · {q.status === 'approved' ? 'אושרה' : 'נדחתה'} {fmtDate(localDateOf(q.decided_at))}</span>}
        </div>
      </Card>

      {q.status === 'approved' && (
        <Card className="mt-3 border-2 border-emerald-300 bg-emerald-50/70">
          <div className="font-extrabold">✅ ההצעה אושרה{job ? ' והפכה לקריאה' : ''}</div>
          {job ? (
            <Link to={`/job/${job.id}`} className="mt-2 flex items-center justify-between rounded-xl bg-white border border-emerald-200 p-3">
              <span className="font-bold truncate">{job.kind === 'project' ? `${PROJECT_LOOK.icon} ` : '🔧 '}{job.title}</span>
              <span className="text-sm text-emerald-800 font-bold shrink-0">לקריאה ›</span>
            </Link>
          ) : <p className="text-sm text-slate-600 mt-1">הקריאה שנפתחה ממנה נמחקה.</p>}
        </Card>
      )}

      <div className="mt-3">
        <Block icon="🧾" title="מה כלול">
          <div className="divide-y divide-slate-100">
            {q.items.map((it) => (
              <div key={it.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="font-bold">{it.desc}</div>
                  {num(it.qty) !== 1 && <div className="text-xs text-slate-500">{num(it.qty)} × {ILS(it.unit_price)}</div>}
                </div>
                <div className="font-extrabold shrink-0">{ILS(lineTotal(it))}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
            {t.discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">הנחה</span><b className="text-red-700">-{ILS(t.discount)}</b></div>}
            <div className="flex justify-between"><span className="text-slate-500">לפני מע"מ</span><b>{ILS(t.net)}</b></div>
            {t.vat > 0 && <div className="flex justify-between"><span className="text-slate-500">מע"מ {t.vatPercent}%</span><b>{ILS(t.vat)}</b></div>}
            <div className="flex justify-between text-xl pt-1"><span className="font-bold">{t.vat > 0 ? 'סה"כ לתשלום' : 'סה"כ'}</span><b className="text-brand">{ILS(t.total)}</b></div>
          </div>
          {q.notes && <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">📝 {q.notes}</p>}
        </Block>
      </div>

      {editable && (
        <div className="mt-3">
          <Block icon="📲" title="ההודעה ללקוח">
            <pre dir="rtl" className="whitespace-pre-wrap font-sans text-sm bg-slate-50 border border-slate-200 rounded-2xl p-3 leading-relaxed">{text}</pre>
            {customer?.phone ? (
              <a href={whatsappHref(customer.phone, text)} target="_blank" rel="noopener noreferrer" onClick={markSent}
                className="mt-3 min-h-14 rounded-2xl bg-[#25D366] text-white font-extrabold text-lg flex items-center justify-center gap-2 active:scale-[0.99] transition">
                📲 {q.status === 'sent' ? 'שליחה שוב בוואטסאפ' : 'שליחה ללקוח בוואטסאפ'}
              </a>
            ) : (
              <Card className="mt-3 border-2 border-amber-300 bg-amber-50">ללקוח הזה אין טלפון שמור, אז אי אפשר לשלוח לו את ההצעה.</Card>
            )}
            {q.status === 'draft' && customer?.phone && (
              <button type="button" onClick={markSent} className="mt-2 w-full text-sm text-slate-500 underline decoration-dotted">
                שלחתי בדרך אחרת, לסמן כנשלחה
              </button>
            )}
          </Block>
        </div>
      )}

      {q.status === 'sent' && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-600 mb-2">מה הלקוח אמר?</div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="success" size="xl" onClick={() => setSheet('approve')} disabled={busy}>✅ אישר</Button>
            <Button variant="danger" size="xl" onClick={() => patch({ status: 'rejected', decided_at: new Date().toISOString() })} disabled={busy}>✕ דחה</Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">אישור פותח קריאה עם המחיר שסוכם, בלי להקליד שוב.</p>
        </div>
      )}

      {q.status === 'rejected' && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={duplicate}>📄 הצעה חדשה על בסיס זו</Button>
          <Button variant="ghost" size="lg" onClick={() => patch({ status: 'sent', decided_at: null })}>החזרה ל"נשלחה"</Button>
        </div>
      )}

      <ErrorBox error={error} />

      <div className="mt-10 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="md" onClick={duplicate}>שכפול</Button>
        {q.status !== 'approved' && <Button variant="danger" size="md" onClick={remove}>מחיקת ההצעה</Button>}
      </div>

      <Sheet open={sheet === 'approve'} onClose={() => setSheet(null)} title="הלקוח אישר 👏">
        <div className="space-y-4">
          <p className="text-slate-600">נפתחת קריאה חדשה על שם {customer?.name || 'הלקוח'} במחיר <b>{ILS(t.net)}</b> (לפני מע"מ). את המועד קובעים אחר כך, מלוח הבקרה או מהיומן.</p>
          <div>
            <div className="text-sm font-semibold text-slate-600 mb-1">איזה סוג עבודה זו?</div>
            <Choice cols="grid-cols-2" value={kind} onChange={setKind}
              options={[['private', KIND.private.label, 'bg-accent text-white border-accent'], ['project', `${PROJECT_LOOK.icon} ${KIND.project.label}`, 'bg-indigo-600 text-white border-indigo-600']]} />
            <p className="text-xs text-slate-400 mt-1">פרויקט = חוזרים לשם כמה פעמים, שלב בכל פעם, ורושמים כל ביקור.</p>
          </div>
          <ErrorBox error={error} />
          <Button size="xl" variant="success" className="w-full" onClick={approve} disabled={busy}>{busy ? 'פותח קריאה…' : 'פתיחת הקריאה'}</Button>
        </div>
      </Sheet>
    </div>
  )
}
