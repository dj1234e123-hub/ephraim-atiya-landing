/**
 * הדמיה של מסך "השבת הקרובה" מהמערכת לבית כנסת, בתוך טלפון. CSS בלבד, בצבעי המותג.
 * המספרים הם הדמיה בלבד ומסומנים כך על המסך.
 */
export function Mockup() {
  return (
    <div className="mockup" aria-label="הדמיה של מסך השבת הקרובה במערכת לבית כנסת" role="img">
      <div className="mockup-phone">
        <div className="mockup-screen">
          <div className="mockup-top">
            <span className="mockup-title">השבת הקרובה · פרשת נח</span>
            <span className="mockup-badge">הדמיה</span>
          </div>
          <div className="mockup-stats">
            <div className="mockup-stat"><b>17:46</b><span>הדלקת נרות</span></div>
            <div className="mockup-stat"><b>9/12</b><span>הכנות לשבת</span></div>
            <div className="mockup-stat"><b>8/8</b><span>עליות</span></div>
          </div>
          <ul className="mockup-list">
            <li><i className="dot on" />שעון שבת: מזגן אולם, עד 16:16<span>בוצע</span></li>
            <li><i className="dot on" />קידוש: משפחת פרידמן, הולדת הבת<span>סגור</span></li>
            <li><i className="dot" />לגלול ספר תורה לפרשת נח<span>15:46</span></li>
            <li><i className="dot" />2 אזכרות השבוע, עליות שובצו<span>תזכורת</span></li>
          </ul>
          <div className="mockup-cta">להדפיס דף שבת לדלת ולבימה</div>
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
