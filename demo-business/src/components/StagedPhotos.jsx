import { useEffect, useRef } from 'react'

/**
 * Photos chosen before the job exists.
 *
 * A job id is needed to upload, and there is none until the form is saved, so
 * the files are held in memory here and uploaded by the caller the moment the
 * job is created. That way the plumber can photograph the leak the second he
 * walks in, instead of saving a call, finding it again and only then shooting.
 */
export default function StagedPhotos({ files, onChange, disabled = false }) {
  const camera = useRef(null)
  const gallery = useRef(null)
  const urls = useRef(new Map())

  // Object URLs are per-file and must be released, or a long session leaks
  // every photo ever previewed.
  const urlFor = (item) => {
    if (!urls.current.has(item.id)) urls.current.set(item.id, URL.createObjectURL(item.file))
    return urls.current.get(item.id)
  }
  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); urls.current.clear() }, [])

  const add = (list) => {
    const picked = Array.from(list || [])
    if (!picked.length) return
    onChange([...files, ...picked.map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file }))])
  }

  const drop = (id) => {
    const u = urls.current.get(id)
    if (u) { URL.revokeObjectURL(u); urls.current.delete(id) }
    onChange(files.filter((f) => f.id !== id))
  }

  return (
    <div>
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {files.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
              <img src={urlFor(item)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => drop(item.id)} aria-label="הסרת תמונה" disabled={disabled}
                className="absolute top-1 left-1 h-8 w-8 rounded-full bg-black/60 text-white text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => camera.current?.click()} disabled={disabled}
          className="min-h-14 rounded-2xl border-2 border-slate-200 bg-white font-bold text-lg disabled:opacity-50">
          📷 צילום
        </button>
        <button type="button" onClick={() => gallery.current?.click()} disabled={disabled}
          className="min-h-14 rounded-2xl border-2 border-slate-200 bg-white font-bold text-lg disabled:opacity-50">
          🖼 מהגלריה
        </button>
      </div>

      <input ref={camera} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      <input ref={gallery} type="file" accept="image/*" multiple hidden
        onChange={(e) => { add(e.target.files); e.target.value = '' }} />
    </div>
  )
}
