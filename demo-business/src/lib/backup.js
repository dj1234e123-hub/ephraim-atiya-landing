import { KIND, STATUS, METHODS, CATEGORIES, localDateOf, num, priceOf, hoursOf, visitWho } from './format'

const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const row = (cells) => cells.map(esc).join(',')

/** A date column that Excel reads as a date and a person reads as a date. */
const day = (v) => (v ? String(v).slice(0, 10) : '')

const nameOf = (id, profiles) => profiles.find((p) => p.id === id)?.full_name || ''
const jobOf = (id, jobs) => jobs.find((j) => j.id === id) || null

/**
 * The whole business as one spreadsheet: customers, calls, payments and
 * expenses, each as its own block. Excel needs a UTF-8 BOM or the Hebrew
 * arrives as gibberish, and CRLF or the rows run together.
 */
export function buildBackupCsv({ customers = [], jobs = [], payments = [], expenses = [], visits = [], profiles = [], dests = [] }, title = '') {
  const lines = []
  const block = (heading, header, rows) => {
    lines.push(row([heading]))
    lines.push(row(header))
    rows.forEach((r) => lines.push(row(r)))
    lines.push('')
  }

  lines.push(row([`גיבוי המערכת${title ? ` · ${title}` : ''}`]))
  lines.push(row([`הופק ב־${new Date().toLocaleString('he-IL')}`]))
  lines.push('')

  block('לקוחות', ['שם', 'טלפון', 'כתובת', 'יעד תשלום', 'הערות'],
    customers.map((c) => [
      c.name, c.phone, c.address,
      dests.find((d) => d.id === c.payment_destination_id)?.label || '',
      c.notes,
    ]))

  block('קריאות', ['תאריך עבודה', 'סוג', 'שם העבודה', 'לקוח', 'סטטוס', 'מטפלים', 'שעות', 'מחיר (לפני מע"מ)', 'שולם', 'יתרה', 'סוג העבודה', 'מה הלקוח אמר', 'מה נעשה בפועל', 'נפתחה'],
    jobs.map((j) => [
      day(localDateOf(j.scheduled_at)), KIND[j.kind]?.label || j.kind, j.title, j.customer_name,
      STATUS[j.status]?.label || j.status, (j.assignee_names || []).join(' + '),
      hoursOf(j), priceOf(j), num(j.paid), num(j.balance),
      j.issue_type, j.description, j.work_notes, day(j.created_at),
    ]))

  // A project's own history: what was done on each visit and what it cost.
  if (visits.length) {
    block('ביקורים בפרויקטים', ['תאריך', 'פרויקט', 'סוג העבודה', 'שעות', 'מי היה', 'שעות עובד נוסף', 'מה נעשה', 'מחיר הביקור'],
      visits.map((v) => [
        day(v.visited_on), jobOf(v.job_id, jobs)?.title || '', v.work_type, v.duration_hours,
        visitWho(v, profiles).replace(/^[👤🤝]\s*/, ''), v.helper_hours, v.work_done, num(v.price),
      ]))
  }

  block('תשלומים', ['תאריך', 'סכום', 'אופן תשלום', 'מי קיבל', 'צד שלישי', 'עבור עבודה', 'הערה'],
    payments.map((p) => [
      day(p.paid_at), num(p.amount), METHODS[p.method] || p.method,
      nameOf(p.received_by, profiles), p.third_party,
      jobOf(p.job_id, jobs)?.title || '', p.note,
    ]))

  block('הוצאות', ['תאריך', 'סכום', 'סוג', 'חנות / ספק', 'שולם?', 'תאריך תשלום', 'מי שילם', 'שייך לעבודה', 'הערה'],
    expenses.map((e) => [
      day(e.spent_at), num(e.amount), CATEGORIES[e.category] || e.category,
      e.supplier, e.paid_at ? 'שולם' : 'טרם שולם', day(e.paid_at),
      nameOf(e.paid_by, profiles), jobOf(e.job_id, jobs)?.title || '', e.note,
    ]))

  return '﻿' + lines.join('\r\n')
}

/** Hands the file to the phone, which offers to save or share it. */
export function downloadCsv(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking immediately can cancel the download on some phones.
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
