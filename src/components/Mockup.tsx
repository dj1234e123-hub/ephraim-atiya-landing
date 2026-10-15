/**
 * הדמיה של מסך מערכת בתוך טלפון. CSS בלבד, בצבעי המותג.
 * המספרים הם הדמיה בלבד ומסומנים כך על המסך.
 */
export function Mockup() {
  return (
    <div className="mockup" aria-label="הדמיה של מערכת ניהול לבית כנסת בטלפון" role="img">
      <div className="mockup-phone">
        <div className="mockup-screen">
          <div className="mockup-top">
            <span className="mockup-title">בית הכנסת · לוח ניהול</span>
            <span className="mockup-badge">הדמיה</span>
          </div>
          <div className="mockup-stats">
            <div className="mockup-stat"><b>142</b><span>מתפללים</span></div>
            <div className="mockup-stat"><b>₪8,450</b><span>נדרים החודש</span></div>
            <div className="mockup-stat"><b>7/7</b><span>עליות לשבת</span></div>
          </div>
          <ul className="mockup-list">
            <li><i className="dot on" />שיבוץ עליות לפרשת השבוע<span>הושלם</span></li>
            <li><i className="dot on" />תזכורות נדרים נשלחו<span>12</span></li>
            <li><i className="dot" />תחזוקה: מזגן בעזרת נשים<span>פתוח</span></li>
            <li><i className="dot" />תרומה חדשה לרשום<span>היום</span></li>
          </ul>
          <div className="mockup-cta">+ עלייה · + תרומה · + הודעה לציבור</div>
        </div>
      </div>
    </div>
  );
}

/** אותו טלפון, עם המסך של מערכת העסק (אינסטלציה): עבודות היום, כסף, והצעת מחיר שמחכה. */
export function BusinessMockup() {
  return (
    <div className="mockup" aria-label="הדמיה של מערכת ניהול לעסק אינסטלציה בטלפון" role="img">
      <div className="mockup-phone">
        <div className="mockup-screen">
          <div className="mockup-top">
            <span className="mockup-title">ניהול עסק · אינסטלציה</span>
            <span className="mockup-badge">הדמיה</span>
          </div>
          <div className="mockup-stats">
            <div className="mockup-stat"><b>4</b><span>עבודות היום</span></div>
            <div className="mockup-stat"><b>₪15,400</b><span>הכנסות החודש</span></div>
            <div className="mockup-stat"><b>₪2,950</b><span>לגבייה</span></div>
          </div>
          <ul className="mockup-list">
            <li><i className="dot on" />08:00 סתימה במטבח · אלישע<span>נקבעה</span></li>
            <li><i className="dot on" />10:00 נזילה מתחת לכיור · דוד<span>דחוף</span></li>
            <li><i className="dot" />הצעת מחיר: שיפוץ חדר רחצה<span>₪12,862</span></li>
            <li><i className="dot" />תיקון נזילה · ממתין לתשלום<span>₪600</span></li>
          </ul>
          <div className="mockup-cta">+ קריאה חדשה · סגירת יום · הצעת מחיר</div>
        </div>
      </div>
    </div>
  );
}
