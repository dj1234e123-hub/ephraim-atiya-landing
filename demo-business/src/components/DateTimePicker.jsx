import { useMemo, useState } from 'react'
import {
  today, toISODate, parseISODate, monthGrid, shiftMonthISO, fmtMonthYear,
  fmtDayLong, hebrewDate, hebrewDayLetters, hebrewSpan, splitLocalInput,
  WEEKDAY_LETTERS,
} from '../lib/format'
import { StepNav } from './ui'

const QUICK_TIMES = ['07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00']

/**
 * Date and time picker that shows the Hebrew date alongside the Gregorian one.
 * The native <input type="datetime-local"> can only ever render the Gregorian
 * calendar, so the grid is drawn here instead.
 *
 * value / onChange use the same 'YYYY-MM-DDTHH:mm' local string the native
 * input produced, so callers keep passing it through localDateTimeToISO.
 */
export default function DateTimePicker({ value, onChange, withTime = true }) {
  const { date: selected, time } = splitLocalInput(value)
  const [cursor, setCursor] = useState(() => (selected ? shiftMonthISO(selected, 0) : shiftMonthISO(today(), 0)))
  const t = today()

  const grid = useMemo(() => monthGrid(cursor), [cursor])
  const monthFrom = grid.find((c) => c.inMonth)?.date
  const monthTo = [...grid].reverse().find((c) => c.inMonth)?.date

  const emit = (d, tm) => onChange(withTime ? `${d}T${tm || time || '09:00'}` : d)

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-3">
      {/* what is currently chosen, in both calendars */}
      <div className="text-center pb-3 mb-3 border-b border-slate-100">
        {selected ? (
          <>
            <div className="font-extrabold">{fmtDayLong(selected)}</div>
            <div className="text-accent font-bold">{hebrewDate(selected, { withYear: true })}</div>
          </>
        ) : (
          <div className="text-slate-400 font-bold">עוד לא נבחר תאריך</div>
        )}
      </div>

      <StepNav
        onNext={() => setCursor(shiftMonthISO(cursor, 1))}
        onPrev={() => setCursor(shiftMonthISO(cursor, -1))}
        nextLabel="חודש הבא" prevLabel="חודש שעבר">
        <div className="font-extrabold">{fmtMonthYear(cursor)}</div>
        <div className="text-xs font-bold text-slate-500">{hebrewSpan(monthFrom, monthTo)}</div>
      </StepNav>

      <div className="grid grid-cols-7 gap-1 mt-3 text-center text-xs font-bold text-slate-400">
        {WEEKDAY_LETTERS.map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 mt-1">
        {grid.map(({ date, inMonth }) => {
          const isSel = date === selected
          const isToday = date === t
          return (
            <button key={date} type="button" onClick={() => emit(date)}
              className={[
                'rounded-lg py-1.5 leading-tight transition',
                isSel ? 'bg-accent text-white' : isToday ? 'bg-accent/10 text-accent' : inMonth ? 'bg-white text-slate-800' : 'bg-white text-slate-300',
                isToday && !isSel ? 'ring-2 ring-accent' : '',
              ].join(' ')}>
              <span className="block text-base font-extrabold">{parseISODate(date).getDate()}</span>
              <span className={`block text-[10px] font-bold ${isSel ? 'text-white/80' : 'text-slate-400'}`}>
                {hebrewDayLetters(date)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-2 mt-3">
        <button type="button" onClick={() => { setCursor(shiftMonthISO(t, 0)); emit(t) }}
          className="flex-1 min-h-11 rounded-xl bg-slate-100 font-bold">היום</button>
        <button type="button" onClick={() => { const d = toISODate(new Date(Date.now() + 864e5)); setCursor(shiftMonthISO(d, 0)); emit(d) }}
          className="flex-1 min-h-11 rounded-xl bg-slate-100 font-bold">מחר</button>
      </div>

      {withTime && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-sm font-bold text-slate-600 mb-2">שעה</div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_TIMES.map((q) => (
              <button key={q} type="button" onClick={() => emit(selected || t, q)}
                className={`min-h-11 rounded-xl border-2 font-bold tabular-nums ${time === q ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200'}`}>
                {q}
              </button>
            ))}
          </div>
          <input type="time" value={time} onChange={(e) => emit(selected || t, e.target.value)}
            className="w-full min-h-12 rounded-2xl border-2 border-slate-200 bg-white px-4 text-lg mt-2 tabular-nums" />
        </div>
      )}
    </div>
  )
}
