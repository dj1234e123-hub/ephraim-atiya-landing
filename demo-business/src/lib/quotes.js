import { ILS, fmtDate, localDateOf, num, toISODate } from './format'

/**
 * הצעות מחיר. התוספת של ההדגמה: במערכת האמיתית עדיין אין מודול כזה, וכאן
 * מראים איך הוא היה נראה בתוך אותה מערכת. הצעה היא רשימת שורות (תיאור, כמות,
 * מחיר ליחידה), עם או בלי מע"מ, שנשלחת ללקוח בוואטסאפ. כשהלקוח מאשר, ההצעה
 * הופכת לקריאה עם המחיר שסוכם, בלי להקליד כלום פעמיים.
 */
export const QUOTE_STATUS = {
  draft:    { label: 'טיוטה',  cls: 'bg-slate-200 text-slate-800',     active: 'bg-slate-700 text-white border-slate-700' },
  sent:     { label: 'נשלחה',  cls: 'bg-blue-100 text-blue-800',       active: 'bg-blue-600 text-white border-blue-600' },
  approved: { label: 'אושרה',  cls: 'bg-emerald-100 text-emerald-800', active: 'bg-emerald-600 text-white border-emerald-600' },
  rejected: { label: 'נדחתה',  cls: 'bg-red-100 text-red-700',         active: 'bg-red-600 text-white border-red-600' },
}
export const QUOTE_ORDER = ['draft', 'sent', 'approved', 'rejected']
export const VALID_DAYS = [7, 14, 30]

export const lineTotal = (it) => num(it?.qty) * num(it?.unit_price)

/** סכומים: לפני מע"מ, הנחה, מע"מ וסה"כ. המחירים נרשמים לפני מע"מ, כמו בשאר המערכת. */
export function quoteTotals(q, vatPercent = 18) {
  const gross = (q?.items || []).reduce((s, it) => s + lineTotal(it), 0)
  const discount = Math.min(gross, num(q?.discount))
  const net = gross - discount
  const vat = q?.adds_vat ? Math.round(net * (num(vatPercent) / 100) * 100) / 100 : 0
  return { gross, discount, net, vat, total: net + vat, vatPercent: num(vatPercent) }
}

/** עד מתי ההצעה בתוקף, מיום השליחה. */
export function expiresOn(q) {
  if (!q?.sent_at || !num(q.valid_days)) return null
  const d = new Date(q.sent_at)
  d.setDate(d.getDate() + num(q.valid_days))
  return toISODate(d)
}
export const isExpired = (q) => q?.status === 'sent' && !!expiresOn(q) && expiresOn(q) < toISODate(new Date())

/** ההצעה כהודעת וואטסאפ: מה כלול, כמה זה עולה, עד מתי זה תקף. */
export function quoteMessage({ quote, customer, businessName, from, vatPercent = 18 }) {
  const t = quoteTotals(quote, vatPercent)
  const lines = [
    `שלום ${customer?.name || ''},`.trim(),
    businessName ? `הצעת מחיר מ${businessName} 🔧` : 'הצעת מחיר 🔧',
    `📋 ${quote.title}`,
    '',
    ...(quote.items || []).map((it) => `• ${it.desc}${num(it.qty) !== 1 ? ` × ${num(it.qty)}` : ''} · ${ILS(lineTotal(it))}`),
    '',
    t.discount > 0 ? `🏷 הנחה: ${ILS(t.discount)}` : null,
    `💰 סה"כ לפני מע"מ: ${ILS(t.net)}`,
    t.vat > 0 ? `➕ מע"מ ${t.vatPercent}%: ${ILS(t.vat)}` : null,
    t.vat > 0 ? `🧾 סה"כ לתשלום: ${ILS(t.total)}` : 'המחיר אינו כולל מע"מ.',
    num(quote.valid_days) ? `⏳ ההצעה בתוקף ל-${quote.valid_days} יום.` : null,
    quote.notes ? `📝 ${quote.notes}` : null,
    '',
    'לאישור מספיק להשיב כאן "מאשר", ואנחנו קובעים מועד.',
    'תודה רבה,',
    from ? `${from} 🔧` : '🔧',
  ]
  return lines.filter((l) => l !== null).join('\n')
}

/** תיאור הקריאה שנפתחת מהצעה שאושרה: מה סוכם, שורה אחרי שורה. */
export function quoteToDescription(q) {
  const t = quoteTotals(q)
  return [
    `נפתחה מהצעת מחיר שאושרה ב-${fmtDate(localDateOf(q.decided_at || new Date().toISOString()))}:`,
    ...(q.items || []).map((it) => `• ${it.desc}${num(it.qty) !== 1 ? ` × ${num(it.qty)}` : ''} · ${ILS(lineTotal(it))}`),
    t.discount > 0 ? `הנחה: ${ILS(t.discount)}` : null,
    `סה"כ לפני מע"מ: ${ILS(t.net)}`,
    q.notes ? `הערות: ${q.notes}` : null,
  ].filter(Boolean).join('\n')
}

/** שורות מוכנות, כדי שהצעה נפוצה תיבנה בשלוש לחיצות. העסק מוסיף משלו תוך כדי. */
export const ITEM_TEMPLATES = [
  { desc: 'שעת עבודה', unit_price: 250 },
  { desc: 'חומרי צנרת ואביזרים', unit_price: 0 },
  { desc: 'דוד שמש 150 ליטר כולל קולט', unit_price: 2200 },
  { desc: 'פתיחת סתימה', unit_price: 350 },
  { desc: 'החלפת ברז', unit_price: 300 },
  { desc: 'נקודת מים חדשה', unit_price: 650 },
  { desc: 'קו ביוב 110 מ"מ (למטר)', unit_price: 180 },
  { desc: 'פירוק וסילוק פסולת', unit_price: 400 },
]
