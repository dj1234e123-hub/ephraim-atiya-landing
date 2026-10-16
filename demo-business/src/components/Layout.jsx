import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { db, useData } from '../lib/data'
import { resetStore } from '../lib/store'
import { EPHRAIM_WA, LANDING_URL } from '../lib/demo'
import { track } from '../lib/analytics'

const tabs = [
  { to: '/', label: 'בית', icon: '🏠', end: true },
  { to: '/calendar', label: 'יומן', icon: '📅' },
  null, // slot for the raised "+" button
  { to: '/jobs', label: 'קריאות', icon: '🔧' },
  { to: '/more', label: 'עוד', icon: '⋯' },
]

export default function Layout({ profile, reloadProfile }) {
  const location = useLocation()
  // Re-checked on every screen change, so the dot clears the moment he looks.
  const { data: waiting, reload: reloadWaiting } = useData(
    () => db.newAssignments(profile), [profile?.id, profile?.assignments_seen_at, location.pathname])
  const waitingCount = waiting?.length || 0

  useEffect(() => { track('demo_screen', { screen: location.pathname.replace(/\/[^/]*-[^/]*$/, '/:id') }) }, [location.pathname])

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <DemoBar />
        <div className="bg-brand text-white">
          <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
            <Link to="/" className="font-extrabold text-lg">ניהול עסק · אינסטלציה</Link>
            <span className="text-sm opacity-90">{profile?.full_name || ''}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 pb-32">
        <Outlet context={{ profile, reloadProfile, waiting: waiting || [], reloadWaiting }} />
      </main>

      <DemoLinkGuard />

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-2xl mx-auto grid grid-cols-5 relative">
          {tabs.map((t, i) =>
            t ? (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) => `flex flex-col items-center justify-center min-h-16 gap-0.5 text-xs font-bold ${isActive ? 'text-accent' : 'text-slate-500'}`}>
                <span className="text-2xl leading-none relative">
                  {t.icon}
                  {t.to === '/' && waitingCount > 0 && (
                    <span className="absolute -top-1 -end-2 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs font-extrabold flex items-center justify-center">
                      {waitingCount}
                    </span>
                  )}
                </span>
                <span>{t.label}</span>
              </NavLink>
            ) : (
              // Raised centre action: one entry point for every new call.
              <Link key="add" to="/quick-add" state={{ from: location.pathname + location.search }}
                className="flex flex-col items-center justify-end min-h-16 pb-1.5 text-xs font-extrabold text-brand">
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-accent text-white text-4xl leading-none flex items-center justify-center shadow-lg ring-4 ring-white active:scale-95 transition">＋</span>
                <span className="mt-9">קריאה חדשה</span>
              </Link>
            )
          )}
        </div>
      </nav>
    </div>
  )
}

/**
 * המסגרת של אפרים מעל מערכת העסק: פס דק בצבעי דף הנחיתה (כחול כהה וזהב).
 * אומר שזו הדגמה, מאפשר לאפס, ומוביל לשיחה עם אפרים. הכול מעבר לו הוא המערכת כפי שהיא.
 */
function DemoBar() {
  function reset() {
    if (!confirm('לאפס את ההדגמה לנקודת ההתחלה? כל מה ששיניתם ייעלם.')) return
    track('demo_reset')
    resetStore()
    window.location.href = '/'
  }
  return (
    <div className="bg-[#14213D] text-[#F6F1E7]">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded-full border border-[#C9A24A]/70 px-2 py-0.5 font-bold text-[#C9A24A]">הדגמה</span>
          <span className="truncate opacity-80">הנתונים בדיוניים · אפשר ללחוץ על הכול</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={reset} className="rounded-full px-2.5 py-1 font-bold hover:bg-white/10">איפוס</button>
          <a href={EPHRAIM_WA} target="_blank" rel="noopener noreferrer" onClick={() => track('demo_cta_click', { location: 'bar' })}
            className="rounded-full bg-[#C9A24A] px-3 py-1 font-extrabold text-[#14213D]">
            רוצים כזה? לאפרים
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * הטלפונים בהדגמה בדיוניים. כל קישור חיוג או וואטסאפ ללקוח מתחיל ב-#demo- (ראו
 * format.js), וכאן הוא נתפס: במקום לפתוח וואטסאפ מראים מה היה קורה.
 */
function DemoLinkGuard() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    function onClick(e) {
      const a = e.target.closest?.('a[href^="#demo-"]')
      if (!a) return
      e.preventDefault()
      const href = a.getAttribute('href')
      if (href.startsWith('#demo-wa')) {
        const text = new URLSearchParams(href.split('?')[1] || '').get('text')
        track('demo_whatsapp_stub', { kind: 'customer' })
        setToast({ title: '📲 כאן היה נפתח וואטסאפ עם ההודעה המוכנה', body: text || null })
      } else {
        track('demo_phone_stub')
        setToast({ title: '📞 כאן היה מתבצע חיוג ללקוח', body: null })
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.body ? 9000 : 3500)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast) return null
  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 pointer-events-none">
      <button type="button" onClick={() => setToast(null)}
        className="pointer-events-auto w-full max-w-md text-right rounded-2xl bg-[#14213D] text-[#F6F1E7] shadow-xl p-4 border border-[#C9A24A]/40">
        <div className="font-extrabold">{toast.title}</div>
        <div className="text-xs opacity-75 mt-0.5">בהדגמה המספרים בדיוניים, אז לא נשלח כלום באמת.</div>
        {toast.body && (
          <pre dir="rtl" className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed rounded-xl bg-white/10 p-2">{toast.body}</pre>
        )}
      </button>
    </div>
  )
}

export { LANDING_URL }
