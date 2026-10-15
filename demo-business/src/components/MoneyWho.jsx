import { assignable } from '../lib/format'
import { Input } from './ui'

/**
 * Who got the money, or who laid it out.
 *
 * At month end the brothers split what came in, so a payment has to say whose
 * pocket it landed in - and that is never "whoever typed it in", because one
 * of them collects in the field and the other enters the day in the evening.
 *
 * `value` is { received_by, third_party } for a payment, or { received_by }
 * alone for an expense (nobody hands an expense to a shop on our behalf).
 * The person signed in is offered first, since he is usually the one holding
 * the money.
 */
export default function MoneyWho({
  profiles = [], me = null, value, onChange,
  allowThirdParty = false, allowNone = false,
  noneLabel = '⏳ עוד לא שילם',
}) {
  const people = assignable(profiles)
  const ordered = [...people].sort((a, b) => (b.id === me) - (a.id === me))
  const isThird = value?.third_party != null
  const isNone = !isThird && !value?.received_by

  const chip = (key, label, active, cls, onClick) => (
    <button key={key} type="button" onClick={onClick}
      className={`min-h-12 rounded-xl px-2 text-base font-bold border-2 transition active:scale-[0.97] ${
        active ? cls : 'bg-white border-slate-200 text-slate-700'}`}>
      {label}
    </button>
  )

  return (
    <div>
      <div className="grid gap-2 grid-cols-2">
        {ordered.map((p) => chip(
          p.id, p.id === me ? `${p.full_name} (אני)` : p.full_name,
          value?.received_by === p.id, 'bg-emerald-600 text-white border-emerald-600',
          () => onChange({ received_by: p.id, third_party: null })))}

        {allowThirdParty && chip('third', '🏪 צד שלישי', isThird,
          'bg-indigo-600 text-white border-indigo-600',
          () => onChange({ received_by: null, third_party: value?.third_party || '' }))}

        {allowNone && chip('none', noneLabel, isNone,
          'bg-amber-500 text-white border-amber-500',
          () => onChange({ received_by: null, third_party: null }))}
      </div>

      {isThird && (
        <div className="mt-2">
          <Input value={value.third_party} placeholder="למי הועבר? (שם החנות או הספק)"
            onChange={(e) => onChange({ received_by: null, third_party: e.target.value })} />
        </div>
      )}
    </div>
  )
}
