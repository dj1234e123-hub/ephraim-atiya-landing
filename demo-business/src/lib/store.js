import { STORAGE_KEY } from './demo'
import { buildSeed } from './seed'
import { today } from './format'

/**
 * "מסד הנתונים" של ההדגמה: אובייקט אחד בזיכרון, שנשמר ב-localStorage אחרי כל
 * שינוי. הזרע נבנה מחדש בכל יום חדש, כדי שהתאריכים בהדגמה תמיד יהיו סביב היום.
 */
let state = null

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.version === 1 && s.seededOn === today()) return s
    }
  } catch { /* אין localStorage: מתחילים מהזרע */ }
  return buildSeed()
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* best effort */ }
}

export function getState() {
  if (!state) state = load()
  return state
}

/** שינוי במסד: הפונקציה מקבלת את המצב ומשנה אותו במקום, ואז הכול נשמר. */
export function mutate(fn) {
  const s = getState()
  const out = fn(s)
  persist()
  return out
}

export function resetStore() {
  state = buildSeed()
  persist()
  return state
}

export const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export const nowISO = () => new Date().toISOString()
