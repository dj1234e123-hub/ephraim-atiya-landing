import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { db } from './lib/data'
import { ME_ID } from './lib/demo'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import CloseDay from './pages/CloseDay'
import QuickAdd from './pages/QuickAdd'
import JobsList from './pages/JobsList'
import JobForm from './pages/JobForm'
import JobDetail from './pages/JobDetail'
import Customers from './pages/Customers'
import CustomerForm from './pages/CustomerForm'
import CustomerDetail from './pages/CustomerDetail'
import Expenses from './pages/Expenses'
import Collections from './pages/Collections'
import Summary from './pages/Summary'
import More from './pages/More'
import PayDestinations from './pages/PayDestinations'
import Backup from './pages/Backup'
import SupplierDebts from './pages/SupplierDebts'
import RecycleBin from './pages/RecycleBin'
import Projects from './pages/Projects'
import Quotes from './pages/Quotes'
import QuoteForm from './pages/QuoteForm'
import QuoteDetail from './pages/QuoteDetail'
import ErrorBoundary from './components/ErrorBoundary'
import { Loading } from './components/ui'

/**
 * גרסת ההדגמה: אין מסך התחברות. המשתמש המחובר הוא תמיד אלישע, והנתונים
 * נטענים מהזיכרון. שאר המסכים זהים למערכת האמיתית.
 */
export default function App() {
  const [profile, setProfile] = useState(null)

  const loadProfile = useCallback(() => {
    db.profile(ME_ID).then(setProfile).catch(() => {})
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  if (!profile) return <div className="min-h-dvh bg-brand"><Loading /></div>

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout profile={profile} reloadProfile={loadProfile} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/close-day" element={<CloseDay />} />
          <Route path="/quick-add" element={<QuickAdd />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/job/:id/edit" element={<JobForm />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/:id/edit" element={<CustomerForm />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/new" element={<Expenses newMode />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/more" element={<More />} />
          <Route path="/pay-destinations" element={<PayDestinations />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/supplier-debts" element={<SupplierDebts />} />
          <Route path="/recycle-bin" element={<RecycleBin />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/new" element={<QuoteForm />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/quotes/:id/edit" element={<QuoteForm />} />
          {/* legacy paths */}
          <Route path="/debts" element={<Navigate to="/collections" replace />} />
          <Route path="/jobs/:kind" element={<Navigate to="/jobs" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
