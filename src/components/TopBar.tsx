import { useEffect, useState } from "react";
import { Mark, Wordmark } from "./Logo";
import { WhatsAppCta } from "./WhatsApp";

/** סרגל עליון דק שמופיע רק אחרי שגוללים מעבר לכותרת, עם כפתור וואטסאפ תמיד בהישג יד (במחשב). */
export function TopBar() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`topbar ${shown ? "topbar-in" : ""}`} aria-hidden={!shown}>
      <div className="container-page flex items-center justify-between gap-4 py-2">
        <a href="#top" className="flex items-center gap-3" aria-label="לראש הדף">
          <Mark className="h-9 w-auto" title="" />
          <Wordmark size="sm" showLatin={false} />
        </a>
        <WhatsAppCta className="!min-h-[44px] !px-5 !text-base" label="לשיחת היכרות חינם" location="topbar" />
      </div>
    </div>
  );
}
