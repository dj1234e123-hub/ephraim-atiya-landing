import { useCallback, useEffect, useRef, useState } from 'react'
import { getState, mutate, uid, nowISO } from './store'
import { ME_ID } from './demo'
import { toISODate } from './format'

/**
 * אותו hook בדיוק כמו במערכת האמיתית: { data, loading, refreshing, error, reload }.
 * המסכים לא יודעים שמתחתיהם אין שרת.
 */
export function useData(fn, deps = []) {
  const [state, set] = useState({ loading: true })
  const runId = useRef(0)

  const run = useCallback(async (keepData) => {
    const id = ++runId.current
    set((s) => (keepData ? { ...s, loading: true } : { loading: true }))
    try {
      const data = await fn()
      if (id === runId.current) set({ data, loading: false })
    } catch (error) {
      console.error(error)
      if (id === runId.current) set((s) => ({ ...s, error, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const reload = useCallback(() => run(true), [run])

  useEffect(() => {
    run(false)
    return () => { runId.current++ }
  }, [run])

  return {
    data: state.data,
    error: state.error,
    loading: state.loading && state.data === undefined,
    refreshing: state.loading,
    reload,
  }
}

/**
 * שכבת הנתונים של ההדגמה. אותם שמות פונקציות ואותן צורות תשובה כמו `db`
 * במערכת האמיתית (שם הן שאילתות ל-Supabase), כאן הן רצות על אובייקט בזיכרון.
 * ה-view `jobs_with_balance` מהמסד משוחזר ב-enrich().
 */
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)))
const wait = (v) => new Promise((r) => setTimeout(() => r(clone(v)), 0))
const num = (n) => Number(n) || 0
const live = (rows) => rows.filter((r) => !r.deleted_at)
const sumBy = (rows, f) => rows.reduce((s, r) => s + num(f(r)), 0)

const TABLE_OF = { job: 'jobs', customer: 'customers', payment: 'payments', expense: 'expenses', visit: 'job_visits' }
const bin = (by = null) => ({ deleted_at: nowISO(), deleted_by: by })
const stamp = (row, creating) => ({
  ...row,
  ...(creating ? { created_at: row.created_at || nowISO(), created_by: row.created_by || ME_ID } : {}),
  updated_at: nowISO(), updated_by: ME_ID,
})

function manHoursOf(v) {
  const len = num(v.duration_hours)
  const people = Math.max(1, (Array.isArray(v.assignees) ? v.assignees : []).length)
  const helper = num(v.helper_hours) > 0 ? num(v.helper_hours) : ((v.helpers || '').trim() ? len : 0)
  return len * people + helper
}

/** jobs_with_balance: קריאה + לקוח + תשלומים + הוצאות + ביקורים, כמו ה-view במסד. */
function enrich(j, s) {
  const c = s.customers.find((x) => x.id === j.customer_id) || null
  const pays = live(s.payments).filter((p) => p.job_id === j.id)
  const exps = live(s.expenses).filter((e) => e.job_id === j.id)
  const visits = live(s.job_visits).filter((v) => v.job_id === j.id)
  const paid = sumBy(pays, (p) => p.amount)
  const visitsHours = visits.length ? sumBy(visits, (v) => v.duration_hours) : null
  const visitsPrice = sumBy(visits, (v) => v.price)
  const effective_price = j.pricing_mode === 'per_visit' ? visitsPrice : num(j.price)
  const days = visits.map((v) => v.visited_on).sort()
  return {
    ...j,
    customer_name: c?.name ?? null,
    customer_phone: c?.phone ?? null,
    customer_address: c?.address ?? null,
    assignee_names: (j.assignees || []).map((id) => s.profiles.find((p) => p.id === id)?.full_name).filter(Boolean).sort(),
    scheduled_local_date: j.scheduled_at ? toISODate(new Date(j.scheduled_at)) : null,
    paid,
    visits_count: visits.length,
    visits_hours: visitsHours,
    visits_price: visitsPrice,
    first_visit_on: days[0] || null,
    last_visit_on: days[days.length - 1] || null,
    effective_price,
    total_hours: visits.length ? visitsHours : j.duration_hours,
    balance: effective_price - paid,
    expenses: sumBy(exps, (e) => e.amount),
    first_paid_at: pays.map((p) => p.paid_at).sort()[0] || null,
    visit_days: new Set(days).size,
    man_hours: visits.reduce((t, v) => t + manHoursOf(v), 0),
  }
}

const jobOrder = (a, b) => {
  if (a.scheduled_at && b.scheduled_at) return a.scheduled_at.localeCompare(b.scheduled_at)
  if (a.scheduled_at) return -1
  if (b.scheduled_at) return 1
  return String(b.created_at).localeCompare(String(a.created_at))
}
const liveJobs = (s) => live(s.jobs).map((j) => enrich(j, s))
const jobBrief = (s, jobId) => {
  const j = s.jobs.find((x) => x.id === jobId)
  return j ? { kind: j.kind, title: j.title, customer_id: j.customer_id } : null
}
const withJob = (s) => (row) => ({ ...row, job: jobBrief(s, row.job_id) })

/** חותמת שיוך, כמו הטריגר במסד: מתי ומי שייך, כדי שהשותף יראה "חדש אצלך". */
function assignmentStamp(before, after) {
  const was = JSON.stringify(before?.assignees || [])
  const now = JSON.stringify(after.assignees || [])
  if ((after.assignees || []).length && (!before || was !== now)) {
    return { assigned_at: nowISO(), assigned_by: ME_ID }
  }
  return {}
}

export const db = {
  // ── אנשים ─────────────────────────────────────────────────────
  profiles: () => wait([...getState().profiles].sort((a, b) => a.full_name.localeCompare(b.full_name, 'he'))),
  profile: (id) => wait(getState().profiles.find((p) => p.id === id) || null),

  newAssignments: (me) => {
    if (!me?.id) return wait([])
    const s = getState()
    return wait(liveJobs(s).filter((j) =>
      (j.assignees || []).includes(me.id) && j.assigned_by !== me.id && j.assigned_at &&
      !['done', 'cancelled'].includes(j.status) &&
      (!me.assignments_seen_at || j.assigned_at > me.assignments_seen_at),
    ).sort((a, b) => String(b.assigned_at).localeCompare(String(a.assigned_at))))
  },
  markAssignmentsSeen: (id) =>
    wait(mutate((s) => { const p = s.profiles.find((x) => x.id === id); if (p) p.assignments_seen_at = nowISO() })),

  // ── העסק עצמו ─────────────────────────────────────────────────
  workspace: () => wait(getState().workspace),
  saveWorkspace: (w) => wait(mutate((s) => { Object.assign(s.workspace, w) })),

  payDestinations: () => wait([...getState().payment_destinations].sort((a, b) => a.sort_order - b.sort_order)),
  savePayDestination: (d) => wait(mutate((s) => {
    const i = s.payment_destinations.findIndex((x) => x.id === d.id)
    const clean = Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined))
    if (i >= 0) { Object.assign(s.payment_destinations[i], clean); return s.payment_destinations[i] }
    const row = { id: uid(), workspace_id: s.workspace.id, created_at: nowISO(), sort_order: 0, ...clean }
    s.payment_destinations.push(row)
    return row
  })),
  deletePayDestination: (id) => wait(mutate((s) => {
    s.payment_destinations = s.payment_destinations.filter((x) => x.id !== id)
    s.customers.forEach((c) => { if (c.payment_destination_id === id) c.payment_destination_id = null })
  })),

  // ── לקוחות ────────────────────────────────────────────────────
  customers: () => wait(live(getState().customers).sort((a, b) => a.name.localeCompare(b.name, 'he'))),
  customer: (id) => wait(getState().customers.find((c) => c.id === id) || null),
  saveCustomer: (c) => wait(mutate((s) => {
    const i = c.id ? s.customers.findIndex((x) => x.id === c.id) : -1
    if (i >= 0) { Object.assign(s.customers[i], stamp(c, false)); return s.customers[i] }
    const row = stamp({ id: uid(), workspace_id: s.workspace.id, phone: null, address: null, notes: null, payment_destination_id: null, deleted_at: null, deleted_by: null, ...c }, true)
    s.customers.push(row)
    return row
  })),
  updateCustomer: (id, patch) => wait(mutate((s) => { const c = s.customers.find((x) => x.id === id); if (c) Object.assign(c, stamp(patch, false)) })),
  deleteCustomer: (id, by) => wait(mutate((s) => { const c = s.customers.find((x) => x.id === id); if (c) Object.assign(c, bin(by)) })),

  // ── קריאות ────────────────────────────────────────────────────
  jobs: (kind) => wait(liveJobs(getState()).filter((j) => !kind || j.kind === kind).sort(jobOrder)),
  job: (id) => {
    const s = getState()
    const j = live(s.jobs).find((x) => x.id === id)
    return j ? wait(enrich(j, s)) : Promise.reject(new Error('הקריאה לא נמצאה'))
  },
  jobsOfCustomer: (customerId) => wait(liveJobs(getState()).filter((j) => j.customer_id === customerId).sort(jobOrder)),
  jobsInRange: (fromISO, toISO) =>
    wait(liveJobs(getState()).filter((j) => j.scheduled_at && j.scheduled_at >= fromISO && j.scheduled_at < toISO).sort(jobOrder)),
  jobsUnscheduled: () =>
    wait(liveJobs(getState()).filter((j) => !j.scheduled_at && !['done', 'cancelled'].includes(j.status))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))),
  saveJob: (j) => wait(mutate((s) => {
    const i = j.id ? s.jobs.findIndex((x) => x.id === j.id) : -1
    if (i >= 0) {
      const before = s.jobs[i]
      Object.assign(before, stamp(j, false), assignmentStamp(before, { ...before, ...j }))
      return before
    }
    const row = stamp({
      id: uid(), workspace_id: s.workspace.id, kind: 'private', customer_id: null, issue_type: null, description: null,
      work_notes: null, status: 'new', price: 0, pricing_mode: 'total', scheduled_at: null, duration_hours: null,
      assignees: [], assigned_at: null, assigned_by: null, is_urgent: false, notes: null, deleted_at: null, deleted_by: null, quote_id: null,
      ...j,
    }, true)
    Object.assign(row, assignmentStamp(null, row))
    s.jobs.push(row)
    return row
  })),
  updateJob: (id, patch) => wait(mutate((s) => {
    const j = s.jobs.find((x) => x.id === id)
    if (!j) throw new Error('הקריאה לא נמצאה')
    const extra = 'assignees' in patch ? assignmentStamp(j, { ...j, ...patch }) : {}
    Object.assign(j, stamp(patch, false), extra)
  })),
  deleteJob: (id, by) => wait(mutate((s) => { const j = s.jobs.find((x) => x.id === id); if (j) Object.assign(j, bin(by)) })),

  // ── ביקורים בפרויקט ──────────────────────────────────────────
  visitsOfJob: (jobId) =>
    wait(live(getState().job_visits).filter((v) => v.job_id === jobId)
      .sort((a, b) => b.visited_on.localeCompare(a.visited_on) || String(b.created_at).localeCompare(String(a.created_at)))),
  saveVisit: (v) => wait(mutate((s) => {
    const i = v.id ? s.job_visits.findIndex((x) => x.id === v.id) : -1
    if (i >= 0) { Object.assign(s.job_visits[i], stamp(v, false)); return s.job_visits[i] }
    const row = stamp({ id: uid(), workspace_id: s.workspace.id, duration_hours: null, work_done: null, assignees: [], helpers: null, helper_hours: null, work_type: null, price: 0, deleted_at: null, deleted_by: null, ...v }, true)
    s.job_visits.push(row)
    return row
  })),
  deleteVisit: (id, by) => wait(mutate((s) => { const v = s.job_visits.find((x) => x.id === id); if (v) Object.assign(v, bin(by)) })),

  // ── תשלומים ───────────────────────────────────────────────────
  paymentsOfJob: (jobId) =>
    wait(live(getState().payments).filter((p) => p.job_id === jobId).sort((a, b) => b.paid_at.localeCompare(a.paid_at))),
  paymentsBetween: (from, to) => {
    const s = getState()
    return wait(live(s.payments).filter((p) => p.paid_at >= from && p.paid_at <= to).map(withJob(s)))
  },
  addPayment: (p) => wait(mutate((s) => {
    if (!(num(p.amount) > 0)) throw new Error('הסכום חייב להיות גדול מאפס')
    s.payments.push(stamp({ id: uid(), workspace_id: s.workspace.id, method: 'cash', received_by: null, third_party: null, note: null, deleted_at: null, deleted_by: null, ...p }, true))
  })),
  deletePayment: (id, by) => wait(mutate((s) => { const p = s.payments.find((x) => x.id === id); if (p) Object.assign(p, bin(by)) })),

  // ── הוצאות ────────────────────────────────────────────────────
  expensesOfJob: (jobId) =>
    wait(live(getState().expenses).filter((e) => e.job_id === jobId).sort((a, b) => b.spent_at.localeCompare(a.spent_at))),
  expensesBetween: (from, to) => {
    const s = getState()
    return wait(live(s.expenses).filter((e) => e.spent_at >= from && e.spent_at <= to)
      .sort((a, b) => b.spent_at.localeCompare(a.spent_at)).map(withJob(s)))
  },
  addExpense: (e) => wait(mutate((s) => {
    if (!(num(e.amount) > 0)) throw new Error('הסכום חייב להיות גדול מאפס')
    s.expenses.push(stamp({ id: uid(), workspace_id: s.workspace.id, job_id: null, category: 'other', supplier: null, paid_at: null, paid_by: null, note: null, deleted_at: null, deleted_by: null, ...e }, true))
  })),
  deleteExpense: (id, by) => wait(mutate((s) => { const e = s.expenses.find((x) => x.id === id); if (e) Object.assign(e, bin(by)) })),
  expensesUnpaid: () => {
    const s = getState()
    return wait(live(s.expenses).filter((e) => !e.paid_at).sort((a, b) => a.spent_at.localeCompare(b.spent_at)).map(withJob(s)))
  },
  settleExpense: (id, by, on) => wait(mutate((s) => { const e = s.expenses.find((x) => x.id === id); if (e) Object.assign(e, { paid_by: by, paid_at: on }, stamp({}, false)) })),

  // ── סוגי עבודה ────────────────────────────────────────────────
  workTypes: () => wait([...getState().work_types].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, 'he'))),
  addWorkType: (label, sort_order = 100) => wait(mutate((s) => {
    const row = { id: uid(), workspace_id: s.workspace.id, label, sort_order, created_at: nowISO() }
    s.work_types.push(row)
    return row
  })),

  // ── סל המיחזור ────────────────────────────────────────────────
  deletedItems: () => {
    const s = getState()
    const who = (id) => s.profiles.find((p) => p.id === id)?.full_name || null
    const title = (jobId, fallback) => s.jobs.find((j) => j.id === jobId)?.title || fallback
    const rows = [
      ...s.jobs.filter((j) => j.deleted_at).map((j) => ({ kind: 'job', id: j.id, label: j.title, deleted_at: j.deleted_at, deleted_by_name: who(j.deleted_by), detail: String(j.price) })),
      ...s.customers.filter((c) => c.deleted_at).map((c) => ({ kind: 'customer', id: c.id, label: c.name, deleted_at: c.deleted_at, deleted_by_name: who(c.deleted_by), detail: c.phone || '' })),
      ...s.payments.filter((p) => p.deleted_at).map((p) => ({ kind: 'payment', id: p.id, label: title(p.job_id, 'תשלום'), deleted_at: p.deleted_at, deleted_by_name: who(p.deleted_by), detail: String(p.amount) })),
      ...s.expenses.filter((e) => e.deleted_at).map((e) => ({ kind: 'expense', id: e.id, label: e.note || e.category, deleted_at: e.deleted_at, deleted_by_name: who(e.deleted_by), detail: String(e.amount) })),
      ...s.job_visits.filter((v) => v.deleted_at).map((v) => ({ kind: 'visit', id: v.id, label: `${title(v.job_id, 'ביקור')} · ${v.visited_on}`, deleted_at: v.deleted_at, deleted_by_name: who(v.deleted_by), detail: v.work_done || '' })),
    ]
    return wait(rows.sort((a, b) => b.deleted_at.localeCompare(a.deleted_at)))
  },
  restore: (kind, id) => wait(mutate((s) => { const r = s[TABLE_OF[kind]].find((x) => x.id === id); if (r) Object.assign(r, { deleted_at: null, deleted_by: null }) })),
  purge: (kind, id) => wait(mutate((s) => {
    const r = s[TABLE_OF[kind]].find((x) => x.id === id)
    if (!r?.deleted_at || Date.now() - new Date(r.deleted_at).getTime() < 30 * 86400000) {
      throw new Error('אפשר למחוק לצמיתות רק פריט שנמצא בסל המיחזור 30 יום לפחות')
    }
    s[TABLE_OF[kind]] = s[TABLE_OF[kind]].filter((x) => x.id !== id)
  })),

  // ── יצוא ──────────────────────────────────────────────────────
  exportAll: async () => {
    const s = getState()
    return wait({
      customers: live(s.customers).sort((a, b) => a.name.localeCompare(b.name, 'he')),
      jobs: liveJobs(s).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))),
      payments: live(s.payments).sort((a, b) => a.paid_at.localeCompare(b.paid_at)),
      expenses: live(s.expenses).sort((a, b) => a.spent_at.localeCompare(b.spent_at)),
      visits: live(s.job_visits).sort((a, b) => a.visited_on.localeCompare(b.visited_on)),
      profiles: s.profiles,
      dests: s.payment_destinations,
    })
  },

  // ── הצעות מחיר (תוספת של ההדגמה) ──────────────────────────────
  quotes: () => {
    const s = getState()
    return wait(s.quotes.map((q) => ({ ...q, customer_name: s.customers.find((c) => c.id === q.customer_id)?.name ?? null, customer_phone: s.customers.find((c) => c.id === q.customer_id)?.phone ?? null }))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))))
  },
  quote: (id) => {
    const s = getState()
    const q = s.quotes.find((x) => x.id === id)
    if (!q) return Promise.reject(new Error('הצעת המחיר לא נמצאה'))
    const c = s.customers.find((x) => x.id === q.customer_id) || null
    return wait({ ...q, customer_name: c?.name ?? null, customer_phone: c?.phone ?? null })
  },
  saveQuote: (q) => wait(mutate((s) => {
    const i = q.id ? s.quotes.findIndex((x) => x.id === q.id) : -1
    if (i >= 0) { Object.assign(s.quotes[i], q, { updated_at: nowISO() }); return s.quotes[i] }
    const row = { id: uid(), workspace_id: s.workspace.id, customer_id: null, title: '', items: [], adds_vat: false, discount: 0, valid_days: 14, notes: null, status: 'draft', created_at: nowISO(), created_by: ME_ID, updated_at: nowISO(), sent_at: null, decided_at: null, job_id: null, ...q }
    s.quotes.push(row)
    return row
  })),
  updateQuote: (id, patch) => wait(mutate((s) => { const q = s.quotes.find((x) => x.id === id); if (q) Object.assign(q, patch, { updated_at: nowISO() }) })),
  deleteQuote: (id) => wait(mutate((s) => { s.quotes = s.quotes.filter((x) => x.id !== id) })),
}
