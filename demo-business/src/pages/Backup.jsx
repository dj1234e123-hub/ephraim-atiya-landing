import { useState } from 'react'
import { db, useData } from '../lib/data'
import { buildBackupCsv, downloadCsv } from '../lib/backup'
import { ILS, localDateOf, monthStart, monthEnd, num, toISODate } from '../lib/format'
import { Button, Card, Choice, ErrorBox, Loading, PageTitle, Section } from '../components/ui'

const RANGES = [['this', 'החודש הזה'], ['last', 'החודש שעבר'], ['all', 'הכל']]

/** Start and end of the chosen window, or nulls for everything. */
function windowOf(range) {
  const now = new Date()
  if (range === 'all') return [null, null, 'הכל']
  const base = new Date(now.getFullYear(), now.getMonth() - (range === 'last' ? 1 : 0), 1)
  return [monthStart(base), monthEnd(base), base.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })]
}

/**
 * The free Supabase plan keeps no backup the brothers can reach, so the copy
 * that actually protects them is the one they hold themselves. One button,
 * one file, opens in Excel, and doubles as the month's document for their
 * accountant.
 */
export default function Backup() {
  const [range, setRange] = useState('this')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  const { data, loading } = useData(() => db.exportAll(), [])
  if (loading) return <Loading />

  const [from, to, label] = windowOf(range)
  const all = data || {}
  const inRange = (d) => !from || (d && d >= from && d <= to)

  // A call belongs to the month it was carried out in, falling back to when it
  // was opened - same rule the summary screen uses.
  const jobs = (all.jobs || []).filter((j) => inRange(localDateOf(j.scheduled_at) || localDateOf(j.created_at)))
  const payments = (all.payments || []).filter((p) => inRange(p.paid_at))
  const expenses = (all.expenses || []).filter((e) => inRange(e.spent_at))
  const customers = all.customers || []

  const income = payments.reduce((s, p) => s + num(p.amount), 0)
  const spent = expenses.reduce((s, e) => s + num(e.amount), 0)

  function save() {
    setBusy(true); setError(null)
    try {
      const csv = buildBackupCsv({ ...all, jobs, payments, expenses }, label)
      const stamp = range === 'all' ? toISODate(new Date()) : `${from.slice(0, 7)}`
      downloadCsv(csv, `gibui-${stamp}.csv`)
      setDone(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) { setError(e) } finally { setBusy(false) }
  }

  return (
    <div>
      <PageTitle back="/more">גיבוי ויצוא</PageTitle>
      <p className="text-slate-500 leading-relaxed">
        מוריד קובץ אחד עם הלקוחות, הקריאות, התשלומים וההוצאות. נפתח באקסל,
        ואפשר לשלוח אותו לרואה חשבון או לשמור בדרייב.
      </p>

      <div className="mt-4">
        <Choice cols="grid-cols-3" value={range} onChange={(v) => { setRange(v); setDone(null) }} options={RANGES} />
      </div>

      <Card className="mt-3">
        <div className="font-extrabold text-lg mb-2">{label}</div>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-slate-500">קריאות</span><b className="text-end">{jobs.length}</b>
          <span className="text-slate-500">לקוחות</span><b className="text-end">{customers.length}</b>
          <span className="text-slate-500">תשלומים</span><b className="text-end">{payments.length} · {ILS(income)}</b>
          <span className="text-slate-500">הוצאות</span><b className="text-end">{expenses.length} · {ILS(spent)}</b>
        </div>
      </Card>

      <div className="mt-4">
        <Button size="xl" className="w-full" onClick={save} disabled={busy}>
          {busy ? 'מכין…' : '⬇️ הורדת קובץ הגיבוי'}
        </Button>
        {done && <p className="text-emerald-700 font-bold text-center mt-2">הקובץ ירד ב־{done} ✅</p>}
        <ErrorBox error={error} />
      </div>

      <Section title="כדאי לדעת">
        <Card className="text-slate-600 leading-relaxed space-y-2">
          <p>📸 <b>תמונות לא נכללות בקובץ.</b> הן שמורות בשרת בעותק אחד, ולא יורדות עם הגיבוי.</p>
          <p>🗑 מחיקה במערכת לא מוחקת באמת - הכל עובר ל<b>סל המיחזור</b> וניתן לשחזור תוך 30 יום.</p>
          <p>📅 הרגל טוב: להוריד גיבוי אחת לחודש, בסוף החודש, ולשמור אותו מחוץ לטלפון.</p>
        </Card>
      </Section>
    </div>
  )
}
