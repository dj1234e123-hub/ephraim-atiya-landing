import { telHref, whatsappHref } from '../lib/format'

/**
 * Call + WhatsApp buttons. Used anywhere a phone number is shown.
 * size "sm" fits inside list rows; "lg" is for detail screens.
 */
export default function PhoneActions({ phone, text, size = 'lg', className = '' }) {
  if (!phone) return null
  const stop = (e) => e.stopPropagation()
  const box = size === 'sm'
    ? 'min-h-11 min-w-11 text-lg'
    : 'min-h-12 px-4 text-base gap-1'
  const label = size !== 'sm'
  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`} onClick={stop}>
      <a href={telHref(phone)} onClick={stop} aria-label="חיוג"
         className={`flex items-center justify-center rounded-xl bg-emerald-600 text-white font-bold ${box}`}>
        📞{label && <span>חיוג</span>}
      </a>
      <a href={whatsappHref(phone, text)} target="_blank" rel="noopener noreferrer" onClick={stop} aria-label="וואטסאפ"
         className={`flex items-center justify-center rounded-xl bg-[#25D366] text-white font-bold ${box}`}>
        💬{label && <span>וואטסאפ</span>}
      </a>
    </div>
  )
}
