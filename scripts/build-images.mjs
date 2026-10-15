// מייצר אחרי הבנייה את ה-favicon (dist/favicon.svg), אייקון המסך (dist/apple-touch-icon.png) ותמונת השיתוף (dist/og.jpg).
// הטקסט מצויר כנתיבים מתוך הפונטים של Google (מורדים בזמן הבנייה), כך שאין קובץ בינארי בריפו.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import opentype from "opentype.js";

const DIST = path.resolve("dist");
const NAVY = "#14213D", GOLD = "#C9A24A", CREAM = "#F6F1E7";
const FONTS = {
  frank500: "https://fonts.gstatic.com/s/frankruhllibre/v23/j8_96_fAw7jrcalD7oKYNX0QfAnPcbzNEEB7OoicBw73YWqVNRM.woff",
  heebo300: "https://fonts.gstatic.com/s/heebo/v28/NGSpv5_NC0k9P_v6ZUCbLRAHxK1E1yysd0mg.woff",
  cormorant500: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_s06KnTOjA.woff",
};
const ALEF = fs.readFileSync("src/alef.ts", "utf8").match(/"([^"]+)"/)[1];

const rev = (s) => [...s].reverse().join("");
function textPaths(font, text, cx, baseline, size, fill, { rtl = false, letterSpacing = 0, colorAt } = {}) {
  const t = rtl ? rev(text) : text;
  const w = font.getAdvanceWidth(t, size, { letterSpacing });
  return font
    .getPaths(t, cx - w / 2, baseline, size, { letterSpacing })
    .map((p, i) => {
      const d = p.toPathData(1);
      return d ? `<path d="${d}" fill="${(colorAt && colorAt(i, t[i])) || fill}"/>` : "";
    })
    .join("");
}
const mark = (x, y, s, stroke = CREAM) => `<g transform="translate(${x} ${y}) scale(${s})">
<path d="M 18 142 V 70 A 42 42 0 0 1 102 70 V 142" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>
<polygon points="47,18 73,18 69,46 51,46" fill="${GOLD}"/><path d="${ALEF}" fill="${stroke}"/></g>`;

async function loadFont(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font ${res.status}: ${url}`);
  return opentype.parse(await res.arrayBuffer());
}

async function ogImage() {
  const [frank, heebo, cormorant] = await Promise.all([loadFont(FONTS.frank500), loadFont(FONTS.heebo300), loadFont(FONTS.cormorant500)]);
  const name = "אפרים עטיה";
  const yodIdx = 1; // במחרוזת ההפוכה: ה, י, ט, ע ...
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="${NAVY}"/>
<path d="M 100 630 V 330 A 230 230 0 0 1 560 330 V 630" fill="none" stroke="${CREAM}" stroke-width="1.5" opacity="0.08"/>
${mark(820, 150, 2.2)}
${textPaths(frank, name, 440, 250, 96, CREAM, { rtl: true, colorAt: (i) => (i === yodIdx ? GOLD : null) })}
${textPaths(cormorant, "EPHRAIM ATIYA", 440, 300, 26, CREAM, { letterSpacing: 0.42 })}
${textPaths(frank, "פחות ניהול. יותר עיקר.", 440, 400, 60, GOLD, { rtl: true })}
${textPaths(heebo, "ייעוץ ובניית מערכות ניהול למוסדות, קהילות ועסקים", 440, 460, 30, CREAM, { rtl: true })}
</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(path.join(DIST, "og.jpg"));
}

function favicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150">
<rect width="120" height="150" rx="18" fill="${NAVY}"/>${mark(0, 0, 1)}</svg>`;
  fs.writeFileSync(path.join(DIST, "favicon.svg"), svg);
}

async function touchIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
<rect width="180" height="180" fill="${NAVY}"/>${mark(34, 15, 0.93)}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(DIST, "apple-touch-icon.png"));
}

if (!fs.existsSync(DIST)) {
  console.error("build-images: dist/ not found, run vite build first");
  process.exit(1);
}
favicon();
await touchIcon();
try {
  await ogImage();
  console.log("build-images: favicon.svg + apple-touch-icon.png + og.jpg written");
} catch (err) {
  // תמונת השיתוף היא תוספת; אם הורדת הפונטים נכשלה, הבנייה עצמה לא תיכשל.
  console.warn("build-images: og.jpg skipped:", err.message);
}
