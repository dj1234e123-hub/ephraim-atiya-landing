import { useEffect, useState, type CSSProperties } from "react";
import { Mark, Wordmark } from "./components/Logo";
import { Section, Heading } from "./components/Section";
import { FloatingWhatsApp, PhoneCta, WhatsAppCta, WhatsAppIcon } from "./components/WhatsApp";
import { Reveal } from "./components/Reveal";
import { BusinessMockup, Mockup, MosadMockup } from "./components/Mockup";
import { JournalMockup } from "./components/JournalMockup";
import { ACCENTS, cleanName, DEFAULT_BRAND, demoUrl, loadBrand, saveBrand, whatsappUrl, type AccentId, type Brand } from "./journal/brand";
import { TopBar } from "./components/TopBar";
import { track } from "./analytics";
import { Faq } from "./components/Faq";
import { gates, setAudience, useAudience, type Audience } from "./audience";
import {
  afterContact,
  brand,
  BUSINESS_DEMO_URL,
  contact,
  dayAfter,
  DEMO_URL,
  demos,
  facts,
  gabbaiWeek,
  gatesPrompt,
  heroConcrete,
  journal,
  JOURNAL_DEMO_URL,
  mosad,
  PHONE_DISPLAY,
  PHONE_TEL,
  services,
  servicesNote,
  servicesStrip,
  story,
  testimonials,
  type Testimonial,
  WHATSAPP_URL,
} from "./content";

export default function App() {
  // קישור עם עוגן (למשל ?for=shul#gabbai): הדפדפן מנסה לגלול לפני ש-React צייר את הדף, אז גוללים שוב אחרי הציור.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: "start" });
  }, []);
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
        <GabbaiWeek />
        <Mosad />
        <Services />
        <Demos />
        <DayAfter />
        <Journal />
        <Story />
        <FaqSection />
        <Closing />
      </main>

      <FloatingWhatsApp />
    </>
  );
}

/* 1. Hero: טקסט, ארבעה שערים, והטלפון של הקהל שנבחר */
function Hero() {
  const audience = useAudience();
  return (
    <header className="relative overflow-hidden bg-navy text-cream">
      <HeroArch />
      <div className="container-page relative flex min-h-[100svh] flex-col items-center justify-center pb-24 pt-14 sm:pb-20">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hero-stagger flex flex-col items-center text-center lg:items-start lg:text-start">
            <div className="flex flex-col items-center lg:flex-row lg:items-end lg:gap-6">
              <Mark className="h-20 w-auto sm:h-28" animate />
              <Wordmark className="mt-4 lg:mt-0 lg:items-start" />
            </div>

            <h1 className="mt-8 font-title text-4xl font-medium leading-tight text-gold sm:text-6xl">{brand.slogan}</h1>
            <p className="mt-4 max-w-xl font-title text-2xl leading-snug text-cream sm:text-3xl">{heroConcrete}</p>

            <Gates location="hero" />

            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <WhatsAppCta className="w-full sm:w-auto" location="hero" />
              <PhoneCta className="w-full sm:w-auto" location="hero" />
            </div>
            <div className="mt-5 flex items-center gap-3">
              <img
                src="/ephraim.jpg"
                width={560}
                height={560}
                alt=""
                className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/70"
              />
              <p className="text-sm leading-snug text-cream/60">
                <span className="block text-base text-cream">{brand.name}</span>
                {contact.area}
              </p>
            </div>
          </div>

          <Reveal className="hidden lg:block" delay={300}>
            <AudienceMockup audience={audience} location="hero" />
          </Reveal>
        </div>
      </div>
    </header>
  );
}

/**
 * ארבעת השערים: מי המבקר. לחיצה גוללת לבלוק שלו, מחליפה את הטלפון המודמה,
 * ומכניסה לכל כפתורי הוואטסאפ הודעה מוכנה שאומרת מי פונה.
 */
function Gates({ location }: { location: string }) {
  const audience = useAudience();
  return (
    <nav aria-label="למי הדף" className="mt-8 w-full max-w-xl">
      <p className="eyebrow mb-3 text-gold">{gatesPrompt}</p>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {gates.map((g) => {
          const on = audience === g.id;
          return (
            <li key={g.id}>
              <a
                href={g.href}
                className={`gate ${on ? "gate-on" : ""}`}
                aria-current={on ? "true" : undefined}
                onClick={() => {
                  setAudience(g.id);
                  track("audience_pick", { audience: g.id, location });
                }}
              >
                <GateIcon id={g.id} />
                <span className="font-title text-lg font-medium leading-tight">{g.title}</span>
                <span className="text-xs text-cream/60">{g.sub}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function GateIcon({ id }: { id: Audience }) {
  const d: Record<Audience, string> = {
    shul: "M5 21V11a7 7 0 0 1 14 0v10M3 21h18M12 4V2",
    mosad: "M12 6c-2-1.5-5-1.5-8-1v14c3-.5 6-.5 8 1 2-1.5 5-1.5 8-1V5c-3-.5-6-.5-8 1Zm0 0v14",
    business: "M14 7V5a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2M4 7h16v12H4zM4 12h16",
    journal: "M7 3v3M17 3v3M4 6h16v15H4zM4 10h16M8 14l2.5 2.5L15 12",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d[id]} />
    </svg>
  );
}

/** הטלפון המודמה של הקהל שנבחר, עם הקישור להדגמה שלו. בלי בחירה: בית הכנסת. */
function AudienceMockup({ audience, location }: { audience: Audience | null; location: string }) {
  const a = audience ?? "shul";
  const link: Record<Audience, { href: string; label: string }> = {
    shul: { href: DEMO_URL, label: "לפתוח את ההדגמה ולנסות בעצמכם" },
    business: { href: BUSINESS_DEMO_URL, label: "לפתוח את הדגמת העסק ולנסות בעצמכם" },
    journal: { href: demoUrl(JOURNAL_DEMO_URL, loadBrand() ?? DEFAULT_BRAND), label: "לפתוח את הדגמת היומן" },
    mosad: { href: "#mosad", label: "כל מוסד שונה, אז בונים אחרי אפיון. מה המערכת מחזיקה ←" },
  };
  return (
    <>
      {a === "shul" && <Mockup />}
      {a === "business" && <BusinessMockup />}
      {a === "mosad" && <MosadMockup />}
      {a === "journal" && <JournalMockup brand={loadBrand() ?? DEFAULT_BRAND} />}
      <p className="mt-4 text-center text-sm text-cream/60">
        <a
          href={link[a].href}
          className="border-b border-gold/60 text-gold hover:text-cream"
          onClick={() => track("demo_click", { location, demo: a })}
        >
          {link[a].label}
        </a>
      </p>
    </>
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

/* 1ב. רצועת עובדות: למה לסמוך, מיד אחרי הכותרת. במובייל גם הטלפון של הקהל כאן. */
function Facts() {
  const audience = useAudience();
  return (
    <section aria-label="עובדות" className="relative border-y border-gold/25 bg-navy text-cream">
      <div className="container-page py-10">
        <Reveal className="lg:hidden">
          <div className="mb-10">
            <AudienceMockup audience={audience} location="mobile-mockup" />
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

/* 2ב. השבוע של גבאי: הכאב האחד וההבטחה (השער "בית כנסת") */
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
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={DEMO_URL}
            className="btn-whatsapp-gold w-full sm:w-auto"
            onClick={() => track("demo_click", { location: "gabbai-week" })}
          >
            {gabbaiWeek.demoLabel}
          </a>
          <WhatsAppCta variant="outline" className="w-full sm:w-auto" label="לשיחה על בית הכנסת שלכם" location="gabbai-week" audience="shul" />
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-12 max-w-2xl">
        <Quote t={testimonials.gabbai} tone="navy" />
      </Reveal>
    </Section>
  );
}

/** ציטוט של לקוח, ליד נקודת ההחלטה שהוא מחזק. */
function Quote({ t, tone }: { t: Testimonial; tone: "navy" | "cream" }) {
  const navy = tone === "navy";
  return (
    <figure className={`rounded-2xl border p-6 text-start ${navy ? "border-gold/40 bg-cream/5" : "border-gold-deep/30 bg-white/60 shadow-card"}`}>
      <blockquote className={`text-lg leading-relaxed ${navy ? "text-cream/90" : "text-navy/85"}`}>{t.quote}</blockquote>
      <figcaption className={`mt-3 text-sm font-medium ${navy ? "text-gold" : "text-gold-deep"}`}>{t.who}</figcaption>
    </figure>
  );
}

/* 2ג. למנהלי מוסדות (השער "מוסד"): בלי הדגמה כללית, אז קצר וישר */
function Mosad() {
  return (
    <Section tone="cream" id="mosad" labelledBy="mosad-title" arches={false}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <Heading id="mosad-title" eyebrow={mosad.eyebrow} title={mosad.title} tone="cream" align="start" />
          <p className="text-lg leading-relaxed text-navy/85 sm:text-xl">{mosad.intro}</p>
          <p className="mt-6 border-r-2 border-gold-deep/60 pr-4 text-base leading-relaxed text-navy/70">{mosad.next}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <WhatsAppCta variant="navy" className="w-full sm:w-auto" label={mosad.cta} location="mosad" audience="mosad" />
            <PhoneCta variant="navy" className="w-full sm:w-auto" location="mosad" />
          </div>
        </Reveal>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:pt-14">
          {mosad.points.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 100} className="card-lift flex gap-4 rounded-2xl bg-white/60 p-5 shadow-card ring-1 ring-navy/5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-deep font-title text-lg text-gold-deep">
                {i + 1}
              </span>
              <div>
                <p className="font-title text-xl font-medium text-navy">{p.title}</p>
                <p className="mt-1 leading-relaxed text-navy/75">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* 4. שירותים ומחירים: ארבעה כרטיסים, אחד לכל שער, ושורה אחת למה שמסביב */
function Services() {
  const audience = useAudience();
  return (
    <Section tone="cream" id="services" labelledBy="services-title">
      <Reveal>
        <Heading id="services-title" eyebrow="שירותים ומחירים" title="מה אני מציע, וכמה זה עולה" tone="cream" />
      </Reveal>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => {
          const on = audience === s.audience;
          return (
            <Reveal
              as="li"
              key={s.title}
              delay={i * 80}
              className={`card-lift flex flex-col rounded-2xl p-7 shadow-card ring-1 ${on ? "bg-navy text-cream ring-navy" : "bg-white/60 text-navy ring-navy/5"}`}
            >
              {on && <p className="eyebrow mb-2 text-gold">בחרתם למעלה</p>}
              <h3 className="font-title text-2xl font-medium">{s.title}</h3>
              <p className={`mt-3 flex-1 leading-relaxed ${on ? "text-cream/80" : "text-navy/75"}`}>{s.desc}</p>
              <div className={`mt-6 border-t pt-4 ${on ? "border-gold/40" : "border-gold-deep/30"}`}>
                <p className={`font-title text-2xl font-medium ${on ? "text-gold" : "text-gold-deep"}`}>{s.price}</p>
                {s.note && <p className={`mt-1 text-sm ${on ? "text-cream/70" : "text-navy/60"}`}>{s.note}</p>}
                {s.journal && (
                  <a
                    href="#journal"
                    className={`mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline ${on ? "text-gold" : "text-gold-deep"}`}
                    onClick={() => track("journal_section_click", { location: "services" })}
                  >
                    מה זה, ולמי ←
                  </a>
                )}
                {s.demoUrl && (
                  <a
                    href={s.demoUrl}
                    className={`mt-2 inline-block text-sm font-medium underline-offset-4 hover:underline ${on ? "text-gold" : "text-gold-deep"}`}
                    onClick={() => track("demo_click", { location: "services", demo: s.audience })}
                  >
                    לראות הדגמה חיה ←
                  </a>
                )}
              </div>
            </Reveal>
          );
        })}
      </ul>

      <Reveal>
        <ul className="mx-auto mt-8 grid max-w-4xl gap-4 rounded-2xl border border-navy/10 p-5 sm:grid-cols-3 sm:divide-x sm:divide-x-reverse sm:divide-navy/10">
          {servicesStrip.map((it) => (
            <li key={it.label} className="text-center">
              <p className="text-sm text-navy/70">{it.label}</p>
              <p className="mt-1 font-title text-xl font-medium text-gold-deep">{it.price}</p>
              <p className="text-xs text-navy/55">{it.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-navy/70">{servicesNote}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <WhatsAppCta variant="navy" className="w-full sm:w-auto" location="services" />
          <PhoneCta variant="navy" className="w-full sm:w-auto" location="services" />
        </div>
      </Reveal>
    </Section>
  );
}

/* 4ב. הדגמות חיות: שתי מערכות שאפשר לפתוח וללחוץ על הכול. העסק הוא השער "עסק". */
function Demos() {
  return (
    <Section tone="navy" id="demos" labelledBy="demos-title" arches={false}>
      <Reveal>
        <Heading id="demos-title" eyebrow="דוגמאות חיות" title="מערכות שבניתי. לנסות בעצמכם." tone="navy" />
        <p className="mx-auto -mt-6 mb-12 max-w-2xl text-center text-lg leading-relaxed text-cream/75">
          בלי התחברות ובלי להשאיר פרטים. הנתונים בדיוניים, אפשר ללחוץ על הכול, ולאפס.
        </p>
      </Reveal>

      <ul className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        {demos.map((d, i) => (
          <Reveal
            as="li"
            key={d.id}
            delay={i * 150}
            id={d.id === "business" ? "business" : undefined}
            className="flex scroll-mt-24 flex-col items-center gap-6 rounded-3xl border border-cream/15 bg-cream/5 p-7 sm:p-8"
          >
            <a
              href={d.url}
              aria-label={d.cta}
              className="demo-phone shrink-0 transition hover:scale-[1.03]"
              onClick={() => track("demo_click", { location: "demos-mockup", demo: d.id })}
            >
              {d.id === "shul" ? <Mockup /> : <BusinessMockup />}
            </a>
            <div className="flex flex-col items-center text-center">
              <p className="eyebrow text-gold">{d.eyebrow}</p>
              <h3 className="mt-2 font-title text-2xl font-medium leading-tight sm:text-3xl">{d.title}</h3>
              <p className="mt-1 text-sm text-cream/60">{d.who}</p>
              <p className="mt-4 leading-relaxed text-cream/85">{d.text}</p>
              <ul className="mt-4 space-y-1.5 text-start text-cream/80">
                {d.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              {d.id === "business" && (
                <div className="mt-6 w-full">
                  <Quote t={testimonials.business} tone="navy" />
                </div>
              )}
              <a
                href={d.url}
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-6 font-medium text-navy transition hover:bg-cream"
                onClick={() => track("demo_click", { location: "demos", demo: d.id })}
              >
                {d.cta}
              </a>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* 5. מה מקבלים, ומה קורה ביום שאחרי */
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

        <Reveal className="mx-auto mt-10 max-w-2xl">
          <Quote t={testimonials.after} tone="cream" />
        </Reveal>

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

/* 5ב. היומן האישי הממותג (השער "יומן אישי"): שם וצבע, הטלפון החי, מחיר ושני כפתורים. */
function Journal() {
  const [brand, setBrand] = useState<Brand>(() => loadBrand() ?? DEFAULT_BRAND);
  const [named, setNamed] = useState(false);
  const update = (patch: Partial<Brand>) => {
    const next = { ...brand, ...patch };
    setBrand(next);
    saveBrand(next);
  };
  const name = brand.name.trim();
  const demoHref = demoUrl(JOURNAL_DEMO_URL, brand);
  const waHref = whatsappUrl(brand, "landing");

  return (
    <Section tone="navy" id="journal" labelledBy="journal-title">
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1fr_auto]">
        <Reveal>
          <Heading id="journal-title" eyebrow={journal.eyebrow} title={journal.title} tone="navy" align="start" />
          <p className="max-w-2xl text-lg leading-relaxed text-cream/85 sm:text-xl">{journal.lead}</p>
          <p className="mt-5 max-w-2xl border-r-2 border-gold/60 pr-4 text-base leading-relaxed text-cream/70">{journal.personal}</p>
          {journal.video.src && (
            <figure className="mt-6 max-w-2xl">
              <video
                className="w-full max-w-[280px] rounded-[1.6rem] border border-cream/20 bg-[#0d1730]"
                src={journal.video.src}
                poster={journal.video.poster || undefined}
                controls
                playsInline
                preload="metadata"
                onPlay={() => track("journal_video_play")}
              />
              <figcaption className="mt-2 text-sm text-cream/60">{journal.video.caption}</figcaption>
            </figure>
          )}
          <p className="mt-6 max-w-2xl leading-relaxed text-cream/80">{journal.who}</p>

          <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="font-title text-4xl font-medium text-gold">{journal.price}</p>
            <p className="text-sm text-cream/60">{journal.priceNote}</p>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cream/65">{journal.tiers}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={demoHref} className="btn-whatsapp-gold w-full sm:w-auto" onClick={() => track("journal_demo_click", { location: "journal", named: !!name })}>
              {name ? `לפתוח את היומן של ${name}` : journal.demoCta}
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-phone-cream w-full sm:w-auto"
              onClick={() => track("whatsapp_click", { location: "journal", label: journal.cta, named: !!name })}
            >
              <WhatsAppIcon />
              <span>{journal.cta}</span>
            </a>
          </div>
          <p className="mt-3 text-sm text-cream/60">{journal.demoHint}</p>
        </Reveal>

        <Reveal delay={150} className="mx-auto w-full max-w-sm lg:w-auto">
          <div className="mb-5 rounded-2xl border border-gold/40 bg-cream/5 p-4">
            <label htmlFor="journal-name" className="block font-title text-xl font-medium text-gold">
              {journal.tryTitle}
            </label>
            <p className="mt-1 text-sm text-cream/70">{journal.tryHint}</p>
            <input
              id="journal-name"
              className="mt-3 min-h-[48px] w-full rounded-xl border border-cream/20 bg-navy px-4 text-base text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
              placeholder="שם פרטי"
              value={brand.name}
              maxLength={24}
              autoComplete="given-name"
              onChange={(e) => {
                update({ name: e.target.value });
                if (!named && cleanName(e.target.value)) {
                  setNamed(true);
                  track("journal_named", { location: "landing" });
                }
              }}
            />
            <div className="mt-3 flex items-center gap-3" role="radiogroup" aria-label="הצבע שלכם">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={brand.accent === a.id}
                  aria-label={a.name}
                  className="journal-swatch"
                  style={{ background: a.color } as CSSProperties}
                  onClick={() => {
                    update({ accent: a.id as AccentId });
                    track("journal_accent", { location: "landing", accent: a.id });
                  }}
                >
                  {brand.accent === a.id && (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
          <a href={demoHref} aria-label="לפתוח את הדגמת היומן" onClick={() => track("journal_demo_click", { location: "journal-mockup", named: !!name })}>
            <JournalMockup brand={brand} />
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
          {story.photo.src ? (
            <img
              src={story.photo.src}
              alt={story.photo.alt}
              loading="lazy"
              className="w-56 rounded-2xl object-cover shadow-card ring-1 ring-navy/10 sm:w-64"
            />
          ) : (
            <img
              src="/ephraim.jpg"
              width={560}
              height={560}
              alt="אפרים עטיה"
              loading="lazy"
              className="h-40 w-40 rounded-full object-cover ring-2 ring-gold-deep ring-offset-4 ring-offset-cream sm:h-48 sm:w-48"
            />
          )}
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
