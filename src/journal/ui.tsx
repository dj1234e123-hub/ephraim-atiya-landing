import { useEffect, type ReactNode } from "react";
import { AREAS, type Area } from "./seed";

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

/** תיבת סימון עגולה. */
export function Check({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} className={`check ${on ? "on" : ""}`} onClick={onChange}>
      {on && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

export function ScreenTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="font-title text-2xl font-medium">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-navy/60">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function AreaPicker({ value, onChange, all }: { value: Area | null; onChange: (a: Area | null) => void; all?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {all && (
        <button type="button" className={`chip ${value === null ? "chip-on" : ""}`} onClick={() => onChange(null)}>
          הכול
        </button>
      )}
      {AREAS.map((a) => (
        <button key={a} type="button" className={`chip ${value === a ? "chip-on" : ""}`} onClick={() => onChange(a)}>
          {a}
        </button>
      ))}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-navy/50">{text}</p>;
}

export function Bar({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}
