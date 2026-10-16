export const ILS = (n) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(Number(n) || 0)

export const num = (n) => Number(n) || 0

export const STATUS = {
  quote:       { label: 'הצעת מחיר', cls: 'bg-slate-200 text-slate-800',     active: 'bg-slate-700 text-white border-slate-700' },
  new:         { label: 'חדשה',      cls: 'bg-violet-100 text-violet-800',   active: 'bg-violet-600 text-white border-violet-600' },
  scheduled:   { label: 'נקבעה',     cls: 'bg-blue-100 text-blue-800',       active: 'bg-blue-600 text-white border-blue-600' },
  in_progress: { label: 'בביצוע',    cls: 'bg-amber-100 text-amber-800',     active: 'bg-amber-500 text-white border-amber-500' },
  done:        { label: 'הושלם',     cls: 'bg-emerald-100 text-emerald-800', active: 'bg-emerald-600 text-white border-emerald-600' },
  cancelled:   { label: 'בוטל',      cls: 'bg-red-100 text-red-700',         active: 'bg-red-600 text-white border-red-600' },
}
export const STATUS_ORDER = ['quote', 'new', 'scheduled', 'in_progress', 'done', 'cancelled']
/**
 * Only work that has actually been carried out can be owed money. A priced
 * quote the customer never approved, or a job booked for next week, is not a
 * debt - counting those made the collections total wildly overstated.
 */
export const DEBT_STATUSES = ['in_progress', 'done']

/**
 * Work that is finished but still owes money. Elisha's rule: a call is not
 * closed until the money is in, so these stay in the open list.
 */
export const awaitingPayment = (job) => job?.status === 'done' && num(job?.balance) > 0

/** Open = the work is not finished, or the money has not come in yet. */
export const isOpenJob = (job) => ACTIVE_STATUSES.includes(job?.status) || awaitingPayment(job)
export const OPEN_STATUSES = ['quote', 'new', 'scheduled', 'in_progress']
export const ACTIVE_STATUSES = ['new', 'scheduled', 'in_progress']
export const CLOSED_STATUSES = ['done', 'cancelled']

/**
 * How a job's price is decided. Elisha works both ways and said so: he quotes
 * a project as a whole sometimes, and sometimes he prices every time he came
 * out and did something.
 */
export const PRICING = {
  total:     { label: 'מחיר כללי',      hint: 'סכום אחד לכל העבודה' },
  per_visit: { label: 'מחיר לפי ביקור', hint: 'כל ביקור עם המחיר שלו, והמערכת מחברת' },
}
export const isPerVisit = (job) => job?.pricing_mode === 'per_visit'

/**
 * What the work costs. A job priced per visit is worth the sum of its visits,
 * which the view works out as effective_price; reading `price` alone would
 * show zero for every project he prices stage by stage.
 */
export const priceOf = (job) => num(job?.effective_price ?? job?.price)

/**
 * How long the work took. Once a job has visits the hours come from them,
 * which is what finally makes the shekels-per-hour column mean something for
 * a project that ran over five separate days.
 */
export const hoursOf = (job) => num(job?.total_hours ?? job?.duration_hours)

/**
 * What is missing from a call that is still open. One definition, used by the
 * "דורש טיפול" list on the home screen and by the day-closing screen, so a
 * call can never be open and invisible at the same time.
 *
 * Ordered by what blocks the next step first: work nobody can be sent to,
 * then work that was carried out with no price on it, then money that has
 * not come in.
 */
export const GAP = {
  no_date:  { label: 'בלי מועד',     icon: '📅', cls: 'bg-violet-600 text-white', action: 'קבע מועד' },
  no_price: { label: 'בלי מחיר',     icon: '💲', cls: 'bg-slate-700 text-white',  action: 'קבע מחיר' },
  unpaid:   { label: 'ממתין לתשלום', icon: '💰', cls: 'bg-amber-500 text-white',  action: 'רישום תשלום' },
}
export const GAP_ORDER = ['no_date', 'no_price', 'unpaid']

/**
 * Which gaps apply to one call. Empty for a call that needs nothing.
 *
 * A cancelled call is nobody's problem. A call with no date used to vanish
 * from the home screen the moment its status said "נקבעה", which is how two
 * priced calls - one of them urgent - ended up in no list at all.
 */
export function jobGaps(job) {
  if (!job || job.status === 'cancelled') return []
  const gaps = []
  if (!job.scheduled_at && job.status !== 'done') gaps.push('no_date')
  // price is `not null default 0`, so 0 on work already under way means the
  // price was never set, not that the work was free. For a job priced per
  // visit that figure is the sum of its visits, and no visits means no price.
  if (priceOf(job) <= 0 && DEBT_STATUSES.includes(job.status)) gaps.push('no_price')
  if (awaitingPayment(job)) gaps.push('unpaid')
  return gaps
}

/** The open calls that are missing something, each with its gaps. */
export const stuckJobs = (jobs = []) =>
  jobs.map((job) => ({ job, gaps: jobGaps(job) })).filter((x) => x.gaps.length > 0)

/**
 * Still on the evening's plate: not cancelled, and either not finished or
 * finished with something still missing on it.
 */
export const needsClosing = (job) =>
  !!job && job.status !== 'cancelled' && (job.status !== 'done' || jobGaps(job).length > 0)

/**
 * What the day-closing screen covers.
 *
 * Everything that was on today's calendar, plus work that is under way on no
 * particular day, plus anything finished earlier that still owes money. The
 * last two matter because the evening run is the only time these are looked
 * at, and a call left out of it is a call nobody comes back to.
 */
export function closingList(todayJobs = [], allJobs = []) {
  const byId = new Map()
  for (const j of todayJobs) if (j.status !== 'cancelled') byId.set(j.id, j)
  for (const j of allJobs) if (j.status === 'in_progress' || awaitingPayment(j)) byId.set(j.id, j)
  return [...byId.values()]
}

/** The name behind a profile id, or null when it is not one of ours. */
export const nameOf = (id, profiles = []) => profiles.find((p) => p.id === id)?.full_name || null

/**
 * Who the money went to: one of us, or an outside party (a supplier's shop).
 * Returns null for a payment recorded before the field existed.
 */
export function receivedByText(payment, profiles = []) {
  if (payment?.third_party) return `🏪 ${payment.third_party}`
  const name = nameOf(payment?.received_by, profiles)
  return name ? `קיבל: ${name}` : null
}

export const METHODS = { cash: 'מזומן', transfer: 'העברה', bit: 'ביט', check: "צ'ק", other: 'אחר' }
export const CATEGORIES = {
  materials: 'חומרים', fuel: 'דלק', tools: 'כלים', subcontractor: 'קבלן משנה',
  accounting: 'רו״ח', vehicle: 'רכב', other: 'אחר',
}

/** Goods taken on account: the cost is real, the money has not left yet. */
export const isUnpaidExpense = (e) => !!e && !e.paid_at

// Fallback only, for when their own list has not loaded. The real list lives in
// the work_types table, and they add to it themselves from any form.
export const ISSUE_TYPES = ['נזילה', 'סתימה', 'ביוב', 'דוד שמש', 'התקנה', 'שיפוץ', 'תחזוקה', 'התקנת צינור', 'אחר']

/**
 * A project has to be told apart from a private call at a glance, in every
 * list, without reading a word: its own colour, its own icon.
 */
export const PROJECT_LOOK = {
  card: 'bg-indigo-50 border-indigo-200',
  pill: 'bg-indigo-600 text-white',
  text: 'text-indigo-800',
  icon: '🏗️',
}

export const KIND = {
  private: { label: 'עבודה פרטית', plural: 'עבודות פרטיות', newLabel: 'עבודה פרטית חדשה', path: '/jobs?kind=private' },
  project: { label: 'פרויקט',      plural: 'פרויקטים',      newLabel: 'פרויקט חדש',        path: '/jobs?kind=project' },
}

// ── assignee colors ───────────────────────────────────────────────
// Colors are assigned by position in the (name-sorted) profile list, so each
// person keeps the same color everywhere without hard-coding names.
const ASSIGNEE_PALETTE = [
  { bar: 'bg-teal-500',   dot: 'bg-teal-500',   chip: 'bg-teal-100 text-teal-800',   active: 'bg-teal-600 text-white border-teal-600' },
  { bar: 'bg-indigo-500', dot: 'bg-indigo-500', chip: 'bg-indigo-100 text-indigo-800', active: 'bg-indigo-600 text-white border-indigo-600' },
  { bar: 'bg-pink-500',   dot: 'bg-pink-500',   chip: 'bg-pink-100 text-pink-800',   active: 'bg-pink-600 text-white border-pink-600' },
  { bar: 'bg-lime-500',   dot: 'bg-lime-500',   chip: 'bg-lime-100 text-lime-800',   active: 'bg-lime-600 text-white border-lime-600' },
]
const UNASSIGNED = { bar: 'bg-slate-300', dot: 'bg-slate-300', chip: 'bg-slate-100 text-slate-600', active: 'bg-slate-600 text-white border-slate-600' }

export function assigneeColor(id, profiles = []) {
  if (!id) return UNASSIGNED
  const i = profiles.findIndex((p) => p.id === id)
  return i < 0 ? UNASSIGNED : ASSIGNEE_PALETTE[i % ASSIGNEE_PALETTE.length]
}

/**
 * Only real field people can be picked as the person handling a call.
 * The support account (can_be_assigned = false) still appears in colours and
 * names, so a call assigned to it before the flag existed keeps rendering.
 */
export const assignable = (profiles = []) => profiles.filter((p) => p.can_be_assigned !== false)

/** Everyone handling a call. Tolerant of a row that predates the column. */
export const assigneesOf = (job) => (Array.isArray(job?.assignees) ? job.assignees : [])

/**
 * One colour bar per person on the call, so a shared call reads as two
 * colours at a glance in the calendar. Never empty: an unassigned call
 * still gets its grey bar.
 */
export function assigneeBars(job, profiles = []) {
  const ids = assigneesOf(job)
  return ids.length ? ids.map((id) => assigneeColor(id, profiles)) : [UNASSIGNED]
}

/**
 * Who was on a visit: our own people by name, plus whatever was typed in the
 * "another worker" box, which is a name we will never have an account for.
 */
/**
 * The hours everyone put into one visit: each of the brothers who was there for
 * its full length, and the hired hand for his own hours - or for the whole
 * visit, when only his name was written down.
 */
export function visitManHours(v) {
  const len = num(v?.duration_hours)
  const people = Math.max(1, (Array.isArray(v?.assignees) ? v.assignees : []).length)
  const helper = num(v?.helper_hours) > 0 ? num(v.helper_hours) : ((v?.helpers || '').trim() ? len : 0)
  return len * people + helper
}

export function visitWho(visit, profiles = []) {
  const names = (Array.isArray(visit?.assignees) ? visit.assignees : [])
    .map((id) => nameOf(id, profiles)).filter(Boolean)
  const extra = (visit?.helpers || '').trim()
  // the hired hand's own hours, when they were not the whole visit
  const extraHours = num(visit?.helper_hours) > 0 ? ` (${fmtHours(visit.helper_hours)})` : ''
  const all = extra || extraHours ? [...names, `${extra || 'עובד נוסף'}${extraHours}`] : names
  if (!all.length) return 'לא נרשם מי היה'
  return `${all.length > 1 ? '🤝' : '👤'} ${all.join(' + ')}`
}

/** '👤 שמעון', '🤝 שמעון + מאיר', or 'לא שויך'. */
export function assigneeText(job) {
  const names = Array.isArray(job?.assignee_names) ? job.assignee_names.filter(Boolean) : []
  if (!names.length) return 'לא שויך'
  return `${names.length > 1 ? '🤝' : '👤'} ${names.join(' + ')}`
}

// ── phone ─────────────────────────────────────────────────────────
/** Digits only, so 050-123-4567 and 0501234567 compare equal. */
export const normalizePhone = (p) => String(p || '').replace(/\D/g, '')

/**
 * Names compared the way a person would: quotes, dots and double spaces are
 * noise, and case does not matter. "בן לולו" and "בן  לולו " are one man.
 */
export const normalizeName = (s) =>
  String(s || '').replace(/["'\u05f3\u05f4.,]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Customers who might be the one already being typed in.
 *
 * Matching on the phone alone was not enough: a customer saved without a
 * number matches nothing, which is how the same man ended up in the book
 * twice with the same blockage. So a name that is already there counts too,
 * as a softer suggestion - `why` says which it was.
 */
export function findSimilar(customers, { name = '', phone = '' } = {}) {
  const p = normalizePhone(phone)
  const n = normalizeName(name)
  const out = []
  for (const c of customers || []) {
    const why = p.length >= 7 && normalizePhone(c.phone) === p ? 'phone'
      : n.length >= 3 && normalizeName(c.name).includes(n) ? 'name'
      : null
    if (why) out.push({ ...c, why })
  }
  // A phone match is certain, so it is never buried under name guesses.
  const rank = (c) => (c.why === 'phone' ? 0 : 1)
  return out.sort((a, b) => rank(a) - rank(b)).slice(0, 5)
}

/**
 * בהדגמה הטלפונים בדיוניים, ולכן חיוג ווואטסאפ ללקוחות לא יוצאים באמת:
 * הקישור מתחיל ב-#demo- ושכבת ההדגמה (Layout) תופסת אותו ומראה מה היה קורה.
 */
export const telHref = (phone) => `#demo-tel:${String(phone || '').replace(/[^\d+]/g, '')}`

/** Opens the address in Waze, falling back to the browser map if it isn't installed. */
export const wazeHref = (address) => `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`
export const mapsHref = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

// Israeli local numbers (leading 0) become 972-prefixed for wa.me.
/**
 * The message one brother sends the other when he books him a job. Everything
 * he needs while driving - what, for whom, when, where - and a link straight
 * to the call.
 */
export function assignmentMessage(job, origin = '') {
  const d = localDateOf(job.scheduled_at)
  // relativeDay already carries the weekday and day for anything further out
  // than tomorrow, so repeating the date there reads like a stutter.
  const day = d ? (['היום', 'מחר', 'אתמול'].includes(relativeDay(d)) ? `${relativeDay(d)} ${fmtDate(d)}` : relativeDay(d)) : null
  const when = d ? `${day} ${fmtTime(job.scheduled_at)}` : 'עוד לא נקבע מועד'
  return [
    `🔧 עבודה בשבילך: ${job.title}`,
    job.customer_name ? `👤 ${job.customer_name}` : null,
    `📅 ${when}`,
    job.customer_address ? `📍 ${job.customer_address}` : null,
    job.is_urgent ? '🔥 דחוף' : null,
    job.description ? `📝 ${job.description}` : null,
    origin ? `\n${origin}/job/${job.id}` : null,
  ].filter(Boolean).join('\n')
}

/**
 * The money a customer actually owes, which is not always the balance the app
 * shows. Prices are stored net; when the account he pays into is one that
 * issues invoices, VAT rides on top of the price, so what is left to pay is
 * (price + VAT) minus whatever already came in.
 */
export function debtBreakdown(jobs, dest, vatPercent = 18) {
  const list = Array.isArray(jobs) ? jobs : [jobs]
  const net = list.reduce((s, j) => s + num(j.price), 0)
  const paid = list.reduce((s, j) => s + (num(j.price) - num(j.balance)), 0)
  const rate = dest?.adds_vat ? num(vatPercent) / 100 : 0
  const vat = Math.round(net * rate * 100) / 100
  const total = net + vat
  return { net, vat, total, paid, due: total - paid, vatPercent: num(vatPercent) }
}

/** The payment lines of a reminder: Bit, bank, and whatever note was set. */
export function payWith(dest) {
  if (!dest) return []
  const bank = [dest.bank_name, dest.bank_branch && `סניף ${dest.bank_branch}`, dest.bank_account && `חשבון ${dest.bank_account}`]
    .filter(Boolean).join(', ')
  return [
    'לתשלום נוח:',
    dest.bit_phone ? `📱 ביט: ${dest.bit_phone}` : null,
    bank ? `🏦 ${bank}` : null,
    dest.account_name ? `   ע"ש ${dest.account_name}` : null,
    dest.note || null,
  ].filter(Boolean)
}

/**
 * "You still owe me" without the awkwardness: what was done and when, what it
 * cost, what came in, what is left, and how to pay - built from the real rows
 * so nothing has to be remembered or looked up.
 */
export function debtMessage({ customer, jobs, dest, vatPercent = 18, businessName, from }) {
  const list = (Array.isArray(jobs) ? jobs : [jobs]).filter(Boolean)
  const b = debtBreakdown(list, dest, vatPercent)
  const lines = [
    `שלום ${customer?.name || ''},`.trim(),
    businessName ? `תודה שבחרתם ב${businessName} 🙏` : null,
    '',
    list.length === 1 ? 'פירוט העבודה:' : 'פירוט העבודות:',
    ...list.map((j) => {
      const d = localDateOf(j.scheduled_at) || (j.created_at ? localDateOf(j.created_at) : null)
      return `📅 ${d ? fmtDate(d) + ' · ' : ''}${j.title}${list.length > 1 ? ` · ${ILS(num(j.price))}` : ''}`
    }),
    '',
    `💰 סכום העבודה: ${ILS(b.net)}`,
    b.vat > 0 ? `➕ מע"מ ${b.vatPercent}%: ${ILS(b.vat)}` : null,
    b.vat > 0 ? `🧾 סה"כ: ${ILS(b.total)}` : null,
    b.paid > 0 ? `✅ שולם: ${ILS(b.paid)}` : null,
    `🔴 נותר לתשלום: ${ILS(b.due)}`,
    '',
    ...payWith(dest),
    '',
    'תודה רבה,',
    from ? `${from} 🔧` : '🔧',
  ]
  return lines.filter((l) => l !== null).join('\n')
}

export function whatsappHref(phone, text) {
  return `#demo-wa${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

// ── dates ─────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')

/** Date object -> 'YYYY-MM-DD' using LOCAL calendar fields (never UTC). */
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => toISODate(new Date())

/** 'YYYY-MM-DD' -> Date at local midnight. Avoids the UTC parse of new Date('2026-01-01'). */
export const parseISODate = (s) => {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (isoDate, n) => {
  const d = parseISODate(isoDate)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/**
 * Convert a value from <input type="datetime-local"> ('YYYY-MM-DDTHH:mm', which
 * the browser interprets in the user's own timezone) into a UTC ISO string for
 * Postgres. Israel is UTC+2 in winter and UTC+3 under DST; the Date constructor
 * applies whichever offset was in effect on that date, so both are handled.
 */
export function localDateTimeToISO(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** UTC ISO from the DB -> 'YYYY-MM-DDTHH:mm' for a datetime-local input. */
export function isoToLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Local calendar day of a UTC timestamp, as 'YYYY-MM-DD'. */
export const localDateOf = (iso) => (iso ? toISODate(new Date(iso)) : null)

/** [startISO, endISO] spanning a local calendar day, for timestamptz range queries. */
export function dayRangeISO(isoDate) {
  const s = parseISODate(isoDate)
  const e = new Date(s); e.setDate(e.getDate() + 1)
  return [s.toISOString(), e.toISOString()]
}

export function rangeISO(fromDate, toDate) {
  const s = parseISODate(fromDate)
  const e = parseISODate(toDate); e.setDate(e.getDate() + 1)
  return [s.toISOString(), e.toISOString()]
}

// Israeli week: Sunday .. Saturday
export const weekStart = (isoDate) => {
  const d = parseISODate(isoDate)
  d.setDate(d.getDate() - d.getDay())
  return toISODate(d)
}
export const weekEnd = (isoDate) => addDays(weekStart(isoDate), 6)
export const weekDays = (isoDate) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(isoDate), i))

export const monthStart = (d = new Date()) => toISODate(new Date(d.getFullYear(), d.getMonth(), 1))
export const monthEnd = (d = new Date()) => toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0))

export const daysBetween = (isoDateA, isoDateB) =>
  Math.round((parseISODate(isoDateB) - parseISODate(isoDateA)) / 86400000)

// ── display ───────────────────────────────────────────────────────
export const fmtDate = (isoDate) => (isoDate ? parseISODate(String(isoDate).slice(0, 10)).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' }) : '')
export const fmtDayShort = (isoDate) => (isoDate ? parseISODate(isoDate).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' }) : '')
export const fmtDayLong = (isoDate) => (isoDate ? parseISODate(isoDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }) : '')
export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '')
export const fmtDateTime = (iso) => (iso ? `${fmtDate(localDateOf(iso))} · ${fmtTime(iso)}` : '')

export const fmtHours = (h) => {
  const n = num(h)
  if (!n) return ''
  return n % 1 === 0 ? `${n} שע׳` : `${n.toFixed(1)} שע׳`
}

export function greeting(name) {
  const h = new Date().getHours()
  const part = h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב'
  return name ? `${part}, ${name}` : part
}

export const relativeDay = (isoDate) => {
  const diff = daysBetween(today(), isoDate)
  if (diff === 0) return 'היום'
  if (diff === 1) return 'מחר'
  if (diff === -1) return 'אתמול'
  return fmtDayShort(isoDate)
}

// ── Hebrew (Jewish) calendar ──────────────────────────────────────
// Intl gives us the Hebrew date but always in Western digits, so the day and
// year are converted to letters here: 4 בתשרי 5787 -> ד׳ בתשרי תשפ״ז
const GEMATRIA = [
  [400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'],
  [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'],
  [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'],
  [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א'],
]

/** Number to Hebrew letters, with the ט״ו / ט״ז exceptions and the usual punctuation. */
export function gematria(n, { punctuate = true } = {}) {
  let rest = Number(n) || 0
  let out = ''
  while (rest > 0) {
    // 15 and 16 are never written יה / יו, which spell divine names
    if (rest === 15) { out += 'טו'; rest = 0; break }
    if (rest === 16) { out += 'טז'; rest = 0; break }
    const [value, letter] = GEMATRIA.find(([v]) => v <= rest)
    out += letter
    rest -= value
  }
  if (!punctuate || !out) return out
  return out.length === 1 ? `${out}׳` : `${out.slice(0, -1)}״${out.slice(-1)}`
}

// Built once. Constructing a formatter per call cost ~15x more, and the picker
// calls this 42 times per render, which is real lag on a cheap phone.
let HEBREW_FMT
const hebrewParts = (d) => {
  HEBREW_FMT ||= new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
  return HEBREW_FMT.formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {})
}

/** 'YYYY-MM-DD' -> 'ד׳ בתשרי' (add the year with withYear). */
export function hebrewDate(isoDate, { withYear = false } = {}) {
  if (!isoDate) return ''
  try {
    const p = hebrewParts(parseISODate(String(isoDate).slice(0, 10)))
    const day = gematria(parseInt(p.day, 10))
    // Years are written without the 5000: 5787 -> תשפ״ז
    const year = withYear ? ` ${gematria(parseInt(p.year, 10) % 1000)}` : ''
    return `${day} ${p.month.startsWith('ב') ? p.month : 'ב' + p.month}${year}`
  } catch { return '' }
}

/** Just the day letters of the Hebrew date: 'ד׳', 'ט״ו'. */
export function hebrewDayLetters(isoDate) {
  if (!isoDate) return ''
  try { return gematria(parseInt(hebrewParts(parseISODate(String(isoDate).slice(0, 10))).day, 10)) }
  catch { return '' }
}

/** 'תשרי תשפ״ז' for one day. */
export function hebrewMonthYear(isoDate) {
  if (!isoDate) return ''
  try {
    const p = hebrewParts(parseISODate(String(isoDate).slice(0, 10)))
    return `${p.month} ${gematria(parseInt(p.year, 10) % 1000)}`
  } catch { return '' }
}

/**
 * A Gregorian month usually straddles two Hebrew months, so name both:
 * 'אלול–תשרי תשפ״ז'.
 */
export function hebrewSpan(fromISODate, toISODate) {
  const a = hebrewMonthYear(fromISODate)
  const b = hebrewMonthYear(toISODate)
  if (!a) return b
  if (!b || a === b) return a
  // Split on the LAST space: in a leap year the month is 'אדר א׳', two words.
  const cut = (v) => [v.slice(0, v.lastIndexOf(' ')), v.slice(v.lastIndexOf(' ') + 1)]
  const [am, ay] = cut(a)
  const [bm, by] = cut(b)
  return ay === by ? `${am}–${bm} ${by}` : `${a} – ${b}`
}

/** Sunday-first weekday initials, for a calendar grid header. */
export const WEEKDAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

/** The 6x7 grid of ISO dates covering the month that contains isoDate. */
export function monthGrid(isoDate) {
  const d = parseISODate(isoDate)
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const start = new Date(first)
  start.setDate(start.getDate() - start.getDay())      // back to Sunday
  return Array.from({ length: 42 }, (_, i) => {
    const c = new Date(start)
    c.setDate(c.getDate() + i)
    return { date: toISODate(c), inMonth: c.getMonth() === d.getMonth() }
  })
}

export const shiftMonthISO = (isoDate, n) => {
  const d = parseISODate(isoDate)
  return toISODate(new Date(d.getFullYear(), d.getMonth() + n, 1))
}

export const fmtMonthYear = (isoDate) =>
  isoDate ? parseISODate(isoDate).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' }) : ''

/** Split 'YYYY-MM-DDTHH:mm' into its date and time halves. */
export const splitLocalInput = (v) => {
  const [date = '', time = ''] = String(v || '').split('T')
  return { date, time: time.slice(0, 5) }
}
