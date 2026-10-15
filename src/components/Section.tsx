import type { ReactNode } from "react";
import { Arches } from "./Arches";

type Props = {
  id?: string;
  tone: "navy" | "cream";
  children: ReactNode;
  className?: string;
  arches?: boolean;
  labelledBy?: string;
};

export function Section({ id, tone, children, className = "", arches = true, labelledBy }: Props) {
  const bg = tone === "navy" ? "bg-navy text-cream" : "bg-cream text-navy";
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative overflow-hidden py-20 sm:py-28 ${bg} ${className}`}
    >
      {arches && <Arches tone={tone === "navy" ? "cream" : "navy"} />}
      <div className="container-page relative">{children}</div>
    </section>
  );
}

/** כותרת סקשן: שורת מבוא קטנה בזהב + כותרת בפרנק-ריהל. */
export function Heading({
  id,
  eyebrow,
  title,
  tone,
  align = "center",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  tone: "navy" | "cream";
  align?: "center" | "start";
}) {
  const gold = tone === "navy" ? "text-gold" : "text-gold-deep";
  return (
    <div className={`mb-12 ${align === "center" ? "text-center" : "text-start"}`}>
      {eyebrow && <p className={`eyebrow mb-3 ${gold}`}>{eyebrow}</p>}
      <h2 id={id} className="font-title text-3xl font-medium leading-tight sm:text-4xl">
        {title}
      </h2>
      <div className={`mt-5 h-px w-16 ${tone === "navy" ? "bg-gold" : "bg-gold-deep"} ${align === "center" ? "mx-auto" : ""}`} />
    </div>
  );
}
