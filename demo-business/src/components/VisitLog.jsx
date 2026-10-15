import { useCallback, useEffect, useState } from 'react'
import { db } from '../lib/data'
import { photos } from '../lib/photos'
import { ILS, PROJECT_LOOK, fmtDate, fmtHours, hebrewDate, isPerVisit, num, today, visitManHours, visitWho } from '../lib/format'
import { Button, Card, Empty, ErrorBox, Field, Input, Loading, Textarea } from './ui'
import AssigneeChoice from './AssigneeChoice'
import StagedPhotos from './StagedPhotos'
import WorkTypeChoice from './WorkTypeChoice'

const HOUR_CHIPS = [0.5, 1, 2, 3, 4, 6, 8, 10]

const blank = () => ({
  visited_on: today(), duration_hours: '', work_done: '', work_type: '',
  assignees: [], helpers: '', helper_hours: '', price: '',
})

/**
 * The running log of a project.
 *
 * Elisha's words: a project is not a call where you came, fixed it and went
 * home. He goes back to Nof Zion week after week, a stage at a time, and what
 * he wants when he opens it is when he was there, what he did, how long it
 * took and who was with him. That last one is not always one of the brothers,
 * so there is a box for a hired hand by name.
 */
export default function VisitLog({ job, profiles = [], me = null, onChanged }) {
  const [rows, setRows] = useState([])
  const [pics, setPics] = useState({})      // visit id -> photo rows
  const [urls, setUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // 'new' | visit id
  const [error, setError] = useState(null)
  const [workTypes, setWorkTypes] = useState([])
  const perVisit = isPerVisit(job)
  const loadTypes = useCallback(() => db.workTypes().then(setWorkTypes).catch(() => {}), [])
  useEffect(() => { loadTypes() }, [loadTypes])

  const load = useCallback(async () => {
    try {
      const list = await db.visitsOfJob(job.id)
      setRows(list)
      const all = await photos.ofJob(job.id)
      const mine = all.filter((p) => p.visit_id)
      const byVisit = {}
      for (const p of mine) (byVisit[p.visit_id] ||= []).push(p)
      setPics(byVisit)
      setUrls(await photos.signedUrls(mine.map((p) => p.path)))
      setError(null)
    } catch (e) { setError(e) } finally { setLoading(false) }
  }, [job.id])

  useEffect(() => { setLoading(true); load() }, [load])

  const refresh = async () => { await load(); onChanged?.() }

  async function remove(v) {
    if (!confirm(`למחוק את הביקור מ־${fmtDate(v.visited_on)}? אפשר לשחזר מסל המיחזור.`)) return
    try { await db.deleteVisit(v.id, me); await refresh() } catch (e) { setError(e) }
  }

  if (loading) return <Loading />

  const hours = rows.reduce((s, v) => s + num(v.duration_hours), 0)
  const sum = rows.reduce((s, v) => s + num(v.price), 0)
  // Everyone who was there counts for the length of the visit, and the hired
  // hand for his own hours - the real time the project cost, for pricing the next.
  const manHours = rows.reduce((s, v) => s + visitManHours(v), 0)

  return (
    <div>
      <ErrorBox error={error} />

      {rows.length > 0 && (
        <Card className={`mb-3 border-2 ${PROJECT_LOOK.card}`}>
          <div className={`grid text-center ${perVisit ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <div>
              <div className="text-xs text-slate-500">ביקורים</div>
              <div className="text-xl font-extrabold">{rows.length}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">שעות בשטח</div>
              <div className="text-xl font-extrabold">{hours > 0 ? fmtHours(hours) : '–'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">שעות אדם</div>
              <div className={`text-xl font-extrabold ${PROJECT_LOOK.text}`}>{manHours > 0 ? fmtHours(manHours) : '–'}</div>
            </div>
            {perVisit && (
              <div>
                <div className="text-xs text-slate-500">סה"כ מחיר</div>
                <div className="text-xl font-extrabold text-emerald-700">{ILS(sum)}</div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            שעות אדם = אורך הביקור כפול מספר האנשים, ועוד השעות של עובד נוסף. זה הזמן שהפרויקט באמת עלה לכם.
          </p>
        </Card>
      )}

      {editing === 'new' ? (
        <VisitForm job={job} profiles={profiles} me={me} perVisit={perVisit}
          workTypes={workTypes} onTypesChanged={loadTypes}
          onDone={async () => { setEditing(null); await refresh() }}
          onCancel={() => setEditing(null)} />
      ) : (
        <Button size="lg" className="w-full" onClick={() => setEditing('new')}>＋ ביקור חדש</Button>
      )}

      <div className="mt-3 space-y-2">
        {rows.length === 0 && editing !== 'new' && (
          <Empty>עוד לא נרשמו ביקורים. כל פעם שתצאו משם, רשמו מה נעשה.</Empty>
        )}

        {rows.map((v) => editing === v.id ? (
          <VisitForm key={v.id} job={job} visit={v} profiles={profiles} me={me} perVisit={perVisit}
            workTypes={workTypes} onTypesChanged={loadTypes}
            existing={pics[v.id] || []} urls={urls}
            onDone={async () => { setEditing(null); await refresh() }}
            onCancel={() => setEditing(null)} />
        ) : (
          <Card key={v.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-extrabold text-lg">
                  {fmtDate(v.visited_on)}{v.work_type ? <span className={PROJECT_LOOK.text}> · {v.work_type}</span> : null}
                </div>
                <div className="text-accent font-bold text-sm">{hebrewDate(v.visited_on)}</div>
              </div>
              <div className="text-left shrink-0">
                {num(v.duration_hours) > 0 && (
                  <div className="font-bold text-slate-700">⏱ {fmtHours(v.duration_hours)}</div>
                )}
                {perVisit && num(v.price) > 0 && (
                  <div className="font-extrabold text-emerald-700">{ILS(v.price)}</div>
                )}
              </div>
            </div>

            <div className="text-sm text-slate-500 mt-1">{visitWho(v, profiles)}</div>

            {v.work_done && <p className="whitespace-pre-wrap text-slate-700 mt-2">{v.work_done}</p>}

            {(pics[v.id] || []).length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {pics[v.id].map((p) => (
                  <a key={p.id} href={urls[p.path] || '#'} target="_blank" rel="noreferrer"
                    className="block aspect-square rounded-xl overflow-hidden bg-slate-100">
                    {urls[p.path]
                      ? <img src={urls[p.path]} alt="" loading="lazy" className="w-full h-full object-cover" />
                      : <span className="text-xs text-slate-400">לא נטען</span>}
                  </a>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Button size="md" variant="secondary" onClick={() => setEditing(v.id)}>עריכה</Button>
              <Button size="md" variant="ghost" onClick={() => remove(v)}>🗑 מחיקה</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function VisitForm({ job, visit = null, profiles, me, perVisit, workTypes = [], onTypesChanged, existing = [], urls = {}, onDone, onCancel }) {
  const [form, setForm] = useState(() => visit ? {
    visited_on: visit.visited_on,
    duration_hours: visit.duration_hours ?? '',
    work_done: visit.work_done || '',
    work_type: visit.work_type || '',
    assignees: Array.isArray(visit.assignees) ? visit.assignees : [],
    helpers: visit.helpers || '',
    helper_hours: visit.helper_hours ?? '',
    price: num(visit.price) || '',
  } : { ...blank(), assignees: me ? [me] : [] })
  const [pics, setPics] = useState([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    if (busy) return
    if (!form.visited_on) return setError({ message: 'צריך תאריך' })
    setBusy(true); setError(null)
    try {
      const saved = await db.saveVisit({
        ...(visit ? { id: visit.id } : {}),
        job_id: job.id,
        visited_on: form.visited_on,
        duration_hours: form.duration_hours === '' ? null : Number(form.duration_hours),
        work_done: form.work_done.trim() || null,
        work_type: form.work_type || null,
        assignees: form.assignees,
        helpers: form.helpers.trim() || null,
        helper_hours: form.helper_hours === '' ? null : Number(form.helper_hours),
        price: perVisit ? Number(form.price) || 0 : num(visit?.price),
      })
      // The visit is saved at this point. A photo that fails to upload must
      // never take the visit with it, the way a new call keeps its photos
      // separate from the call itself.
      if (pics.length) {
        try {
          for (let i = 0; i < pics.length; i++) {
            setProgress(`מעלה תמונה ${i + 1} מתוך ${pics.length}`)
            await photos.upload(job.id, 'visit', pics[i].file, saved.id)
          }
        } catch (e) {
          setProgress(null); setBusy(false)
          return setError({ message: `הביקור נשמר, אבל התמונות לא עלו: ${e.message || e}` })
        }
      }
      onDone()
    } catch (e) { setError(e); setProgress(null); setBusy(false) }
  }

  async function dropPhoto(row) {
    if (!confirm('למחוק את התמונה?')) return
    try { await photos.remove(row); onDone() } catch (e) { setError(e) }
  }

  return (
    <Card className="border-2 border-brand/30">
      <div className="font-extrabold text-lg mb-3">{visit ? 'עריכת ביקור' : 'ביקור חדש'}</div>
      <div className="space-y-4">
        <Field label="מתי היית">
          <Input type="date" value={form.visited_on} onChange={(e) => set('visited_on', e.target.value)} />
          {form.visited_on && (
            <span className="block text-sm text-accent font-bold mt-1">{hebrewDate(form.visited_on, { withYear: true })}</span>
          )}
        </Field>

        <Field label="סוג העבודה" hint="אפשר להוסיף סוג משלכם">
          <WorkTypeChoice types={workTypes} value={form.work_type} onChange={(v) => set('work_type', v)} onAdded={onTypesChanged} />
        </Field>

        <Field label="מה עשית" hint="השלב הזה, בלשון שלך">
          <Textarea value={form.work_done} onChange={(e) => set('work_done', e.target.value)}
            placeholder="למשל: העברתי קו מים לדירה 4, חיברתי מחלק…" rows={3} />
        </Field>

        <Field label="כמה זמן לקח">
          <div className="grid grid-cols-8 gap-1 mb-2">
            {HOUR_CHIPS.map((h) => (
              <button key={h} type="button"
                onClick={() => set('duration_hours', Number(form.duration_hours) === h ? '' : h)}
                className={`min-h-10 rounded-lg border-2 text-sm font-bold ${
                  Number(form.duration_hours) === h ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200'}`}>
                {h}
              </button>
            ))}
          </div>
          <Input type="number" inputMode="decimal" min="0" step="0.5" value={form.duration_hours}
            onChange={(e) => set('duration_hours', e.target.value)} placeholder="שעות" />
        </Field>

        <Field label="מי היה">
          <AssigneeChoice profiles={profiles} value={form.assignees} onChange={(v) => set('assignees', v)} />
        </Field>

        <Field label="עובד נוסף" hint="מי שאינו אחד מכם, בשם. לא חובה.">
          <Input value={form.helpers} onChange={(e) => set('helpers', e.target.value)} placeholder="למשל: אחמד" />
        </Field>

        {(form.helpers.trim() || form.helper_hours !== '') && (
          <Field label="כמה זמן הוא עבד איתכם" hint="אם שונה מאורך הביקור">
            <div className="grid grid-cols-8 gap-1 mb-2">
              {HOUR_CHIPS.map((h) => (
                <button key={h} type="button"
                  onClick={() => set('helper_hours', Number(form.helper_hours) === h ? '' : h)}
                  className={`min-h-10 rounded-lg border-2 text-sm font-bold ${
                    Number(form.helper_hours) === h ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200'}`}>
                  {h}
                </button>
              ))}
            </div>
            <Input type="number" inputMode="decimal" min="0" step="0.5" value={form.helper_hours}
              onChange={(e) => set('helper_hours', e.target.value)} placeholder="שעות" />
          </Field>
        )}

        {perVisit && (
          <Field label={'מחיר הביקור · לפני מע"מ'} hint="מתחבר לסכום הכולל של הפרויקט">
            <Input type="number" inputMode="decimal" min="0" step="1" value={form.price}
              onChange={(e) => set('price', e.target.value)} placeholder="0" />
          </Field>
        )}

        {existing.length > 0 && (
          <div>
            <span className="block text-sm font-semibold text-slate-600 mb-1">תמונות שכבר צורפו</span>
            <div className="grid grid-cols-4 gap-2">
              {existing.map((p) => (
                <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                  {urls[p.path] && <img src={urls[p.path]} alt="" className="w-full h-full object-cover" />}
                  <button type="button" onClick={() => dropPhoto(p)} aria-label="מחיקת תמונה"
                    className="absolute top-1 left-1 h-8 w-8 rounded-full bg-black/60 text-white text-sm">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Field label="תמונות" hint="לא חובה. יעלו עם שמירת הביקור.">
          <StagedPhotos files={pics} onChange={setPics} disabled={busy} />
        </Field>

        <ErrorBox error={error} />
        <div className="flex gap-2">
          <Button size="xl" className="flex-1" onClick={save} disabled={busy}>
            {progress || (busy ? 'שומר…' : 'שמירת הביקור')}
          </Button>
          <Button size="xl" variant="ghost" onClick={onCancel} disabled={busy}>ביטול</Button>
        </div>
      </div>
    </Card>
  )
}
