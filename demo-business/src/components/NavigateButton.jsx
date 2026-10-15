import { wazeHref } from '../lib/format'

/** Opens the address in Waze. They drive to every job, so this gets daily use. */
export default function NavigateButton({ address, size = 'lg', className = '' }) {
  if (!address) return null
  const box = size === 'sm' ? 'min-h-11 min-w-11 text-lg' : 'min-h-12 px-4 text-base gap-1'
  return (
    <a href={wazeHref(address)} target="_blank" rel="noopener noreferrer"
       onClick={(e) => e.stopPropagation()} aria-label="ניווט"
       className={`inline-flex items-center justify-center rounded-xl bg-sky-600 text-white font-bold shrink-0 ${box} ${className}`}>
      🧭{size !== 'sm' && <span>ניווט</span>}
    </a>
  )
}
