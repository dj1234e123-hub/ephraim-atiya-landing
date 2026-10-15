import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { Button, Card, Empty, Input, Loading, PageTitle } from '../components/ui'
import PhoneActions from '../components/PhoneActions'
import NavigateButton from '../components/NavigateButton'

export default function Customers() {
  const [search, setSearch] = useState('')
  const { data: customers, loading } = useData(() => db.customers())
  const list = (customers || []).filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (c.name || '').toLowerCase().includes(s) || (c.phone || '').includes(s) || (c.address || '').toLowerCase().includes(s)
  })
  return (
    <div>
      <PageTitle back="/more">לקוחות</PageTitle>
      <Button to="/customers/new" size="xl" className="w-full">＋ לקוח חדש</Button>
      <div className="mt-4">
        <Input placeholder="חיפוש לפי שם, טלפון או כתובת…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="mt-4 space-y-2">
        {loading ? <Loading /> : list.length === 0 ? <Empty>אין לקוחות</Empty> : list.map((c) => (
          <Card key={c.id} className="flex items-center justify-between gap-3">
            <Link to={`/customers/${c.id}`} className="min-w-0 flex-1">
              <div className="font-extrabold text-lg truncate">{c.name}</div>
              <div className="text-sm text-slate-500 truncate">{[c.phone, c.address].filter(Boolean).join(' · ')}</div>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <NavigateButton address={c.address} size="sm" />
              <PhoneActions phone={c.phone} size="sm" text={`שלום ${c.name},`} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
