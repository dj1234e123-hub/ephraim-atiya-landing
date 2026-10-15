import { useState } from 'react'
import { db, useData } from '../lib/data'
import { useOutletContext } from 'react-router-dom'
import { CATEGORIES, ILS, daysBetween, fmtDate, num, today } from '../lib/format'
import { Button, Card, Empty, ErrorBox, Loading, PageTitle, Sheet } from '../components/ui'
import MoneyWho from '../components/MoneyWho'

const AGED_DAYS = 45

/**
 * The mirror image of the collections screen: not who owes them, but who they
 * owe. Materials are taken from a shop on account all week, so the cost is
 * real long before the money moves - and until it does it belongs here and not
 * on either brother's personal balance.
 */
export default function SupplierDebts() {
  const me = useOutletContext()?.profile || null
  const { data, loading, reload } = useData(async () => {
    const [expenses, profiles] = await Promise.all([db.expensesUnpaid(), db.profiles()])
    return { expenses, profiles }
  })
  const [settling, setSettling] = useState(null)      // the expense being paid
  const [who, setWho] = useState({ received_by: null, third_party: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return <Loading />
  const expenses = data?.expenses || []
  const profiles = data?.profiles || []

  // one card per shop, oldest debt first
  const groups = []
  const bySupplier = new Map()
  for (const e of expenses) {
    const key = e.supplier?.trim() || '__none__'
    if (!bySupplier.has(key)) {
      const g = { key, name: e.supplier?.trim() || 'בלי שם ספק', items: [], total: 0, oldest: e.spent_at }
      bySupplier.set(key, g); groups.push(g)
    }
    const g = bySupplier.get(key)
    g.items.push(e)
    g.total += num(e.amount)
    if (e.spent_at < g.oldest) g.oldest = e.spent_at
  }
  for (const g of groups) g.age = Math.max(0, daysBetween(g.oldest, today()))
  groups.sort((a, b) => b.age - a.age || b.total - a.total)
  const total = groups.reduce((s, g) => s + g.total, 0)

  function open(e) {
    setSettling(e)
    setWho({ received_by: me?.id || null, third_party: null })
    setError(null)
  }

  async function settle() {
    if (busy) return
    if (!who.received_by) return setError({ message: 'צריך לסמן מי שילם' })
    setBusy(true); setError(null)
    try {
      await db.settleExpense(settling.id, who.received_by, today())
      setSettling(null); reload()
    } catch (e) { setError(e) } finally { setBusy(false) }
  }

  return (
    <div>
      <PageTitle back="/more">חובות לספקים</PageTitle>

      <Card>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-500">סה"כ שאתם חייבים</span>
          <span className="text-2xl font-extrabold text-red-700">{ILS(total)}</span>
        </div>
        <div className="text-sm text-slate-400 mt-1">{groups.length} ספקים · {expenses.length} רישומים</div>
      </Card>

      <ErrorBox error={error} />

      <div className="mt-4 space-y-3">
        {groups.length === 0 ? <Empty>אין חובות פתוחים לספקים 🎉</Empty> : groups.map((g) => (
          <Card key={g.key} className={g.age > AGED_DAYS ? 'border-2 border-amber-300 bg-amber-50/60' : ''}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-extrabold text-lg truncate">🏪 {g.name}</div>
                <div className="text-sm text-slate-500">פתוח {g.age} ימים</div>
              </div>
              <div className="text-xl font-extrabold text-red-700 shrink-0">{ILS(g.total)}</div>
            </div>

            <div className="mt-3 space-y-2">
              {g.items.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <div className="min-w-0">
                    <div className="font-bold">{ILS(e.amount)} <span className="text-sm font-semibold text-slate-500">· {CATEGORIES[e.category] || e.category}</span></div>
                    <div className="text-xs text-slate-400 truncate">
                      {fmtDate(e.spent_at)}{e.job ? ` · ${e.job.title}` : ' · הוצאה כללית'}{e.note ? ` · ${e.note}` : ''}
                    </div>
                  </div>
                  <Button size="md" variant="secondary" onClick={() => open(e)}>שולם</Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!settling} onClose={() => setSettling(null)} title="מי שילם לספק?">
        <div className="space-y-3">
          <Card className="bg-slate-50 flex justify-between items-baseline">
            <span className="text-slate-600 truncate">{settling?.supplier || 'ספק'}</span>
            <b className="text-red-700">{ILS(settling?.amount)}</b>
          </Card>
          <MoneyWho profiles={profiles} me={me?.id} value={who} onChange={setWho} />
          <ErrorBox error={error} />
          <Button size="xl" className="w-full" variant="success" onClick={settle} disabled={busy}>
            {busy ? 'שומר…' : 'סימון כשולם'}
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
