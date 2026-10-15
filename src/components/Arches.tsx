/**
 * מוטיב הרקע: קשתות דקות ושקופות, כמו שערים. דקורטיבי בלבד.
 */
export function Arches({ tone = "cream", className = "" }: { tone?: "cream" | "navy"; className?: string }) {
  const stroke = tone === "cream" ? "#F6F1E7" : "#14213D";
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-full w-full ${className}`}
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMax slice"
    >
      <g fill="none" stroke={stroke} strokeWidth="1.25" opacity="0.08">
        {Array.from({ length: 7 }).map((_, i) => {
          const x = 100 + i * 170;
          return (
            <path key={i} d={`M ${x - 60} 420 V 200 A 60 60 0 0 1 ${x + 60} 200 V 420`} />
          );
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const x = 185 + i * 170;
          return (
            <path key={`b${i}`} d={`M ${x - 40} 420 V 290 A 40 40 0 0 1 ${x + 40} 290 V 420`} opacity="0.6" />
          );
        })}
      </g>
    </svg>
  );
}
