import { ALEF_PATH } from "../alef";

type MarkProps = {
  className?: string;
  /** צבע הקשת והאות. ברירת מחדל: שמנת (על כחול). */
  stroke?: string;
  title?: string;
};

/**
 * הסמל: קשת דקה, אבן ראשה מוזהבת בראשה, האות א בפנים.
 */
export function Mark({ className = "h-16 w-auto", stroke = "#F6F1E7", title = "הסמל של אפרים עטיה" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 120 150"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      {/* הקשת */}
      <path
        d="M 18 142 V 70 A 42 42 0 0 1 102 70 V 142"
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* אבן הראשה */}
      <polygon points="47,18 73,18 69,46 51,46" fill="#C9A24A" />
      {/* האות א */}
      <path d={ALEF_PATH} fill={stroke} />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
  /** צבע הטקסט. */
  color?: "cream" | "navy";
  size?: "sm" | "lg";
  showLatin?: boolean;
};

/**
 * השם "אפרים עטיה" — היו״ד שב"עטיה" בזהב. "עטיה" תמיד עם יו״ד אחת.
 */
export function Wordmark({ className = "", color = "cream", size = "lg", showLatin = true }: WordmarkProps) {
  const text = color === "cream" ? "text-cream" : "text-navy";
  const gold = color === "cream" ? "text-gold" : "text-gold-deep";
  const name = size === "lg" ? "text-4xl sm:text-5xl" : "text-2xl";
  const latin = size === "lg" ? "text-sm sm:text-base tracking-[0.42em]" : "text-[11px] tracking-[0.38em]";
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className={`font-title font-medium leading-none ${name} ${text}`} translate="no">
        אפרים עט<span className={gold}>י</span>ה
      </span>
      {showLatin && (
        <span
          className={`font-latin mt-2 font-medium uppercase ${latin} ${text} opacity-80`}
          dir="ltr"
          translate="no"
          aria-hidden="true"
        >
          EPHRAIM ATIYA
        </span>
      )}
    </div>
  );
}
