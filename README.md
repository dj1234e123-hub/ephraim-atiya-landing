# אפרים עטיה · דף נחיתה

דף נחיתה בעברית (RTL, mobile-first) לעסק "ייעוץ ובניית מערכות ניהול".

- Vite + React + TypeScript + Tailwind CSS
- הצבעים והפונטים של המותג: `tailwind.config.ts`
- כל התוכן: `src/content.ts`
- ארבעת השערים בכותרת (בית כנסת, מוסד, עסק, יומן): `src/audience.ts`. הבחירה נשמרת למבקר, מחליפה את הטלפון המודמה, ומכניסה לכל כפתורי הוואטסאפ הודעה מוכנה לפי הקהל.
- הלוגו (SVG בקוד): `src/components/Logo.tsx`

```bash
npm install
npm run dev      # פיתוח
npm run build    # בנייה ל-dist/
npm run preview  # תצוגה של הבנייה
```

## עמודים

- `/` דף הנחיתה · `/terms/` תנאי מסירה ושירות · `/accessibility/` הצהרת נגישות ופרטיות · `/journal/` הדגמת היומן האישי הממותג (קוד ב-`src/journal/`, תכנון ומיקוד ב-`journal/README.md`)
- `demo/`: ההדגמה (demo.ephraim-atiya.com). זמנים אמיתיים למיקום, הכנות לשבת, הדפסות ב-`#print/…`. תכנון: `docs/gabbai-plan.md`
- `demo-business/`: הדגמת עסק האינסטלציה (business.ephraim-atiya.com), העתק של מערכת שנבנתה ללקוח אמיתי (שביקש לא להופיע בשמו), עם שמות ונתונים בדיוניים והצעות מחיר. פרויקט Vite נפרד עם README משלו
- `public/robots.txt`, `public/sitemap.xml`: לעדכן אם מוסיפים עמוד

## מה נשאר למלא

- המלצות (`testimonials` ב-`src/content.ts`): להוסיף שם ותחום ליד ציטוט רק באישור הלקוח.
- פוטר: מספר עוסק/ח.פ. וכתובת מייל, כשיימסרו.
