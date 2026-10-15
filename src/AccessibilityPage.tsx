import { Mark, Wordmark } from "./components/Logo";
import { WhatsAppCta } from "./components/WhatsApp";
import { brand, PHONE_DISPLAY, PHONE_TEL } from "./content";
import { accessibility, ACCESSIBILITY_UPDATED, privacy, type LegalSection } from "./accessibility";

/** עמוד "הצהרת נגישות ופרטיות". */
export function AccessibilityPage() {
  return (
    <>
      <header className="bg-navy text-cream">
        <div className="container-page flex items-center justify-between py-4">
          <a href="/" className="flex items-center gap-3" aria-label="לדף הבית">
            <Mark className="h-10 w-auto" title="" />
            <Wordmark size="sm" showLatin={false} />
          </a>
          <a href="/" className="text-sm text-cream/70 hover:text-cream">
            לדף הבית ←
          </a>
        </div>
      </header>

      <main className="bg-cream text-navy">
        <div className="container-page max-w-3xl py-14 sm:py-20">
          <p className="eyebrow text-gold-deep">האתר הזה</p>
          <h1 className="mt-2 font-title text-4xl font-medium leading-tight sm:text-5xl">הצהרת נגישות ופרטיות</h1>
          <p className="mt-2 text-sm text-navy/50">{ACCESSIBILITY_UPDATED}</p>

          <Block id="accessibility" title="נגישות" sections={accessibility} />
          <Block id="privacy" title="פרטיות" sections={privacy} />

          <div className="mt-16 rounded-2xl bg-navy p-8 text-center text-cream">
            <p className="font-title text-2xl">משהו לא נגיש או לא ברור?</p>
            <p className="mt-2 text-cream/75">כתבו לי ואטפל בזה.</p>
            <WhatsAppCta className="mt-6 w-full sm:w-auto" label="לכתוב בוואטסאפ" location="accessibility" />
            <p className="mt-4 text-sm text-cream/60">
              <a href={PHONE_TEL} dir="ltr" className="hover:text-cream">
                {PHONE_DISPLAY}
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-navy py-8 text-center text-sm text-cream/60">
        {brand.name} · {brand.field} · <span className="text-gold">{brand.slogan}</span>
      </footer>
    </>
  );
}

function Block({ id, title, sections }: { id: string; title: string; sections: LegalSection[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-12">
      <h2 id={`${id}-title`} className="font-title text-3xl font-medium text-navy">
        {title}
      </h2>
      <div className="mt-2 h-px w-16 bg-gold-deep" />
      <div className="mt-8 space-y-8">
        {sections.map((sec) => (
          <div key={sec.title}>
            <h3 className="font-title text-2xl font-medium">{sec.title}</h3>
            <ul className="mt-3 space-y-2 border-r-2 border-gold-deep/40 pr-5">
              {sec.items.map((it) => (
                <li key={it} className="leading-relaxed text-navy/85">
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
