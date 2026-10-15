/**
 * נתוני ההדגמה. כל השמות, הטלפונים, הכתובות והסכומים בדיוניים.
 * התאריכים יחסיים להיום (היום = 0), כך שההדגמה תמיד נראית "חיה":
 * עבודות של היום, חוב שפתוח 40 יום, ביקור בפרויקט לפני יומיים.
 */
import { ME_ID, PARTNER_ID } from './demo'
import { today, toISODate } from './format'

const DAY = 86400000

/** 'YYYY-MM-DD' של היום + n ימים (מקומי). */
export const day = (n) => toISODate(new Date(Date.now() + n * DAY))

/** זמן מקומי ביום היום + n, כמחרוזת ISO (כמו שהמסד שומר). */
export function at(n, hhmm = '09:00') {
  const d = new Date(Date.now() + n * DAY)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

/** "נוצר" לפני n ימים, בשעה שמתאימה לעבודה בשטח. */
const made = (n, hhmm = '18:30') => at(n, hhmm)

let seq = 0
const id = (p) => `${p}-${++seq}`

export function buildSeed() {
  seq = 0
  const T = today()
  const ws = { id: 'ws-demo', name: 'אלישע ודוד', business_name: 'אלישע אינסטלציה', vat_percent: 18, is_demo: true, created_at: made(-120) }

  const profiles = [
    { id: ME_ID, workspace_id: ws.id, full_name: 'אלישע', phone: '050-000-0001', can_be_assigned: true, assignments_seen_at: at(-2, '21:00'), created_at: made(-120) },
    { id: PARTNER_ID, workspace_id: ws.id, full_name: 'דוד', phone: '050-000-0002', can_be_assigned: true, assignments_seen_at: at(-1, '21:00'), created_at: made(-120) },
  ]

  const dests = [
    { id: 'd-1', workspace_id: ws.id, label: 'אלישע - מזרחי', account_name: 'אלישע אינסטלציה', bank_name: 'בנק מזרחי', bank_branch: '461', bank_account: '000000', bit_phone: '050-000-0001', adds_vat: false, note: null, sort_order: 1, created_at: made(-120) },
    { id: 'd-2', workspace_id: ws.id, label: 'דוד - פועלים (עם חשבונית)', account_name: 'דוד', bank_name: 'בנק הפועלים', bank_branch: '782', bank_account: '000000', bit_phone: null, adds_vat: true, note: 'חשבונית מס תישלח אחרי התשלום', sort_order: 2, created_at: made(-120) },
  ]

  const cust = (cid, name, phone, address, extra = {}) => ({
    id: cid, workspace_id: ws.id, name, phone, address, notes: null,
    payment_destination_id: null, created_at: made(-90), created_by: ME_ID, updated_at: made(-90), updated_by: ME_ID,
    deleted_at: null, deleted_by: null, ...extra,
  })
  const customers = [
    cust('c-1', 'משפחת לוינסון', '052-000-1101', 'הגפן 12, אפרת'),
    cust('c-2', 'ועד הבית רמב״ן 9', '054-000-1102', 'רמב״ן 9, ירושלים', { notes: 'איש קשר: שמעון, דירה 3. יש חניה בחצר.', payment_destination_id: 'd-2' }),
    cust('c-3', 'יוסי אברמוביץ', '050-000-1103', 'הרימון 4, אלון שבות'),
    cust('c-4', 'רחל כהן', null, 'בן יהודה 23, בית שמש', { notes: 'הגיעה דרך השכן. אין מספר טלפון.' }),
    cust('c-5', 'דוד פרידמן', '052-000-1105', 'הזית 7, נווה דניאל'),
    cust('c-6', 'ישיבת אור החיים', '02-000-1106', 'הדקל 1, ירושלים', { notes: 'לתאם עם המנהל האדמיניסטרטיבי. כניסה מהחניה האחורית.', payment_destination_id: 'd-2' }),
    cust('c-7', 'משה גולדברג', '053-000-1107', 'שבטי ישראל 18, ירושלים'),
    cust('c-8', 'משפחת ביטון', '050-000-1108', 'התאנה 5, אפרת'),
    cust('c-9', 'אבי מזרחי', '054-000-1109', 'הארז 9, קרית ארבע'),
    cust('c-10', 'חנה שפירא', '052-000-1110', 'רבי עקיבא 30, בית שמש'),
    cust('c-11', 'נתן רוזנברג', '050-000-1111', 'הברוש 14, תקוע'),
    cust('c-12', 'יעקב ושרה אדלר', '052-000-1112', 'הזית 21, אפרת', { notes: 'וילה. הכלב בחצר ידידותי.' }),
    cust('c-13', 'מרדכי קליין', '053-000-1113', 'שמואל הנביא 40, ירושלים'),
    cust('c-14', 'אליהו חדד', '050-000-1114', 'השקד 3, אלון שבות'),
    cust('c-15', 'גן ילדים ניצנים', '02-000-1115', 'הנרקיס 2, אפרת'),
  ]

  const job = (jid, o) => ({
    id: jid, workspace_id: ws.id, kind: 'private', customer_id: null, title: '', issue_type: null,
    description: null, work_notes: null, status: 'new', price: 0, pricing_mode: 'total',
    scheduled_at: null, duration_hours: null, assignees: [], assigned_at: null, assigned_by: null,
    is_urgent: false, notes: null, created_at: made(-1), created_by: ME_ID, updated_at: made(-1), updated_by: ME_ID,
    deleted_at: null, deleted_by: null, quote_id: null,
    ...o,
    // מי ששויך נרשם כשויך, כמו הטריגר במסד האמיתי
    ...(o.assignees?.length && !o.assigned_at ? { assigned_at: o.created_at || made(-1), assigned_by: o.created_by || ME_ID } : {}),
  })

  const jobs = [
    // היום
    job('j-1', { customer_id: 'c-3', title: 'סתימה במטבח', issue_type: 'סתימה', status: 'scheduled', price: 350, scheduled_at: at(0, '08:00'), assignees: [ME_ID], created_at: made(-2), description: 'הכיור לא מתנקז מאז אתמול בערב, ניסו שפכטל ולא עזר.' }),
    job('j-2', { customer_id: 'c-7', title: 'נזילה מתחת לכיור', issue_type: 'נזילה', status: 'in_progress', price: 450, scheduled_at: at(0, '10:00'), assignees: [PARTNER_ID], is_urgent: true, created_at: made(-1, '22:10'), created_by: PARTNER_ID, description: 'רצפת המטבח רטובה כל בוקר. סגרו את הברז הראשי של הכיור.' }),
    job('j-3', { customer_id: 'c-1', title: 'החלפת דוד שמש 150 ליטר', issue_type: 'דוד שמש', status: 'scheduled', price: 2800, scheduled_at: at(0, '12:30'), assignees: [ME_ID, PARTNER_ID], created_at: made(-6), quote_id: 'q-2', description: 'הדוד הישן מחליד ונוזל מלמעלה. הצעת מחיר אושרה בוואטסאפ.' }),
    job('j-4', { customer_id: 'c-8', title: 'התקנת ברז קיר במרפסת', issue_type: 'התקנה', status: 'scheduled', price: 0, scheduled_at: at(0, '16:00'), assignees: [ME_ID], created_at: made(-3), description: 'רוצים נקודת מים למרפסת בשביל הגינה.' }),
    // אתמול
    job('j-5', { customer_id: 'c-5', title: 'פתיחת סתימה בשירותים', issue_type: 'סתימה', status: 'done', price: 400, duration_hours: 1, scheduled_at: at(-1, '09:00'), assignees: [ME_ID], created_at: made(-2), work_notes: 'פתיחה עם ספירלה, הוצאו מגבונים. הודרכו לא לזרוק מגבונים.' }),
    job('j-6', { customer_id: 'c-9', title: 'תיקון נזילה בצנרת אמבטיה', issue_type: 'נזילה', status: 'done', price: 600, duration_hours: 1.5, scheduled_at: at(-1, '11:30'), assignees: [ME_ID], created_at: made(-3), work_notes: 'הוחלף קטע צינור 16 מ"מ מאחורי הקיר. נבדק לחץ, יבש.' }),
    // השבוע שעבר
    job('j-7', { customer_id: 'c-10', title: 'החלפת סיפון וברז כיור', issue_type: 'התקנה', status: 'done', price: 700, duration_hours: 1, scheduled_at: at(-3, '14:00'), assignees: [PARTNER_ID], created_at: made(-4), created_by: PARTNER_ID }),
    job('j-8', { customer_id: 'c-13', title: 'תיקון דוד שמש - החלפת גוף חימום', issue_type: 'דוד שמש', status: 'done', price: 1200, duration_hours: 2, scheduled_at: at(-6, '10:00'), assignees: [ME_ID], created_at: made(-7), work_notes: 'גוף חימום 2500W הוחלף, תרמוסטט תקין.' }),
    job('j-9', { customer_id: 'c-4', title: 'ביוב סתום בחצר', issue_type: 'ביוב', status: 'done', price: 850, duration_hours: 2, scheduled_at: at(-20, '08:00'), assignees: [ME_ID, PARTNER_ID], created_at: made(-21) }),
    job('j-10', { customer_id: 'c-11', title: 'התקנת צנרת למכונת כביסה', issue_type: 'התקנה', status: 'done', price: 1500, duration_hours: 3, scheduled_at: at(-40, '09:00'), assignees: [PARTNER_ID], created_at: made(-41), created_by: PARTNER_ID }),
    // קדימה
    job('j-11', { customer_id: 'c-14', title: 'החלפת מחמם מים חשמלי', issue_type: 'דוד שמש', status: 'scheduled', price: 2600, scheduled_at: at(1, '09:00'), assignees: [ME_ID], created_at: at(0, '07:40'), created_by: PARTNER_ID, assigned_at: at(0, '07:40'), assigned_by: PARTNER_ID, description: 'המים לא מתחממים. דוד 80 ליטר, בן 15 שנה.' }),
    job('j-12', { customer_id: 'c-6', title: 'בדיקת לחץ מים בבניין הפנימייה', issue_type: 'תחזוקה', status: 'scheduled', price: 500, scheduled_at: at(1, '13:00'), assignees: [PARTNER_ID], created_at: made(-5) }),
    job('j-13', { customer_id: 'c-15', title: 'נזילה מהתקרה בחדר הפעוטות', issue_type: 'נזילה', status: 'scheduled', price: 0, scheduled_at: at(2, '07:30'), assignees: [ME_ID, PARTNER_ID], is_urgent: true, created_at: made(-1), description: 'כתם רטוב בתקרה, כנראה מהדירה שמעל. לתאם עם הדיירים.' }),
    job('j-14', { customer_id: 'c-5', title: 'התקנת מערכת סינון מים', issue_type: 'התקנה', status: 'scheduled', price: 1900, scheduled_at: at(5, '08:30'), assignees: [PARTNER_ID], created_at: made(-2) }),
    // בלי מועד
    job('j-15', { customer_id: 'c-8', title: 'ביוב מגרגר בחצר', issue_type: 'ביוב', status: 'new', price: 0, assignees: [], is_urgent: true, created_at: at(0, '06:50'), description: 'התקשרה בבוקר: ריח ביוב מהחצר והשוחה מבעבעת.' }),
    // בוטל
    job('j-17', { customer_id: 'c-3', title: 'החלפת אסלה', issue_type: 'התקנה', status: 'cancelled', price: 0, scheduled_at: at(-2, '15:00'), assignees: [ME_ID], created_at: made(-5), notes: 'הלקוח החליט לחכות לשיפוץ.' }),
    // החודש, הושלמו ושולמו
    job('j-20', { customer_id: 'c-1', title: 'סתימה בכיור אמבטיה', issue_type: 'סתימה', status: 'done', price: 350, duration_hours: 0.5, scheduled_at: at(-8, '08:30'), assignees: [ME_ID], created_at: made(-9) }),
    job('j-21', { customer_id: 'c-14', title: 'החלפת ברז מטבח', issue_type: 'התקנה', status: 'done', price: 550, duration_hours: 1, scheduled_at: at(-10, '11:00'), assignees: [PARTNER_ID], created_at: made(-11), created_by: PARTNER_ID }),
    job('j-22', { customer_id: 'c-7', title: 'נזילה בניאגרה', issue_type: 'נזילה', status: 'done', price: 300, duration_hours: 0.5, scheduled_at: at(-12, '16:00'), assignees: [ME_ID], created_at: made(-12) }),
    job('j-23', { customer_id: 'c-6', title: 'החלפת דוד חשמלי 120 ליטר', issue_type: 'דוד שמש', status: 'done', price: 2400, duration_hours: 3, scheduled_at: at(-14, '09:00'), assignees: [ME_ID, PARTNER_ID], created_at: made(-16) }),
    job('j-24', { customer_id: 'c-9', title: 'התקנת מכונת כביסה ומייבש', issue_type: 'התקנה', status: 'done', price: 450, duration_hours: 1, scheduled_at: at(-17, '12:00'), assignees: [PARTNER_ID], created_at: made(-18), created_by: PARTNER_ID }),
    job('j-25', { customer_id: 'c-10', title: 'פתיחת סתימה בקו ביוב', issue_type: 'ביוב', status: 'done', price: 900, duration_hours: 2, scheduled_at: at(-24, '08:00'), assignees: [ME_ID], created_at: made(-25) }),
    job('j-26', { customer_id: 'c-13', title: 'תיקון ברז גן', issue_type: 'תחזוקה', status: 'done', price: 250, duration_hours: 0.5, scheduled_at: at(-27, '17:00'), assignees: [ME_ID], created_at: made(-27) }),
    // החודש שעבר
    job('j-30', { customer_id: 'c-3', title: 'החלפת צנרת תחת כיור', issue_type: 'התקנה', status: 'done', price: 800, duration_hours: 1.5, scheduled_at: at(-33, '10:00'), assignees: [ME_ID], created_at: made(-34) }),
    job('j-31', { customer_id: 'c-12', title: 'סתימה בכיור', issue_type: 'סתימה', status: 'done', price: 350, duration_hours: 0.5, scheduled_at: at(-36, '09:00'), assignees: [PARTNER_ID], created_at: made(-36), created_by: PARTNER_ID }),
    job('j-32', { customer_id: 'c-5', title: 'החלפת דוד שמש 200 ליטר', issue_type: 'דוד שמש', status: 'done', price: 3400, duration_hours: 4, scheduled_at: at(-39, '08:00'), assignees: [ME_ID, PARTNER_ID], created_at: made(-42) }),
    job('j-33', { customer_id: 'c-15', title: 'תיקון נזילה בברז כיתה', issue_type: 'נזילה', status: 'done', price: 300, duration_hours: 0.5, scheduled_at: at(-44, '13:00'), assignees: [ME_ID], created_at: made(-44) }),
    job('j-34', { customer_id: 'c-11', title: 'ניקוי קו ביוב ראשי', issue_type: 'ביוב', status: 'done', price: 1100, duration_hours: 2.5, scheduled_at: at(-47, '08:00'), assignees: [PARTNER_ID], created_at: made(-48), created_by: PARTNER_ID }),
    job('j-35', { customer_id: 'c-7', title: 'התקנת ברז אמבטיה', issue_type: 'התקנה', status: 'done', price: 600, duration_hours: 1, scheduled_at: at(-51, '11:00'), assignees: [ME_ID], created_at: made(-52) }),
    job('j-36', { customer_id: 'c-1', title: 'החלפת מיכל הדחה', issue_type: 'התקנה', status: 'done', price: 700, duration_hours: 1, scheduled_at: at(-55, '15:00'), assignees: [ME_ID], created_at: made(-55) }),
    // פרויקטים
    job('pj-1', { kind: 'project', customer_id: 'c-2', title: 'בניין רמב״ן 9 · צנרת ראשית', issue_type: 'התקנת צינור', status: 'in_progress', pricing_mode: 'per_visit', price: 0, assignees: [ME_ID], created_at: made(-25), scheduled_at: at(4, '08:00'), description: 'החלפת קו המים הראשי לשש דירות, קומה אחרי קומה. ועד הבית מאשר כל שלב בנפרד.', work_notes: 'עד עכשיו: קומת קרקע ודירות 1-6 מחוברות לקו החדש. נשאר: חיבור הגג וביטול הקו הישן.' }),
    job('pj-2', { kind: 'project', customer_id: 'c-12', title: 'וילה באפרת · חדר רחצה חדש', issue_type: 'שיפוץ', status: 'in_progress', pricing_mode: 'total', price: 18000, assignees: [ME_ID, PARTNER_ID], created_at: made(-12), scheduled_at: at(3, '09:00'), description: 'חדר רחצה שלם מהיסוד: פירוק, צנרת, ניקוז, כלים סניטריים. הריצוף של הקבלן שלהם.' }),
    // בסל המיחזור
    job('j-del-1', { customer_id: 'c-3', title: 'סתימה במטבח (כפול)', issue_type: 'סתימה', status: 'new', price: 0, created_at: made(-2), deleted_at: at(-2, '19:00'), deleted_by: ME_ID }),
  ]

  const pay = (o) => ({
    id: id('pay'), workspace_id: ws.id, method: 'cash', received_by: null, third_party: null, note: null,
    created_at: made(-1), created_by: ME_ID, updated_at: made(-1), updated_by: ME_ID, deleted_at: null, deleted_by: null, ...o,
  })
  const payments = [
    pay({ job_id: 'j-5', amount: 400, paid_at: day(-1), method: 'cash', received_by: ME_ID }),
    pay({ job_id: 'j-7', amount: 700, paid_at: day(-3), method: 'bit', received_by: PARTNER_ID }),
    pay({ job_id: 'j-8', amount: 700, paid_at: day(-6), method: 'transfer', received_by: ME_ID, note: 'מקדמה, השאר אחרי שהמים יתחממו' }),
    pay({ job_id: 'j-20', amount: 350, paid_at: day(-8), method: 'cash', received_by: ME_ID }),
    pay({ job_id: 'j-21', amount: 550, paid_at: day(-10), method: 'bit', received_by: PARTNER_ID }),
    pay({ job_id: 'j-22', amount: 300, paid_at: day(-12), method: 'cash', received_by: ME_ID }),
    pay({ job_id: 'j-23', amount: 2400, paid_at: day(-13), method: 'transfer', received_by: PARTNER_ID }),
    pay({ job_id: 'j-24', amount: 450, paid_at: day(-17), method: 'cash', third_party: 'חנות הצנרת', note: 'הלקוח שילם ישירות על החומרים בחנות' }),
    pay({ job_id: 'j-25', amount: 900, paid_at: day(-24), method: 'bit', received_by: ME_ID }),
    pay({ job_id: 'j-26', amount: 250, paid_at: day(-27), method: 'cash', received_by: ME_ID }),
    pay({ job_id: 'pj-1', amount: 4000, paid_at: day(-13), method: 'transfer', received_by: ME_ID, note: 'על שני השלבים הראשונים' }),
    pay({ job_id: 'pj-2', amount: 6000, paid_at: day(-9), method: 'bit', received_by: PARTNER_ID, note: 'מקדמה' }),
    pay({ job_id: 'j-30', amount: 800, paid_at: day(-33), method: 'cash', received_by: ME_ID }),
    pay({ job_id: 'j-31', amount: 350, paid_at: day(-36), method: 'bit', received_by: PARTNER_ID }),
    pay({ job_id: 'j-32', amount: 3400, paid_at: day(-38), method: 'transfer', received_by: ME_ID }),
    pay({ job_id: 'j-33', amount: 300, paid_at: day(-44), method: 'cash', received_by: ME_ID }),
    pay({ job_id: 'j-34', amount: 1100, paid_at: day(-46), method: 'check', received_by: PARTNER_ID }),
    pay({ job_id: 'j-35', amount: 600, paid_at: day(-51), method: 'cash', received_by: ME_ID }),
    pay({ job_id: 'j-36', amount: 700, paid_at: day(-55), method: 'bit', received_by: ME_ID }),
  ]

  const exp = (o) => ({
    id: id('exp'), workspace_id: ws.id, job_id: null, category: 'materials', supplier: null, paid_at: null, paid_by: null, note: null,
    created_at: made(-1), created_by: ME_ID, updated_at: made(-1), updated_by: ME_ID, deleted_at: null, deleted_by: null, ...o,
  })
  const expenses = [
    exp({ job_id: 'j-6', category: 'materials', amount: 480, spent_at: day(-1), supplier: 'צנרת ירושלים', note: 'צינור 16 ומחברים' }),
    exp({ category: 'fuel', amount: 350, spent_at: day(-2), paid_at: day(-2), paid_by: ME_ID }),
    exp({ job_id: 'pj-2', category: 'materials', amount: 1250, spent_at: day(-4), supplier: 'ח.ש. חומרי אינסטלציה', paid_at: day(-4), paid_by: PARTNER_ID, note: 'צנרת מים חמים וקרים' }),
    exp({ job_id: 'pj-1', category: 'materials', amount: 2200, spent_at: day(-7), supplier: 'צנרת ירושלים', note: 'קו ראשי 32 מ"מ + מחלקים' }),
    exp({ category: 'tools', amount: 690, spent_at: day(-8), supplier: 'כלי עבודה בע"מ', paid_at: day(-8), paid_by: ME_ID, note: 'מפתח צינורות חדש' }),
    exp({ category: 'fuel', amount: 320, spent_at: day(-10), paid_at: day(-10), paid_by: PARTNER_ID }),
    exp({ job_id: 'pj-1', category: 'subcontractor', amount: 1600, spent_at: day(-14), paid_at: day(-14), paid_by: ME_ID, note: 'אחמד · 4 שעות' }),
    exp({ job_id: 'j-9', category: 'materials', amount: 540, spent_at: day(-20), supplier: 'צנרת ירושלים', paid_at: day(-20), paid_by: ME_ID }),
    exp({ category: 'vehicle', amount: 900, spent_at: day(-23), paid_at: day(-23), paid_by: PARTNER_ID, note: 'טיפול 30,000' }),
    exp({ category: 'materials', amount: 1100, spent_at: day(-38), supplier: 'ח.ש. חומרי אינסטלציה', note: 'דוד שמש 200 ליטר · על החשבון' }),
    exp({ job_id: 'j-32', category: 'materials', amount: 900, spent_at: day(-39), supplier: 'ח.ש. חומרי אינסטלציה', paid_at: day(-39), paid_by: PARTNER_ID }),
    exp({ category: 'fuel', amount: 400, spent_at: day(-50), paid_at: day(-50), paid_by: ME_ID }),
    exp({ category: 'accounting', amount: 450, spent_at: day(-45), paid_at: day(-45), paid_by: ME_ID, note: 'רו"ח · חודשי' }),
    exp({ category: 'tools', amount: 120, spent_at: day(-35), paid_at: day(-35), paid_by: ME_ID, note: 'נקנה פעמיים בטעות', deleted_at: at(-35, '20:00'), deleted_by: PARTNER_ID }),
  ]

  const visit = (o) => ({
    id: id('visit'), workspace_id: ws.id, duration_hours: null, work_done: null, assignees: [ME_ID], helpers: null, helper_hours: null, work_type: null, price: 0,
    created_at: made(-1), created_by: ME_ID, updated_at: made(-1), updated_by: ME_ID, deleted_at: null, deleted_by: null, ...o,
  })
  const job_visits = [
    visit({ id: 'v-1', job_id: 'pj-1', visited_on: day(-21), duration_hours: 4, work_type: 'התקנת צינור', work_done: 'פירוק הקו הישן בקומת הקרקע והנחת קו 32 מ"מ חדש עד המחלק.', assignees: [ME_ID, PARTNER_ID], price: 1800, created_at: at(-21, '17:00') }),
    visit({ id: 'v-2', job_id: 'pj-1', visited_on: day(-14), duration_hours: 5, work_type: 'התקנת צינור', work_done: 'קו מים חדש לדירות 1-3, כולל ברזי ניתוק לכל דירה.', assignees: [ME_ID], helpers: 'אחמד', helper_hours: 4, price: 2200, created_at: at(-14, '18:00') }),
    visit({ id: 'v-3', job_id: 'pj-1', visited_on: day(-7), duration_hours: 3.5, work_type: 'התקנת צינור', work_done: 'חיבור המחלקים בקומה 2 ובדיקת לחץ. אין נזילות.', assignees: [ME_ID, PARTNER_ID], price: 1500, created_at: at(-7, '16:30') }),
    visit({ id: 'v-4', job_id: 'pj-1', visited_on: day(-2), duration_hours: 6, work_type: 'התקנת צינור', work_done: 'דירות 4-6 חוברו לקו החדש. נשאר חיבור הגג וביטול הקו הישן.', assignees: [ME_ID], helpers: 'אחמד', price: 2600, created_at: at(-2, '19:00') }),
    visit({ id: 'v-5', job_id: 'pj-2', visited_on: day(-9), duration_hours: 7, work_type: 'שיפוץ', work_done: 'פירוק אמבטיה, אסלה וכיור ישנים וסילוק הפסולת. סגירת קווים ישנים.', assignees: [ME_ID, PARTNER_ID], created_at: at(-9, '18:00') }),
    visit({ id: 'v-6', job_id: 'pj-2', visited_on: day(-4), duration_hours: 6, work_type: 'שיפוץ', work_done: 'צנרת מים חמים וקרים חדשה בקירות, הכנה למקלחון ולכיור כפול.', assignees: [ME_ID, PARTNER_ID], created_at: at(-4, '17:30') }),
  ]

  const work_types = ['נזילה', 'סתימה', 'ביוב', 'דוד שמש', 'התקנה', 'שיפוץ', 'תחזוקה', 'התקנת צינור']
    .map((label, i) => ({ id: `wt-${i + 1}`, workspace_id: ws.id, label, sort_order: i + 1, created_at: made(-120) }))

  // תמונות "לפני ואחרי" בדיוניות: מצוירות בקוד (SVG), לא צילומים אמיתיים.
  const photo = (o) => ({ id: id('ph'), workspace_id: ws.id, visit_id: null, note: null, created_at: made(-1), created_by: ME_ID, data: null, ...o })
  const job_photos = [
    photo({ job_id: 'pj-1', phase: 'before', path: 'seed/pj1-before-1', label: 'לפני · קו ראשי ישן', tone: 'rust', created_at: at(-21, '08:10') }),
    photo({ job_id: 'pj-1', phase: 'before', path: 'seed/pj1-before-2', label: 'לפני · מחלק חלוד', tone: 'rust', created_at: at(-21, '08:12') }),
    photo({ job_id: 'pj-1', phase: 'after', path: 'seed/pj1-after-1', label: 'אחרי · קו 32 מ"מ חדש', tone: 'new', created_at: at(-7, '16:20') }),
    photo({ job_id: 'pj-1', visit_id: 'v-4', phase: 'visit', path: 'seed/pj1-v4-1', label: 'דירה 5 · ברז ניתוק', tone: 'new', created_at: at(-2, '18:50') }),
    photo({ job_id: 'j-8', phase: 'before', path: 'seed/j8-before-1', label: 'לפני · גוף חימום שרוף', tone: 'rust', created_at: at(-6, '10:05') }),
    photo({ job_id: 'j-8', phase: 'after', path: 'seed/j8-after-1', label: 'אחרי · גוף חימום חדש', tone: 'new', created_at: at(-6, '11:40') }),
  ]

  // הצעות מחיר. התוספת של ההדגמה: במערכת של אלישע עדיין אין מודול כזה.
  const item = (desc, qty, unit_price) => ({ id: id('qi'), desc, qty, unit_price })
  const quote = (o) => ({
    id: '', workspace_id: ws.id, customer_id: null, title: '', items: [], adds_vat: false, discount: 0, valid_days: 14, notes: null,
    status: 'draft', created_at: made(-1), created_by: ME_ID, updated_at: made(-1), sent_at: null, decided_at: null, job_id: null, ...o,
  })
  const quotes = [
    quote({ id: 'q-1', customer_id: 'c-10', title: 'שיפוץ חדר רחצה מלא', status: 'sent', created_at: at(-3, '20:15'), sent_at: at(-3, '20:30'), adds_vat: true, notes: 'לא כולל אריחים, ריצוף וחשמל. משך העבודה כ-4 ימים.',
      items: [item('פירוק אמבטיה, כלים וצנרת ישנה וסילוק פסולת', 1, 1200), item('צנרת מים חמים וקרים חדשה', 1, 3800), item('נקודת ביוב וניקוז חדשה למקלחון', 1, 1400), item('התקנת כלים סניטריים: אסלה, כיור, ברזים', 1, 2400), item('חומרי צנרת ואביזרים', 1, 2100)] }),
    quote({ id: 'q-2', customer_id: 'c-1', title: 'החלפת דוד שמש 150 ליטר', status: 'approved', created_at: at(-6, '19:00'), sent_at: at(-6, '19:10'), decided_at: at(-5, '09:30'), job_id: 'j-3',
      items: [item('דוד שמש 150 ליטר כולל קולט', 1, 2200), item('עבודה, התקנה והובלת הדוד הישן', 1, 600)] }),
    quote({ id: 'q-3', customer_id: 'c-8', title: 'קו ביוב חדש לחצר', status: 'draft', created_at: at(-1, '21:00'), notes: 'תלוי במה שנמצא בחפירה.',
      items: [item('חפירה והנחת קו ביוב 110 מ"מ (למטר)', 12, 180), item('שוחת ביקורת', 2, 350), item('חיבור לקו העירוני', 1, 900)] }),
    quote({ id: 'q-4', customer_id: 'c-11', title: 'החלפת צנרת ראשית בדירה', status: 'rejected', created_at: at(-30, '18:00'), sent_at: at(-30, '18:20'), decided_at: at(-25, '12:00'), notes: 'הלקוח בחר לדחות לשנה הבאה.',
      items: [item('החלפת צנרת ראשית לכל הדירה', 1, 6500), item('חומרים', 1, 1800)] }),
    quote({ id: 'q-5', customer_id: 'c-6', title: 'תחזוקה שנתית למבני הישיבה', status: 'sent', created_at: at(-12, '17:00'), sent_at: at(-12, '17:30'), valid_days: 7, adds_vat: true,
      items: [item('בדיקת כל נקודות המים והברזים', 1, 900), item('ניקוי אבנית בדודים', 3, 350), item('החלפת ברזים שחוקים', 6, 180)] }),
  ]

  return {
    version: 1, seededOn: T,
    workspace: ws, profiles, payment_destinations: dests, customers, jobs, payments, expenses, job_visits, work_types, job_photos, quotes,
  }
}
