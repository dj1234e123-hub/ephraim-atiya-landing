import { Mark, Wordmark } from "./components/Logo";
import { Section, Heading } from "./components/Section";
import { FloatingWhatsApp, PhoneCta, WhatsAppCta, WhatsAppIcon } from "./components/WhatsApp";
import { Reveal } from "./components/Reveal";
import { Mockup } from "./components/Mockup";
import { TopBar } from "./components/TopBar";
import { track } from "./analytics";
import { Faq } from "./components/Faq";
import {
  afterContact,
  audience,
  brand,
  contact,
  dayAfter,
  DEMO_URL,
  differentiator,
  facts,
  gabbaiWeek,
  heroConcrete,
  PHONE_DISPLAY,
  PHONE_TEL,
  promise,
  services,
  servicesNote,
  steps,
  story,
  testimonials,
  WHATSAPP_URL,
} from "./content";

export default function App() {
  return (
    <>
      <a
        href="#services"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-5 focus:py-3 focus:text-navy"
      >
        דילוג לשירותים ומחירים
      </a>

      <TopBar />

      <main id="top">
        <Hero />
        <Facts />
        <Promise />
        <GabbaiWeek />
        <Differentiator />
        <Services />
        <Process />
        <DayAfter />
        <Story />
        <Testimonials />
        <FaqSection />
        <Closing />
      </main>

      <FloatingWhatsApp />
    </>
  );
}

/* 1. Hero: טקסט + הדמיית מסך */
function Hero() {
  return (
    <header className="relative overflow-hidden bg-navy text-cream">
      <HeroArch />
      <div className="container-page relative flex min-h-[100svh] flex-col items-center justify-center pb-28 pt-16 sm:pb-20">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hero-stagger flex flex-col items-center text-center lg:items-start lg:text-start">
            <div className="flex flex-col items-center lg:flex-row lg:items-end lg:gap-6">
              <Mark className="h-24 w-auto sm:h-28" animate />
              <Wordmark className="mt-5 lg:mt-0 lg:items-start" />
            </div>

            <h1 className="mt-10 font-title text-4xl font-medium leading-tight text-gold sm:text-6xl">{brand.slogan}</h1>
            <p className="mt-5 max-w-xl font-title text-2xl leading-snug text-cream sm:text-3xl">{heroConcrete}</p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-cream/75 sm:text-lg">{brand.essence}</p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <WhatsAppCta className="w-full sm:w-auto" location="hero" />
              <PhoneCta className="w-full sm:w-auto" location="hero" />
            </div>
            <p className="mt-4 text-sm text-cream/60">{contact.area}</p>
          </div>

          <Reveal className="hidden lg:block" delay={400}>
            <Mockup />
            <p className="mt-4 text-center text-sm text-cream/60">
              <a href={DEMO_URL} className="border-b border-gold/60 text-gold hover:text-cream" onClick={() => track("demo_click", { location: "hero" })}>
                לפתוח את ההדגמה ולנסות בעצמכם
              </a>
            </p>
          </Reveal>
        </div>
      </div>
    </header>
  );
}

/** קשת אחת גדולה ושקופה מאחורי ה-Hero, כמו שער. */
function HeroArch() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute left-1/2 top-0 h-full w-[140%] max-w-none -translate-x-1/2 sm:w-[90%]"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMax meet"
    >
      <path d="M 60 900 V 400 A 340 340 0 0 1 740 400 V 900" fill="none" stroke="#F6F1E7" strokeWidth="1.5" opacity="0.1" />
      <path d="M 140 900 V 420 A 260 260 0 0 1 660 420 V 900" fill="none" stroke="#C9A24A" strokeWidth="1" opacity="0.12" />
    </svg>
  );
}

/* 1ב. רצועת עובדות: למה לסמוך, מיד אחרי הכותרת. במובייל גם ההדמיה כאן. */
function Facts() {
  return (
    <section aria-label="עובדות" className="relative border-y border-gold/25 bg-navy text-cream">
      <div className="container-page py-10">
        <Reveal className="lg:hidden">
          <div className="mb-10">
            <Mockup />
            <p className="mt-5 text-center">
              <a
                href={DEMO_URL}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-gold/70 px-6 text-base font-medium text-gold hover:bg-gold/10"
                onClick={() => track("demo_click", { location: "mobile-mockup" })}
              >
                לפתוח את ההדגמה ולנסות בעצמכם
              </a>
            </p>
          </div>
        </Reveal>
        <ul className="grid gap-6 sm:grid-cols-3">
          {facts.map((f, i) => (
            <Reveal as="li" key={f.big} delay={i * 120} className="text-center">
              <p className="font-title text-3xl font-medium text-gold">{f.big}</p>
              <p className="mt-1 text-cream/75">{f.small}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* 2. הבעיה ← ההבטחה */
function Promise() {
  return (
    <Section tone="cream" id="promise" labelledBy="promise-title">
      <Reveal>
        <Heading id="promise-title" eyebrow="למוסדות, קהילות ועסקים" title={promise.title} tone="cream" />
        <p className="mx-auto mb-14 max-w-2xl text-center text-lg leading-relaxed text-navy/80">{audience}</p>
      </Reveal>

      <ul className="grid gap-5 sm:grid-cols-2">
        {promise.pairs.map((pair, i) => (
          <Reveal as="li" key={pair.promise} delay={i * 100} className="card-lift rounded-2xl bg-white/60 p-7 shadow-card ring-1 ring-navy/5">
            <p className="text-base text-navy/60">{pair.problem}</p>
            <div className="my-4 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-gold-deep/40" />
              <ArrowLeft className="h-5 w-5 text-gold-deep" />
            </div>
            <p className="font-title text-2xl font-medium text-navy">{pair.promise}</p>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

function ArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* 2ב. השבוע של גבאי: הכאב האחד וההבטחה */
function GabbaiWeek() {
  return (
    <Section tone="navy" id="gabbai" labelledBy="gabbai-title">
      <Reveal className="mx-auto max-w-3xl text-center">
        <Heading id="gabbai-title" eyebrow={gabbaiWeek.eyebrow} title={gabbaiWeek.title} tone="navy" />
        <p className="text-lg leading-relaxed text-cream/85 sm:text-xl">{gabbaiWeek.intro}</p>
      </Reveal>

      <ol className="mx-auto mt-12 max-w-4xl space-y-3">
        {gabbaiWeek.moments.map((m, i) => (
          <Reveal as="li" key={m.when} delay={i * 80} className="grid gap-2 rounded-2xl border border-cream/10 bg-cream/5 p-5 sm:grid-cols-[8rem_1fr_1fr] sm:gap-5">
            <p className="font-title text-xl text-gold">{m.when}</p>
            <p className="text-cream/70"><span className="text-xs text-cream/50">היום: </span>{m.today}</p>
            <p className="text-cream"><span className="text-xs text-gold/80">עם המערכת: </span>{m.system}</p>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mx-auto mt-14 max-w-2xl text-center">
        <p className="text-xl leading-relaxed text-cream/85 sm:text-2xl">{gabbaiWeek.pain}</p>
        <p className="mt-3 font-title text-4xl text-gold sm:text-5xl">{gabbaiWeek.promise}</p>
        <a
          href={DEMO_URL}
          className="btn-phone-cream mt-8 inline-flex"
          onClick={() => track("demo_click", { location: "gabbai-week" })}
        >
          {gabbaiWeek.demoLabel}
        </a>
      </Reveal>
    </Section>
  );
}

/* 3. מה מבדל אותי */
function Differentiator() {
  return (
    <Section tone="navy" id="why" labelledBy="why-title">
      <Reveal className="mx-auto max-w-3xl text-center">
        <Heading id="why-title" eyebrow="מה מבדל אותי" title={differentiator.title} tone="navy" />
        {differentiator.lines.map((line) => (
          <p key={line} className="text-xl leading-relaxed text-cream/85 sm:text-2xl">
            {line}
          </p>
        ))}
      </Reveal>

      <ul className="mx-auto mt-14 grid max-w-5xl gap-8 sm:grid-cols-3">
        {differentiator.points.map((p, i) => (
          <Reveal as="li" key={p.title} delay={i * 120} className="border-t border-gold/50 pt-5">
            <h3 className="font-title text-2xl font-medium text-gold">{p.title}</h3>
            <p className="mt-2 leading-relaxed text-cream/80">{p.text}</p>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* 4. שירותים ומחירים */
function Services() {
  return (
    <Section tone="cream" id="services" labelledBy="services-title">
      <Reveal>
        <Heading id="services-title" eyebrow="שירותים ומחירים" title="מה אני מציע, וכמה זה עולה" tone="cream" />
      </Reveal>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <Reveal
            as="li"
            key={s.title}
            delay={i * 80}
            className={`card-lift flex flex-col rounded-2xl p-7 shadow-card ring-1 ${
              s.highlight ? "bg-navy text-cream ring-navy" : "bg-white/60 text-navy ring-navy/5"
            }`}
          >
            <h3 className="font-title text-2xl font-medium">{s.title}</h3>
            <p className={`mt-3 flex-1 leading-relaxed ${s.highlight ? "text-cream/80" : "text-navy/75"}`}>{s.desc}</p>
            <div className={`mt-6 border-t pt-4 ${s.highlight ? "border-gold/40" : "border-gold-deep/30"}`}>
              <p className={`font-title text-2xl font-medium ${s.highlight ? "text-gold" : "text-gold-deep"}`}>{s.price}</p>
              {s.note && <p className={`mt-1 text-sm ${s.highlight ? "text-cream/70" : "text-navy/60"}`}>{s.note}</p>}
              {s.title === "מערכת ניהול לבית כנסת" && (
                <a
                  href={DEMO_URL}
                  className="mt-2 inline-block text-sm font-medium text-gold-deep underline-offset-4 hover:underline"
                  onClick={() => track("demo_click", { location: "services" })}
                >
                  לראות הדגמה חיה ←
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </ul>

      <Reveal>
        <p className="mt-10 text-center text-navy/70">{servicesNote}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <WhatsAppCta variant="navy" className="w-full sm:w-auto" location="services" />
          <PhoneCta variant="navy" className="w-full sm:w-auto" location="services" />
        </div>
      </Reveal>
    </Section>
  );
}

/* 5. איך עובדים איתי */
function Process() {
  return (
    <Section tone="navy" id="process" labelledBy="process-title">
      <Reveal>
        <Heading id="process-title" eyebrow="איך עובדים איתי" title="ארבעה שלבים, בלי הפתעות" tone="navy" />
      </Reveal>

      <Reveal>
        <ol className="relative mx-auto grid max-w-5xl gap-10 sm:grid-cols-4 sm:gap-6">
          <div aria-hidden="true" className="process-line absolute right-0 top-7 hidden h-px w-full bg-gold/40 sm:block" />
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-5 sm:flex-col sm:items-center sm:text-center">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold bg-navy font-title text-2xl text-gold">
                {i + 1}
              </span>
              <div>
                <h3 className="font-title text-2xl font-medium">{step.title}</h3>
                <p className="mt-1 leading-relaxed text-cream/80">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}

/* 5ב. מה מקבלים, ומה קורה ביום שאחרי */
function DayAfter() {
  return (
    <Section tone="cream" id="day-after" labelledBy="day-after-title">
      <Reveal>
        <Heading id="day-after-title" eyebrow="בלי הפתעות" title={dayAfter.title} tone="cream" />
      </Reveal>

      <div className="mx-auto max-w-5xl">
        <h3 className="mb-5 text-center font-title text-2xl font-medium text-navy">מה קונים ממני</h3>
        <ul className="grid gap-5 sm:grid-cols-3">
          {dayAfter.get.map((g, i) => (
            <Reveal as="li" key={g.title} delay={i * 100} className="card-lift rounded-2xl bg-white/60 p-6 shadow-card ring-1 ring-navy/5">
              <p className="font-title text-xl font-medium text-navy">{g.title}</p>
              <p className="mt-2 leading-relaxed text-navy/75">{g.text}</p>
            </Reveal>
          ))}
        </ul>

        <h3 className="mb-5 mt-14 text-center font-title text-2xl font-medium text-navy">ביום שאחרי</h3>
        <ol className="grid gap-4 sm:grid-cols-2">
          {dayAfter.after.map((a, i) => (
            <Reveal as="li" key={a.title} delay={i * 100} className="flex gap-4 rounded-2xl border border-navy/10 p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-deep font-title text-lg text-gold-deep">
                {i + 1}
              </span>
              <div>
                <p className="font-title text-xl font-medium text-navy">{a.title}</p>
                <p className="mt-1 leading-relaxed text-navy/75">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-10 text-center">
          <p className="mx-auto max-w-2xl leading-relaxed text-navy/70">{dayAfter.hosting}</p>
          <a
            href="/terms/"
            className="mt-4 inline-block border-b border-gold-deep font-medium text-gold-deep hover:text-navy"
            onClick={() => track("terms_click", { location: "day-after" })}
          >
            {dayAfter.termsLabel}
          </a>
        </Reveal>
      </div>
    </Section>
  );
}

/* 6. הסיפור שלי, עם תמונה */
function Story() {
  return (
    <Section tone="cream" id="story" labelledBy="story-title">
      <div className="mx-auto grid max-w-4xl items-start gap-10 md:grid-cols-[auto_1fr]">
        <Reveal className="mx-auto md:mx-0 md:pt-2">
          <img
            src="/ephraim.jpg"
            width={560}
            height={560}
            alt="אפרים עטיה"
            loading="lazy"
            className="h-40 w-40 rounded-full object-cover ring-2 ring-gold-deep ring-offset-4 ring-offset-cream sm:h-48 sm:w-48"
          />
        </Reveal>
        <Reveal>
          <Heading id="story-title" eyebrow="אודות" title={story.title} tone="cream" align="start" />
          {story.paragraphs.map((p) => (
            <p key={p} className="mb-5 text-lg leading-relaxed text-navy/85 sm:text-xl">
              {p}
            </p>
          ))}
          <p className="mt-8 font-title text-2xl text-gold-deep">{brand.slogan}</p>
        </Reveal>
      </div>
    </Section>
  );
}

/* 7. המלצות */
function Testimonials() {
  return (
    <Section tone="navy" id="testimonials" labelledBy="testimonials-title" arches={false}>
      <Reveal>
        <Heading id="testimonials-title" eyebrow="מה אומרים" title="המלצות" tone="navy" />
      </Reveal>
      <ul className="grid gap-5 sm:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal as="li" key={t.quote} delay={i * 100} className="flex flex-col justify-between rounded-2xl border border-cream/15 bg-cream/5 p-7">
            <blockquote className="text-lg leading-relaxed text-cream/90">{t.quote}</blockquote>
            <footer className="mt-6 border-t border-gold/40 pt-4 text-sm text-gold">{t.who}</footer>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* 7ב. שאלות שחוזרות */
function FaqSection() {
  return (
    <Section tone="cream" id="faq" labelledBy="faq-title">
      <Reveal>
        <Heading id="faq-title" eyebrow="לפני שמתקשרים" title="שאלות שחוזרות" tone="cream" />
      </Reveal>
      <Faq />
    </Section>
  );
}

/* 8. סגירה + מה קורה אחרי + יצירת קשר */
function Closing() {
  return (
    <footer className="relative overflow-hidden bg-navy text-cream">
      <div className="h-px w-full bg-gold/40" aria-hidden="true" />
      <Section tone="navy" id="contact" labelledBy="contact-title" className="py-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 id="contact-title" className="font-title text-3xl font-medium leading-tight sm:text-5xl">
            {brand.closing}
          </h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <WhatsAppCta className="w-full sm:w-auto" location="closing" />
            <PhoneCta className="w-full sm:w-auto" location="closing" />
          </div>

          <ol className="mx-auto mt-10 max-w-md space-y-3 text-start">
            {afterContact.map((line, i) => (
              <li key={line} className="flex items-start gap-3 text-cream/85">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/60 font-title text-sm text-gold">
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>

          <dl className="mt-14 grid gap-8 text-start sm:grid-cols-3 sm:text-center">
            <div>
              <dt className="eyebrow text-gold">טלפון</dt>
              <dd className="mt-2 text-lg">
                <a href={PHONE_TEL} dir="ltr" className="hover:text-gold" onClick={() => track("phone_click", { location: "footer" })}>
                  {PHONE_DISPLAY}
                </a>
                <br />
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("whatsapp_click", { location: "footer" })}
                  className="mt-1 inline-flex items-center gap-2 text-base text-cream/80 hover:text-gold"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  וואטסאפ
                </a>
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-gold">אזור</dt>
              <dd className="mt-2 text-lg">{contact.area}</dd>
            </div>
            <div>
              <dt className="eyebrow text-gold">שעות</dt>
              <dd className="mt-2 text-lg leading-relaxed">
                {contact.hours.map((h) => (
                  <span key={h} className="block">
                    {h}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </Reveal>
      </Section>

      <div className="container-page flex flex-col items-center gap-4 border-t border-cream/10 py-8 text-center text-sm text-cream/60 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <Mark className="h-9 w-auto" title="" />
          <Wordmark size="sm" showLatin={false} />
        </div>
        <p>
          {brand.field}
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span className="text-gold">{brand.slogan}</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <a href="/terms/" className="hover:text-gold">
            תנאי מסירה
          </a>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <a href="/accessibility/" className="hover:text-gold">
            נגישות ופרטיות
          </a>
        </p>
      </div>
    </footer>
  );
}
