import { faq } from "../content";
import { Reveal } from "./Reveal";

/** שאלות שחוזרות: details/summary נגישים, עם חץ שמסתובב ופתיחה רכה. */
export function Faq() {
  return (
    <ul className="mx-auto max-w-3xl divide-y divide-navy/10">
      {faq.map((item, i) => (
        <Reveal as="li" key={item.q} delay={i * 60}>
          <details className="faq group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start font-title text-xl font-medium text-navy">
              <span>{item.q}</span>
              <svg viewBox="0 0 24 24" className="faq-chev h-6 w-6 shrink-0 text-gold-deep" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <p className="pb-6 text-lg leading-relaxed text-navy/80">{item.a}</p>
          </details>
        </Reveal>
      ))}
    </ul>
  );
}
