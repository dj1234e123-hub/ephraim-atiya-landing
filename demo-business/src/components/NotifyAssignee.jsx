import { assigneesOf, assignmentMessage, whatsappHref } from '../lib/format'

/**
 * "I booked you a job" in one tap.
 *
 * Everything else in the app only shows up when the other one happens to open
 * it. WhatsApp is open on their phones all day, so a ready-made message with
 * the job, the customer, the time, the address and a link to the call is the
 * one channel that actually arrives - with no permissions to grant, nothing to
 * install and nothing to pay for.
 *
 * Only for other people: telling yourself about your own decision is noise.
 */
/** The people on this call, other than me, who can actually be messaged. */
export const notifyTargets = (job, profiles = [], me = null) =>
  assigneesOf(job)
    .filter((id) => id !== me)
    .map((id) => profiles.find((p) => p.id === id))
    .filter((p) => p?.phone)

export default function NotifyAssignee({ job, profiles = [], me = null }) {
  const targets = notifyTargets(job, profiles, me)
  if (!targets.length) return null
  const text = assignmentMessage(job, window.location.origin)

  return (
    <div className="mt-2 grid gap-2">
      {targets.map((p) => (
        <a key={p.id} href={whatsappHref(p.phone, text)} target="_blank" rel="noopener noreferrer"
          className="min-h-14 rounded-2xl bg-[#25D366] text-white font-extrabold text-lg flex items-center justify-center gap-2 active:scale-[0.99] transition">
          📲 עדכן את {p.full_name} בוואטסאפ
        </a>
      ))}
    </div>
  )
}
