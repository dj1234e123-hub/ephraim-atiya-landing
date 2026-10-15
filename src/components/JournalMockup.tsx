/**
 * הדמיה של מסך "היום" ביומן האישי, בתוך טלפון. CSS בלבד (אותן מחלקות כמו Mockup), בצבעי המותג.
 * הנתונים הם הדמיה בלבד ומסומנים כך על המסך.
 */
export function JournalMockup() {
  return (
    <div className="mockup" aria-label="הדמיה של היומן האישי בטלפון" role="img">
      <div className="mockup-phone">
        <div className="mockup-screen">
          <div className="mockup-top">
            <span className="mockup-title">היומן של דוד · היום</span>
            <span className="mockup-badge">הדמיה</span>
          </div>
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
