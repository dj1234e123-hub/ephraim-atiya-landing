import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { ILS, fmtDate, localDateOf, monthStart, monthEnd, num } from '../lib/format'
import { QUOTE_STATUS, expiresOn, isExpired, quoteTotals } from '../lib/quotes'
import { Card, Choice, Empty, Loading, PageTitle, Pill } from '../components/ui'

const FILTERS = [['open', 'פתוחות'], ['approved', 'אושרו'], ['rejected', 'נדחו'], ['all', 'הכל']]

/**
 * כל הצעות המחיר במקום אחד: מה עוד מחכה לתשובה (והאם פג תוקפה), מה אושר
 * החודש ומה נדחה. הצעה שאושרה היא כבר קריאה, ומכאן גם מגיעים אליה.
 */
export default function Quotes() {
  const nav = useNavigate()
  const [filter, setFilter] = useState('open')
  const { data, loading } = useData(async () => {
    const [quotes, workspace] = await Promise.all([db.quotes(), db.workspace()])
    return { quotes, workspace }
  })
  if (loading) return <Loading />
  const vat = data?.workspace?.vat_percent ?? 18
  const all = data?.quotes || []
  const totalOf = (q) => quoteTotals(q, vat).net

  const open = all.filter((q) => ['draft', 'sent'].includes(q.status))
  const waiting = all.filter((q) => q.status === 'sent')
  const mFrom = monthStart(), mTo = monthEnd()
  const approvedThisMonth = all.filter((q) => q.status === 'approved' && q.decided_at && localDateOf(q.decided_at) >= mFrom && localDateOf(q.decided_at) <= mTo)
  const decided = all.filter((q) => ['approved', 'rejected'].includes(q.status))
  const winRate = decided.length ? Math.round(100 * decided.filter((q) => q.status === 'approved').length / decided.length) : null

  const list = all.filter((q) =>
    filter === 'all' ? true
    : filter === 'open' ? ['draft', 'sent'].includes(q.status)
    : q.status === filter)

  return (
    <div>
      <PageTitle back="/more" action={
        <button type="button" onClick={() => nav('/quotes/new', { state: { from: '/quotes' } })}
          className="min-h-12 px-4 rounded-2xl bg-brand text-white font-extrabold active:scale-[0.98]">＋ הצעה חדשה</button>
      }>הצעות מחיר</PageTitle>

      <Card>
        <div className="grid grid-cols-3 text-center">
          <div>
            <div className="text-xs text-slate-500">ממתינות לתשובה</div>
            <div className="text-xl font-extrabold text-blue-700">{ILS(waiting.reduce((s, q) => s + totalOf(q), 0))}</div>
            <div className="text-xs text-slate-400">{waiting.length} הצעות</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">אושרו החודש</div>
            <div className="text-xl font-extrabold text-emerald-700">{ILS(approvedThisMonth.reduce((s, q) => s + totalOf(q), 0))}</div>
            <div className="text-xs text-slate-400">{approvedThisMonth.length} הצעות</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">אחוז אישור</div>
            <div className="text-xl font-extrabold">{winRate == null ? '–' : `${winRate}%`}</div>
            <div className="text-xs text-slate-400">מכל מה שהוחלט</div>
          </div>
        </div>
      </Card>

      <div className="mt-3">
        <Choice cols="grid-cols-4" value={filter} onChange={setFilter} options={FILTERS} />
      </div>

      <div className="mt-4 space-y-2">
        {list.length === 0 ? <Empty>{filter === 'open' ? 'אין הצעות פתוחות' : 'אין הצעות להצגה'}</Empty> : list.map((q) => {
          const st = QUOTE_STATUS[q.status] || QUOTE_STATUS.draft
          const expired = isExpired(q)
          return (
            <Card key={q.id} to={`/quotes/${q.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-extrabold text-lg truncate">{q.title}</div>
                  <div className="text-sm text-slate-500 truncate">
                    {q.customer_name || 'ללא לקוח'} · {q.items.length} {q.items.length === 1 ? 'שורה' : 'שורות'}
                    {q.adds_vat ? ' · כולל מע"מ בהודעה' : ''}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {q.status === 'sent' && q.sent_at ? `נשלחה ${fmtDate(localDateOf(q.sent_at))}` : `נוצרה ${fmtDate(localDateOf(q.created_at))}`}
                    {q.status === 'sent' && expiresOn(q) ? ` · ${expired ? 'פג תוקף ב-' : 'בתוקף עד '}${fmtDate(expiresOn(q))}` : ''}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Pill cls={expired ? 'bg-amber-500 text-white' : st.cls}>{expired ? 'פג תוקף' : st.label}</Pill>
                  <span className="font-extrabold">{ILS(totalOf(q))}</span>
                </div>
              </div>
              {open.length > 0 && filter === 'open' && num(q.discount) > 0 && (
                <div className="text-xs text-slate-400 mt-1">כולל הנחה של {ILS(q.discount)}</div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
