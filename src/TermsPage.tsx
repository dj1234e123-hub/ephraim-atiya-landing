import { Mark, Wordmark } from "./components/Logo";
import { WhatsAppCta } from "./components/WhatsApp";
import { brand, PHONE_DISPLAY, PHONE_TEL } from "./content";
import { terms, TERMS_VERSION } from "./terms";

/** עמוד "תנאי מסירה ושירות": קבוע, מצורף לכל הצעת מחיר. */
export function TermsPage() {
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
          <p className="eyebrow text-gold-deep">מצורף לכל הצעת מחיר</p>
          <h1 className="mt-2 font-title text-4xl font-medium leading-tight sm:text-5xl">תנאי מסירה ושירות</h1>
          <p className="mt-4 text-lg leading-relaxed text-navy/75">
            העקרונות הקבועים של העבודה איתי. המספרים שמשתנים מפרויקט לפרויקט, כמו מחירים, מספר מפגשי ההדרכה ואבני הדרך לתשלום,
            מופיעים בהצעת המחיר שלכם, והיא גוברת במקרה של סתירה.
          </p>
          <p className="mt-2 text-sm text-navy/50">{TERMS_VERSION}</p>

          <ol className="mt-12 space-y-10">
            {terms.map((sec, i) => (
              <li key={sec.title}>
                <h2 className="flex items-baseline gap-3 font-title text-2xl font-medium">
                  <span className="text-gold-deep">{i + 1}.</span>
                  {sec.title}
                </h2>
                <ul className="mt-3 space-y-2 border-r-2 border-gold-deep/40 pr-5">
                  {sec.items.map((it) => (
                    <li key={it} className="leading-relaxed text-navy/85">
                      {it}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <div className="mt-16 rounded-2xl bg-navy p-8 text-center text-cream">
            <p className="font-title text-2xl">יש שאלה על אחד הסעיפים?</p>
            <p className="mt-2 text-cream/75">עדיף לשאול לפני, לא אחרי.</p>
            <WhatsAppCta className="mt-6 w-full sm:w-auto" label="לשאול בוואטסאפ" />
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
