import { Card, PageTitle } from '../components/ui'
import { EPHRAIM_WA, LANDING_URL } from '../lib/demo'
import { track } from '../lib/analytics'

const links = [
  { to: '/quotes',      icon: '📄', label: 'הצעות מחיר',    sub: 'שורות, מע"מ, שליחה בוואטסאפ, ואישור שהופך לקריאה' },
  { to: '/close-day',   icon: '🌙', label: 'סגירת יום',     sub: 'שעות, מחיר ותשלום לכל עבודות היום במסך אחד' },
  { to: '/projects',    icon: '🏗️', label: 'פרויקטים',      sub: 'ימי עבודה, שעות ומה נעשה בכל פרויקט' },
  { to: '/customers',   icon: '👤', label: 'לקוחות',        sub: 'כרטיסי לקוח, טלפונים והיסטוריה' },
  { to: '/collections', icon: '💸', label: 'גבייה וחובות',  sub: 'מי חייב, כמה זמן, וחיוג ישיר' },
  { to: '/expenses',    icon: '🧾', label: 'הוצאות',        sub: 'חומרים, דלק, כלים וקבלני משנה' },
  { to: '/supplier-debts', icon: '🏪', label: 'חובות לספקים', sub: 'מה שלקחתם על החשבון ועוד לא שילמתם' },
  { to: '/summary',     icon: '📊', label: 'סיכום',         sub: 'שבועי וחודשי, פרטי מול פרויקטים' },
  { to: '/pay-destinations', icon: '🏦', label: 'פרטי תשלום',  sub: 'חשבונות להעברה, ביט ומע"מ' },
  { to: '/backup',      icon: '⬇️', label: 'גיבוי ויצוא',  sub: 'קובץ אקסל של החודש או של הכל' },
  { to: '/recycle-bin', icon: '🗑', label: 'סל מיחזור',    sub: 'שחזור של מה שנמחק, עד 30 יום' },
]

export default function More() {
  return (
    <div>
      <PageTitle>עוד</PageTitle>
      <div className="space-y-3">
        {links.map((l) => (
          <Card key={l.to} to={l.to} className="flex items-center gap-4">
            <span className="text-3xl">{l.icon}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-extrabold text-lg">{l.label}</span>
              <span className="block text-sm text-slate-500 truncate">{l.sub}</span>
            </span>
            <span className="text-2xl text-slate-300">‹</span>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-[#14213D] text-[#F6F1E7] border-0">
        <div className="font-extrabold text-lg">המערכת הזאת נבנתה לעסק אינסטלציה של שני שותפים.</div>
        <p className="text-sm opacity-80 mt-1 leading-relaxed">
          לא תוכנה מהמדף: כל מסך כאן נולד משאלה של אלישע בשטח. מערכת לעסק שלכם נבנית אותו דבר,
          לפי איך שאתם עובדים. במערכת האמיתית יש גם התחברות עם סיסמה לכל שותף.
        </p>
        <a href={EPHRAIM_WA} target="_blank" rel="noopener noreferrer" onClick={() => track('demo_cta_click', { location: 'more' })}
          className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-[#C9A24A] font-extrabold text-[#14213D]">
          רוצים כזה לעסק שלכם? לשיחה עם אפרים
        </a>
        <a href={LANDING_URL} className="mt-2 block text-center text-sm underline decoration-dotted opacity-80">חזרה לדף של אפרים</a>
      </Card>
    </div>
  )
}
