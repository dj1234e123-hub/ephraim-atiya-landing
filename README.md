# אפרים עטיה · דף נחיתה

דף נחיתה בעברית (RTL, mobile-first) לעסק "ייעוץ ובניית מערכות ניהול".

- Vite + React + TypeScript + Tailwind CSS
- הצבעים והפונטים של המותג: `tailwind.config.ts`
- כל התוכן: `src/content.ts`
- הלוגו (SVG בקוד): `src/components/Logo.tsx`

```bash
npm install
npm run dev      # פיתוח
npm run build    # בנייה ל-dist/
npm run preview  # תצוגה של הבנייה
```

## עמודים

- `/` דף הנחיתה · `/terms/` תנאי מסירה ושירות · `/accessibility/` הצהרת נגישות ופרטיות
- `demo/` הדגמת בית הכנסת (demo.ephraim-atiya.com) · `demo-business/` הדגמת עסק האינסטלציה (business.ephraim-atiya.com), כל אחת פרויקט Vite נפרד עם README משלו
- `public/robots.txt`, `public/sitemap.xml`: לעדכן אם מוסיפים עמוד

## מה נשאר למלא

- המלצות (`testimonials` ב-`src/content.ts`): להוסיף שם ותחום ליד ציטוט רק באישור הלקוח.
- פוטר: מספר עוסק/ח.פ. וכתובת מייל, כשיימסרו.
