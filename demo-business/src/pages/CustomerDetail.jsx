import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { ILS, num, priceOf, DEBT_STATUSES } from '../lib/format'
import { Button, Card, Empty, Loading, PageTitle, Section } from '../components/ui'
import PhoneActions from '../components/PhoneActions'
import NavigateButton from '../components/NavigateButton'
import JobRow from '../components/JobRow'
import DebtReminder from '../components/DebtReminder'

export default function CustomerDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const me = useOutletContext()?.profile || null
  const { data, loading, reload } = useData(async () => {
    const [customer, jobs, profiles, dests, workspace] = await Promise.all([
      db.customer(id), db.jobsOfCustomer(id), db.profiles(), db.payDestinations(), db.workspace(),
    ])
    return { customer, jobs, profiles, dests, workspace }
  }, [id])

  if (loading) return <Loading />
  if (!data?.customer) return <Empty>הלקוח לא נמצא</Empty>
  const { customer: c, jobs, profiles, dests = [], workspace: ws } = data
  // Only work that was actually carried out and is still short of money.
  const owing = jobs.filter((j) => DEBT_STATUSES.includes(j.status) && num(j.balance) > 0)
  const live = jobs.filter((j) => j.status !== 'cancelled')
  const debt = live.reduce((s, j) => s + Math.max(0, num(j.balance)), 0)
  const total = live.reduce((s, j) => s + priceOf(j), 0)

  async function remove() {
    if (!confirm(`להעביר את ${c.name} לסל המיחזור? העבודות שלו יישארו במערכת, ואפשר לשחזר תוך 30 יום.`)) return
    await db.deleteCustomer(id, me?.id)
    nav('/customers', { replace: true })
  }

  return (
    <div>
      <PageTitle back="/customers" action={<Button to={`/customers/${id}/edit`} variant="secondary" size="md">עריכה</Button>}>
        {c.name}
      </PageTitle>

      <Card>
        {c.phone && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-lg font-bold" dir="ltr">{c.phone}</span>
            <PhoneActions phone={c.phone} text={`שלום ${c.name},`} />
          </div>
        )}
        {c.address && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-slate-700 truncate">📍 {c.address}</span>
            <NavigateButton address={c.address} />
          </div>
        )}
        {c.notes && <p className="mt-2 text-slate-600 whitespace-pre-wrap">{c.notes}</p>}
        <div className="mt-4 grid grid-cols-2 text-center border-t pt-3">
          <div><div className="text-xs text-slate-500">סה"כ עבודות</div><div className="text-lg font-extrabold">{ILS(total)}</div></div>
          <div><div className="text-xs text-slate-500">חוב פתוח</div><div className={`text-lg font-extrabold ${debt > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{ILS(debt)}</div></div>
        </div>
      </Card>

      {owing.length > 0 && (
        <div className="mt-4">
          <DebtReminder customer={c} jobs={owing} dests={dests} vatPercent={ws?.vat_percent ?? 18}
            businessName={ws?.business_name} from={me?.full_name} onSaved={reload} />
        </div>
      )}

      <Button className="w-full mt-4" size="xl"
        onClick={() => nav('/quick-add', { state: { from: `/customers/${id}`, customerId: id } })}>
        ＋ קריאה חדשה ללקוח הזה
      </Button>
      <Button className="w-full mt-2" size="lg" variant="secondary"
        onClick={() => nav('/quotes/new', { state: { from: `/customers/${id}`, customerId: id } })}>
        📄 הצעת מחיר ללקוח הזה
      </Button>

      <Section title="היסטוריית עבודות">
        {jobs.length === 0 ? <Empty>עדיין אין עבודות ללקוח</Empty> : (
          <div className="space-y-2">{jobs.map((j) => <JobRow key={j.id} job={j} profiles={profiles} showKind />)}</div>
        )}
      </Section>

      <div className="mt-10">
        <Button variant="danger" size="lg" className="w-full" onClick={remove}>🗑 מחיקת לקוח</Button>
        <p className="text-xs text-slate-400 text-center mt-2">אפשר למחוק גם ממסך העריכה למעלה</p>
      </div>
    </div>
  )
}
