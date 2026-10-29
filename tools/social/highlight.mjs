// Instagram highlight-borítók kódból (SVG → PNG), márkaszín: halványzöld alap, sötétzöld vonalikon.
// Futtatás: tools/egyszerre.sh node tools/social/highlight.mjs
// Kimenet: brand/social-ikonok/highlight/{1080x1920,1080x1080}/*.png + svg/*.svg
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { chromium } = await import(join(root, "tools/recorder/node_modules/playwright-core/index.mjs"));

const BG = "#DDE8DC", INK = "#0C2825";
const STROKE = 5; // 100-as viewBoxban

// 100×100-as rajzlapon, középre igazítva
const ICONS = {
  "01-eredmenyek": `
    <line x1="18" y1="80" x2="82" y2="80"/>
    <line x1="32" y1="80" x2="32" y2="54"/>
    <line x1="50" y1="80" x2="50" y2="28"/>
    <line x1="68" y1="80" x2="68" y2="44"/>`,
  "02-portal": `
    <rect x="16" y="22" width="68" height="56" rx="8"/>
    <line x1="16" y1="37" x2="84" y2="37"/>
    <line x1="38" y1="37" x2="38" y2="78"/>`,
  "03-folyamat": `
    <circle cx="22" cy="50" r="9"/>
    <circle cx="50" cy="50" r="9"/>
    <circle cx="78" cy="50" r="9"/>
    <line x1="31" y1="50" x2="41" y2="50"/>
    <line x1="59" y1="50" x2="69" y2="50"/>`,
  "04-arak": `
    <path d="M52 16 H84 V48 L48 84 L16 52 Z"/>
    <circle cx="70" cy="30" r="5.5"/>`,
  "05-rolunk": `
    <circle cx="50" cy="35" r="14"/>
    <path d="M22 82 C22 60 78 60 78 82"/>`,
};

function svg(name, w, h, iconPx) {
  const s = iconPx / 100, x = (w - iconPx) / 2, y = (h - iconPx) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${INK}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}
  </g>
</svg>`;
}

const out = join(root, "brand/social-ikonok/highlight");
const sizes = [["1080x1920", 1080, 1920], ["1080x1080", 1080, 1080]];
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [dir, w, h] of sizes) {
    mkdirSync(join(out, dir), { recursive: true });
    mkdirSync(join(out, "svg"), { recursive: true });
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    for (const name of Object.keys(ICONS)) {
      const code = svg(name, w, h, 420); // az ikon a középső körben, ~40% szélesség
      writeFileSync(join(out, "svg", `${name}-${dir}.svg`), code);
      await page.setContent(`<html><body style="margin:0">${code}</body></html>`);
      await page.screenshot({ path: join(out, dir, `${name}.png`), clip: { x: 0, y: 0, width: w, height: h } });
      console.log("kész:", join(dir, `${name}.png`));
    }
    await page.close();
  }
} finally {
  await browser.close();
}
