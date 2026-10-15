import type { CSSProperties } from "react";
import { accentColor, type Brand } from "../journal/brand";

/**
 * הטלפון החי בסקשן היומן: אותו מבנה כמו Mockup (CSS בלבד), אבל השם והצבע מגיעים מהמבקר.
 * ברגע שכותבים שם בשדה שלידו, הכותרת הופכת ל"היומן של …" והצבע משתנה. זה הרגע שמוכר את "ממותג".
 */
export function JournalMockup({ brand }: { brand: Brand }) {
  const name = brand.name.trim();
  const style = { "--accent": accentColor(brand.accent) } as CSSProperties;
  return (
    <div className="mockup mockup-journal" style={style} aria-label={name ? `הדמיה של היומן של ${name} בטלפון` : "הדמיה של היומן האישי בטלפון"} role="img">
      <div className="mockup-phone">
        <div className="mockup-screen">
          <div className="mockup-top">
            <span className="mockup-title">{name ? `היומן של ${name}` : "היומן שלי"} · היום</span>
            <span className="mockup-badge">הדמיה</span>
          </div>
          <div className="mockup-greet">{name ? `בוקר טוב, ${name}` : "בוקר טוב"}</div>
          <div className="mockup-stats">
            <div className="mockup-stat"><b>4/5</b><span>קביעויות היום</span></div>
            <div className="mockup-stat"><b>21</b><span>ימים ברצף</span></div>
            <div className="mockup-stat"><b>3</b><span>משימות להיום</span></div>
          </div>
          <ul className="mockup-list">
            <li><i className="dot on" />קביעות בוקר<span>✓ 06:40</span></li>
            <li><i className="dot on" />הליכה 20 דק׳<span>✓</span></li>
            <li><i className="dot" />לשלוח הצעת מחיר<span>עסק</span></li>
            <li><i className="dot" />סיכום יום: מה היה טוב?<span>ערב</span></li>
          </ul>
          <div className="mockup-cta">+ משימה · + קביעות · סיכום יום</div>
        </div>
      </div>
    </div>
  );
}
