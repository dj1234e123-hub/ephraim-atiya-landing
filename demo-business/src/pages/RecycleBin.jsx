import { useState } from 'react'
import { db, useData } from '../lib/data'
import { ILS, daysBetween, fmtDate, localDateOf, today } from '../lib/format'
import { Button, Card, Empty, ErrorBox, Loading, PageTitle } from '../components/ui'

const KINDS = {
  job:      { icon: '🔧', label: 'קריאה',  detail: (v) => (Number(v) > 0 ? ILS(v) : '') },
  customer: { icon: '👤', label: 'לקוח',   detail: (v) => v || '' },
  payment:  { icon: '💰', label: 'תשלום',  detail: (v) => ILS(v) },
  expense:  { icon: '🧾', label: 'הוצאה',  detail: (v) => ILS(v) },
  visit:    { icon: '📋', label: 'ביקור',  detail: (v) => v || '' },
}
const KEEP_DAYS = 30

/**
 * Everything that was deleted, and the way back. A tap on 🗑 in the middle of
 * a working day is the likeliest way this business loses data, so it is worth
 * a screen of its own.
 */
export default function RecycleBin() {
  const { data, loading, reload } = useData(() => db.deletedItems(), [])
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  if (loading) return <Loading />
  const items = data || []

  async function restore(it) {
    setBusy(it.id); setError(null)
    try { await db.restore(it.kind, it.id); reload() }
    catch (e) { setError(e) } finally { setBusy(null) }
  }

  async function purge(it) {
    if (!confirm('למחוק לצמיתות? אחרי זה אי אפשר לשחזר.')) return
    setBusy(it.id); setError(null)
    try { await db.purge(it.kind, it.id); reload() }
    catch (e) { setError(e) } finally { setBusy(null) }
  }

  return (
    <div>
      <PageTitle back="/more">סל מיחזור</PageTitle>
      <p className="text-slate-500 leading-relaxed">
        כל מה שנמחק נשמר כאן לפחות {KEEP_DAYS} יום וניתן לשחזור. במשך {KEEP_DAYS} הימים האלה אי אפשר
        למחוק אותו לצמיתות - גם לא בטעות.
      </p>

      <ErrorBox error={error} />

      <div className="mt-4 space-y-3">
        {items.length === 0 ? <Empty>הסל ריק 🎉</Empty> : items.map((it) => {
          const k = KINDS[it.kind] || { icon: '•', label: it.kind, detail: () => '' }
          const age = Math.max(0, daysBetween(localDateOf(it.deleted_at) || today(), today()))
          const left = Math.max(0, KEEP_DAYS - age)
          return (
            <Card key={`${it.kind}-${it.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-extrabold text-lg truncate">{k.icon} {it.label || k.label}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {k.label}{k.detail(it.detail) ? ` · ${k.detail(it.detail)}` : ''}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    נמחק {fmtDate(localDateOf(it.deleted_at))}
                    {it.deleted_by_name ? ` · ${it.deleted_by_name}` : ''}
                    {left > 0 ? ` · מוגן עוד ${left} ימים` : ' · אפשר למחוק לצמיתות'}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="md" onClick={() => restore(it)} disabled={busy === it.id}>↩︎ שחזור</Button>
                  {/* Elisha: nothing should ever be lost by deleting it twice. The
                      button only appears once the 30 days are up, and the database
                      refuses it before then whatever screen asks. */}
                  {left === 0 && (
                    <Button size="md" variant="ghost" onClick={() => purge(it)} disabled={busy === it.id}>מחיקה סופית</Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
