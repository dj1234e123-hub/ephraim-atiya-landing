import { getState, mutate, uid, nowISO } from './store'
import { ME_ID } from './demo'

/**
 * תמונות לפני ואחרי, בגרסת ההדגמה.
 * במערכת האמיתית הקבצים נשמרים ב-Supabase Storage בדלי פרטי ומוצגים דרך קישורים
 * חתומים. כאן התמונה מוקטנת בדפדפן ונשמרת כטקסט (data URL) יחד עם שאר הנתונים,
 * קטנה מספיק כדי ש-localStorage יחזיק אותה. התמונות שבזרע מצוירות בקוד (SVG).
 */
const MAX_EDGE = 480
const QUALITY = 0.72
const DECODE_TIMEOUT = 20000
export const URL_TTL = 3600

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    let done = false
    const finish = (fn, arg) => {
      if (done) return
      done = true
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      fn(arg)
    }
    const timer = setTimeout(() => finish(reject, new Error('עיבוד התמונה נתקע. נסו שוב או בחרו תמונה אחרת.')), DECODE_TIMEOUT)
    img.onerror = () => finish(reject, new Error('לא הצלחנו לקרוא את התמונה. נסו לצלם שוב.'))
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('הזיכרון בטלפון נגמר. סגרו אפליקציות ונסו שוב.')
        ctx.drawImage(img, 0, 0, w, h)
        finish(resolve, canvas.toDataURL('image/jpeg', QUALITY))
      } catch (e) { finish(reject, e) }
    }
    img.src = url
  })
}

const TONES = {
  rust: { bg: '#5b4636', fg: '#f3e9dc', accent: '#b5651d' },
  new: { bg: '#1f3a4a', fg: '#e8f6f7', accent: '#4fc3c8' },
}

/** "צילום" מצויר: רקע, כמה צינורות, והכיתוב. מספיק כדי להראות איפה התמונות נכנסות. */
function svgPhoto(label, tone = 'new') {
  const t = TONES[tone] || TONES.new
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480">
<rect width="480" height="480" fill="${t.bg}"/>
<rect x="40" y="90" width="400" height="34" rx="17" fill="${t.accent}" opacity=".85"/>
<rect x="300" y="90" width="34" height="260" rx="17" fill="${t.accent}" opacity=".85"/>
<circle cx="317" cy="107" r="30" fill="${t.accent}"/>
<rect x="60" y="300" width="220" height="26" rx="13" fill="${t.fg}" opacity=".25"/>
<text x="240" y="420" text-anchor="middle" font-family="Heebo, Arial, sans-serif" font-size="26" font-weight="700" fill="${t.fg}" direction="rtl">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
<text x="240" y="455" text-anchor="middle" font-family="Heebo, Arial, sans-serif" font-size="16" fill="${t.fg}" opacity=".7">הדגמה · תמונה מצוירת</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const rowsOf = () => getState().job_photos || []

export const photos = {
  ofJob: (jobId) => Promise.resolve(rowsOf().filter((p) => p.job_id === jobId).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((p) => ({ ...p }))),
  ofVisit: (visitId) => Promise.resolve(rowsOf().filter((p) => p.visit_id === visitId).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((p) => ({ ...p }))),

  async upload(jobId, phase, file, visitId = null) {
    const data = await compressImage(file)
    const path = `${jobId}/${phase}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    return mutate((s) => {
      const row = { id: uid(), workspace_id: s.workspace.id, job_id: jobId, visit_id: visitId, path, phase, note: null, created_at: nowISO(), created_by: ME_ID, data, label: null, tone: null }
      s.job_photos.push(row)
      return { ...row }
    })
  },

  async remove(row) {
    mutate((s) => { s.job_photos = s.job_photos.filter((p) => p.id !== row.id) })
  },

  async signedUrls(paths) {
    if (!paths.length) return {}
    const out = {}
    for (const p of rowsOf()) {
      if (!paths.includes(p.path)) continue
      out[p.path] = p.data || (p.label ? svgPhoto(p.label, p.tone) : null)
    }
    return Object.fromEntries(Object.entries(out).filter(([, v]) => v))
  },
}
