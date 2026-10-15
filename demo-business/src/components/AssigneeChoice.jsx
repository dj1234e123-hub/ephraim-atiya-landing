import { assignable, assigneeColor } from '../lib/format'

/**
 * Who is handling a call. More than one person can be on it - the brothers
 * often take a job together, and then it has to show up in both calendars.
 *
 * Tapping a name adds or removes that person, so the choice never needs
 * explaining; the last chip picks everyone at once, which is the common case
 * in a two-man business. That chip only ever adds - clearing a call is what
 * "לא שויך" is for, so a second tap can never wipe an assignment by mistake.
 */
export default function AssigneeChoice({ profiles = [], value = [], onChange }) {
  const people = assignable(profiles)
  const ids = Array.isArray(value) ? value : []
  const picked = (id) => ids.includes(id)
  const allIds = people.map((p) => p.id)
  const everyone = people.length > 1 && allIds.every((id) => picked(id))

  const toggle = (id) => onChange(picked(id) ? ids.filter((x) => x !== id) : [...ids, id])

  const chip = (key, label, active, cls, onClick) => (
    <button key={key} type="button" onClick={onClick}
      className={`min-h-12 rounded-xl px-2 text-base font-bold border-2 transition active:scale-[0.97] ${
        active ? (cls || 'bg-brand text-white border-brand') : 'bg-white border-slate-200 text-slate-700'}`}>
      {label}
    </button>
  )

  return (
    <div className="grid gap-2 grid-cols-2">
      {chip('none', 'לא שויך', ids.length === 0, 'bg-slate-600 text-white border-slate-600', () => onChange([]))}
      {people.map((p) =>
        chip(p.id, p.full_name, picked(p.id), assigneeColor(p.id, profiles).active, () => toggle(p.id)))}
      {people.length > 1 &&
        chip('all', people.length === 2 ? '🤝 שנינו' : '🤝 כולם', everyone,
          'bg-brand text-white border-brand', () => onChange(allIds))}
    </div>
  )
}
