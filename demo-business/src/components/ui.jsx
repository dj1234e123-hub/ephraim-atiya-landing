import { Link } from 'react-router-dom'

const base = 'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 select-none'
const variants = {
  primary: 'bg-accent text-white hover:bg-accent-dark shadow-sm',
  brand: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
  secondary: 'bg-white text-brand border-2 border-slate-200 hover:border-slate-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-50 text-red-700 border-2 border-red-200',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
}
const sizes = { md: 'min-h-12 px-4 text-base', lg: 'min-h-14 px-5 text-lg', xl: 'min-h-20 px-5 text-xl' }

export function Button({ variant = 'primary', size = 'lg', className = '', to, ...props }) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  if (to) return <Link to={to} className={cls} {...props} />
  return <button type="button" className={cls} {...props} />
}

export function Card({ className = '', children, to, onClick }) {
  const cls = `block bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${to || onClick ? 'active:bg-slate-50' : ''} ${className}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={`${cls} w-full text-right`}>{children}</button>
  return <div className={cls}>{children}</div>
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-600 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  )
}

const inputCls = 'w-full min-h-14 rounded-2xl border-2 border-slate-200 bg-white px-4 text-lg focus:border-accent focus:outline-none'
export function Input(props) { return <input className={inputCls} {...props} /> }
export function Textarea(props) { return <textarea className={`${inputCls} py-3 min-h-24`} rows={3} {...props} /> }
export function Select({ children, ...props }) {
  return <select className={`${inputCls} appearance-none`} {...props}>{children}</select>
}

// row of big toggle buttons (status, category, method...)
export function Choice({ options, value, onChange, activeCls, cols }) {
  return (
    <div className={`grid gap-2 ${cols || 'grid-cols-3'}`}>
      {options.map(([key, label, cls]) => {
        const active = value === key
        return (
          <button key={key} type="button" onClick={() => onChange(key)}
            className={`min-h-12 rounded-xl px-2 text-base font-bold border-2 transition active:scale-[0.97] ${active ? (cls || activeCls || 'bg-brand text-white border-brand') : 'bg-white border-slate-200 text-slate-700'}`}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function Pill({ children, cls = 'bg-slate-100 text-slate-700' }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${cls}`}>{children}</span>
}

export function Stat({ label, value, sub, cls = '', to }) {
  const inner = (
    <>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className={`text-2xl font-extrabold mt-1 ${cls}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </>
  )
  return <Card to={to} className="p-4">{inner}</Card>
}

export function Empty({ children }) {
  return <div className="text-center text-slate-400 py-10 text-lg">{children}</div>
}

export function Loading() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-accent animate-spin" />
    </div>
  )
}

export function ErrorBox({ error }) {
  if (!error) return null
  return <div className="rounded-2xl bg-red-50 border-2 border-red-200 text-red-800 p-3 text-sm">{error.message || String(error)}</div>
}

export function PageTitle({ children, back, action }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {back && <Link to={back} className="min-h-12 min-w-12 flex items-center justify-center rounded-xl bg-white border-2 border-slate-200 text-2xl">‹</Link>}
      <h1 className="text-2xl font-extrabold flex-1">{children}</h1>
      {action}
    </div>
  )
}

export function Section({ title, children, action }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-extrabold text-slate-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// bottom-sheet style dialog
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-10 min-w-10 rounded-full bg-slate-100 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Progress({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Big on/off switch, used for the "urgent" flag. */
export function Toggle({ checked, onChange, label, hint, onCls = 'bg-red-600 border-red-600 text-white' }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked}
      className={`w-full min-h-14 rounded-2xl border-2 px-4 flex items-center justify-between font-bold transition active:scale-[0.98] ${checked ? onCls : 'bg-white border-slate-200 text-slate-700'}`}>
      <span className="flex flex-col items-start leading-tight">
        <span>{label}</span>
        {hint && <span className={`text-xs font-medium ${checked ? 'text-white/80' : 'text-slate-400'}`}>{hint}</span>}
      </span>
      <span data-track className={`h-7 w-12 rounded-full p-1 flex items-center transition ${checked ? 'bg-white/30 justify-end' : 'bg-slate-200 justify-start'}`}>
        <span data-knob className="block h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </button>
  )
}

/** Prominent bordered panel used for the date / price blocks on a job. */
export function Block({ icon, title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border-2 border-slate-200 bg-white p-4 ${className}`}>
      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-2">
        <span className="text-lg">{icon}</span><span>{title}</span>
      </div>
      {children}
    </div>
  )
}

export function UrgentTag({ className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-2.5 py-1 text-xs font-extrabold ${className}`}>🔥 דחוף</span>
}

/**
 * Previous / next stepper, laid out the Hebrew way: moving forward in time goes
 * LEFT, the direction the language reads, so "next" sits on the left and
 * "previous" on the right.
 *
 * In RTL the FIRST child lands on the right, which is why "previous" is
 * declared first. The chevron is drawn as SVG rather than using ‹ ›, because
 * those characters are bidi-mirrored: in a Hebrew page the browser flips them
 * and the arrow ends up pointing the opposite way from the source.
 */
export function StepNav({ onPrev, onNext, nextDisabled = false, prevLabel = 'הקודם', nextLabel = 'הבא', children }) {
  const chevron = (dir) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={dir === 'right' ? '9 6 15 12 9 18' : '15 6 9 12 15 18'} />
    </svg>
  )
  const box = 'min-h-14 min-w-14 px-2 rounded-2xl bg-white border-2 border-slate-200 flex flex-col items-center justify-center gap-0.5 disabled:opacity-30'
  return (
    <div className="flex items-center justify-between gap-2">
      {/* first in the DOM, therefore on the RIGHT in an RTL layout */}
      <button type="button" onClick={onPrev} aria-label={prevLabel} className={box}>
        {chevron('right')}
        <span className="text-[10px] font-bold text-slate-500">{prevLabel}</span>
      </button>
      <div className="text-center leading-tight flex-1 min-w-0">{children}</div>
      <button type="button" onClick={onNext} disabled={nextDisabled} aria-label={nextLabel} className={box}>
        {chevron('left')}
        <span className="text-[10px] font-bold text-slate-500">{nextLabel}</span>
      </button>
    </div>
  )
}
