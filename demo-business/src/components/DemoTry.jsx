import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './ui'
import { EPHRAIM_WA, TRY_KEY } from '../lib/demo'
import { track } from '../lib/analytics'

const TRIES = [
  { to: '/quick-add', icon: '＋', label: 'פתחו קריאה חדשה', sub: 'לקוח, תקלה, מועד, מחיר. מסך אחד.' },
  { to: '/close-day', icon: '🌙', label: 'סגרו את היום', sub: 'שעות, מחיר ותשלום לכל העבודות של היום.' },
  { to: '/quotes', icon: '📄', label: 'שלחו הצעת מחיר', sub: 'ואשרו אותה, לראות איך היא הופכת לקריאה.' },
  { to: '/collections', icon: '💸', label: 'ראו מי חייב', sub: 'ושלחו תזכורת תשלום מוכנה.' },
]

/**
 * ההכוונה הראשונה בהדגמה: ארבע פעולות שמראות את המערכת הכי טוב.
 * נסגר בלחיצה ולא חוזר (עד איפוס).
 */
export default function DemoTry() {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(TRY_KEY) === '1' } catch { return false }
  })
  if (hidden) return null
  function dismiss() {
    try { localStorage.setItem(TRY_KEY, '1') } catch { /* best effort */ }
    track('demo_try_dismissed')
    setHidden(true)
  }
  return (
    <Card className="mt-4 border-2 border-[#C9A24A]/60 bg-[#F6F1E7]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-extrabold text-lg text-[#14213D]">זאת המערכת שאלישע עובד איתה כל יום.</div>
          <p className="text-sm text-slate-600 mt-0.5">הנתונים בדיוניים, אפשר ללחוץ על הכול. כמה דברים שכדאי לנסות:</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="סגירה" className="min-h-9 min-w-9 rounded-full bg-white/70 text-slate-500">✕</button>
      </div>
      <div className="mt-3 grid gap-2">
        {TRIES.map((t) => (
          <Link key={t.to} to={t.to} onClick={() => track('demo_try_click', { to: t.to })}
            className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 border border-slate-100 active:bg-slate-50">
            <span className="text-xl w-7 text-center">{t.icon}</span>
            <span className="min-w-0">
              <span className="block font-extrabold text-sm">{t.label}</span>
              <span className="block text-xs text-slate-500 truncate">{t.sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </Card>
  )
}

/** הקריאה לפעולה בסוף לוח הבקרה: אחרי שראו את המערכת, הצעד הבא הוא שיחה עם אפרים. */
export function DemoCta() {
  return (
    <Card className="mt-8 bg-[#14213D] text-[#F6F1E7] border-0 text-center">
      <div className="font-extrabold text-lg">מערכת כזאת, לפי איך שהעסק שלכם עובד.</div>
      <p className="text-sm opacity-80 mt-1">שיחת היכרות של 30 דקות, בלי עלות. בסופה תדעו אם מערכת תעזור לכם.</p>
      <a href={EPHRAIM_WA} target="_blank" rel="noopener noreferrer" onClick={() => track('demo_cta_click', { location: 'dashboard' })}
        className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-[#C9A24A] font-extrabold text-[#14213D]">
        לשיחה עם אפרים בוואטסאפ
      </a>
    </Card>
  )
}
