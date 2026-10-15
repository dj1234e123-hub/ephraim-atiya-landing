import { useCallback, useEffect, useRef, useState } from 'react'
import { photos, URL_TTL } from '../lib/photos'
import { ErrorBox, Empty, Loading } from './ui'

const PHASES = [
  { key: 'before', label: 'לפני', hint: 'איך זה נראה כשהגענו' },
  { key: 'after', label: 'אחרי', hint: 'איך זה נראה כשסיימנו' },
]
// Re-sign well before the hour is up, so a page left open on the toolbox
// never ends up showing broken thumbnails or a black full-screen view.
const RESIGN_AFTER = (URL_TTL - 600) * 1000

/**
 * Before / after photos for a job. Settles arguments about what was already
 * broken when we arrived, and shows the customer what they paid for.
 */
export default function JobPhotos({ jobId }) {
  const [rows, setRows] = useState([])
  const [urls, setUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)      // phase currently uploading
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(null)
  const signedAt = useRef(0)
  const camera = { before: useRef(null), after: useRef(null) }
  const gallery = { before: useRef(null), after: useRef(null) }

  const load = useCallback(async () => {
    try {
      const list = await photos.ofJob(jobId)
      setRows(list)
      setUrls(await photos.signedUrls(list.map((r) => r.path)))
      signedAt.current = Date.now()
      setError(null)
    } catch (e) { setError(e) } finally { setLoading(false) }
  }, [jobId])

  useEffect(() => { setLoading(true); load() }, [load])

  // Signed links expire. Refresh them on a timer and whenever the phone
  // comes back to the app.
  useEffect(() => {
    const refresh = () => { if (Date.now() - signedAt.current > RESIGN_AFTER) load() }
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    const timer = setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [load])

  async function pick(phase, fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setBusy(phase); setError(null)
    try {
      for (const f of files) await photos.upload(jobId, phase, f)
      await load()
    } catch (e) { setError(e) } finally { setBusy(null) }
  }

  async function drop(row) {
    if (!confirm('למחוק את התמונה?')) return
    try { await photos.remove(row); await load() } catch (e) { setError(e) }
  }

  // Opening a photo on a link that is about to expire would show a black
  // screen, so re-sign first when the links are old.
  async function open(row) {
    if (Date.now() - signedAt.current > RESIGN_AFTER) await load()
    setZoom(urls[row.path] || null)
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      <ErrorBox error={error} />

      {PHASES.map(({ key, label, hint }) => {
        const mine = rows.filter((r) => r.phase === key)
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-extrabold">{label}</span>
                <span className="text-xs text-slate-400 mr-2">{hint}</span>
              </div>
              <span className="text-sm text-slate-400">{mine.length || ''}</span>
            </div>

            {mine.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {mine.map((r) => (
                  <div key={r.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <button type="button" onClick={() => open(r)} className="w-full h-full">
                      {urls[r.path]
                        ? <img src={urls[r.path]} alt={label} loading="lazy" className="w-full h-full object-cover" />
                        : <span className="text-xs text-slate-400">התמונה לא נטענה</span>}
                    </button>
                    <button type="button" onClick={() => drop(r)} aria-label="מחיקת תמונה"
                      className="absolute top-1 left-1 h-8 w-8 rounded-full bg-black/60 text-white text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Two entry points on purpose: `capture` opens the camera directly
                but hides the gallery, which would block attaching photos taken
                before the app was opened. */}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => camera[key].current?.click()} disabled={busy === key}
                className="min-h-12 rounded-xl border-2 border-slate-200 bg-white font-bold disabled:opacity-50">
                {busy === key ? '⏳ מעלה…' : '📷 צילום'}
              </button>
              <button type="button" onClick={() => gallery[key].current?.click()} disabled={busy === key}
                className="min-h-12 rounded-xl border-2 border-slate-200 bg-white font-bold disabled:opacity-50">
                🖼 מהגלריה
              </button>
            </div>

            <input ref={camera[key]} type="file" accept="image/*" capture="environment" hidden
              onChange={(e) => { pick(key, e.target.files); e.target.value = '' }} />
            <input ref={gallery[key]} type="file" accept="image/*" multiple hidden
              onChange={(e) => { pick(key, e.target.files); e.target.value = '' }} />
          </div>
        )
      })}

      {rows.length === 0 && <Empty>אין עדיין תמונות לעבודה הזו</Empty>}

      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-h-full max-w-full object-contain rounded-xl" />
          <button type="button" onClick={() => setZoom(null)}
            className="absolute top-4 left-4 h-11 w-11 rounded-full bg-white/20 text-white text-xl">✕</button>
        </div>
      )}
    </div>
  )
}
