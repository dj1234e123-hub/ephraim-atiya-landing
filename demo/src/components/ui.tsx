import { useEffect, type ReactNode } from "react";

export const WA = "https://wa.me/972508221842?text=" + encodeURIComponent("שלום אפרים, ראיתי את ההדגמה של מערכת בית הכנסת באתר ואשמח לשיחה.");

/** תגית "במקום: …": מחברת כל מסך לבלגן שהגבאי מכיר. */
export function Instead({ what }: { what: string }) {
  return (
    <span className="tag">
      <span className="opacity-70">במקום:</span> {what}
    </span>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} aria-hidden="true" />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-title text-xl font-medium">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/5" aria-label="סגירה">
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

export function ScreenTitle({ title, instead, children }: { title: string; instead: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="font-title text-2xl font-medium">{title}</h1>
        <div className="mt-1">
          <Instead what={instead} />
        </div>
      </div>
      {children}
    </div>
  );
}

/** תצוגה מקדימה של הודעת וואטסאפ. לא נשלח באמת. */
export function WaPreview({ to, text }: { to: string; text: string }) {
  return (
    <div className="rounded-2xl bg-[#e7f6e3] p-4 text-navy">
      <p className="mb-2 text-xs text-navy/60">תצוגה מקדימה · אל: {to}</p>
      <p className="whitespace-pre-line rounded-xl bg-white p-3 text-sm leading-relaxed shadow-sm">{text}</p>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-navy/50">{text}</p>;
}

export const fmtDate = (k: string) => {
  const [y, m, d] = k.split("-");
  return `${Number(d)}.${Number(m)}.${y.slice(2)}`;
};
