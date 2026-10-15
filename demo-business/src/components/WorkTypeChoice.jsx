import { useState } from 'react'
import { db } from '../lib/data'
import { ISSUE_TYPES } from '../lib/format'
import { Button, Input } from './ui'

/**
 * "סוג העבודה" - their own list, not ours. The last chip opens a field, and
 * whatever they type is saved to the list, so next time it is a chip too.
 */
export default function WorkTypeChoice({ types, value, onChange, onAdded }) {
  const list = types?.length ? types.map((t) => t.label) : ISSUE_TYPES
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function add() {
    const label = text.trim()
    if (!label) return
    setBusy(true)
    try {
      if (!list.includes(label)) {
        await db.addWorkType(label, (types?.length || 0) + 1)
        onAdded?.()
      }
      onChange(label)
      setText(''); setAdding(false)
    } finally { setBusy(false) }
  }

  // a value typed before the list existed still shows as chosen
  const shown = value && !list.includes(value) ? [...list, value] : list

  return (
    <div>
      <div className="grid gap-2 grid-cols-3">
        {shown.map((t) => (
          <button key={t} type="button" onClick={() => onChange(t === value ? '' : t)}
            className={`min-h-12 rounded-xl px-2 text-sm font-bold border-2 transition active:scale-[0.97] ${
              t === value ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200 text-slate-700'}`}>
            {t}
          </button>
        ))}
        {!adding && (
          <button type="button" onClick={() => setAdding(true)}
            className="min-h-12 rounded-xl px-2 text-sm font-bold border-2 border-dashed border-slate-300 text-slate-500 active:scale-[0.97]">
            ＋ הוספה
          </button>
        )}
      </div>
      {adding && (
        <div className="mt-2 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="למשל: התקנת מונובלוק" autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
          <Button type="button" size="md" onClick={add} disabled={busy || !text.trim()}>הוסף</Button>
          <Button type="button" size="md" variant="ghost" onClick={() => { setAdding(false); setText('') }}>ביטול</Button>
        </div>
      )}
    </div>
  )
}
