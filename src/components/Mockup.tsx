/**
 * הדמיה של מסך מערכת (בית כנסת) בתוך טלפון. CSS בלבד, בצבעי המותג.
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
