/**
 * קבועים של ההדגמה. המערכת האמיתית (PlumbFlow) עובדת מול Supabase עם משתמשים
 * והרשאות. ההדגמה רצה כולה בדפדפן: אין התחברות, הנתונים בדיוניים ונשמרים
 * ב-localStorage, והמשתמש המחובר הוא תמיד אלישע.
 */
export const ME_ID = 'p-elisha'
export const PARTNER_ID = 'p-david'
export const STORAGE_KEY = 'ephraim_demo_plumbflow_v1'
export const TRY_KEY = 'ephraim_demo_plumbflow_try_dismissed'

/** וואטסאפ של אפרים, עם הודעה מוכנה. היחיד בהדגמה שפותח וואטסאפ אמיתי. */
export const EPHRAIM_WA =
  'https://wa.me/972508221842?text=' +
  encodeURIComponent('שלום אפרים, ראיתי את ההדגמה של מערכת ניהול העסק באתר ואשמח לשיחה.')
export const LANDING_URL = 'https://ephraim-atiya.com/'
