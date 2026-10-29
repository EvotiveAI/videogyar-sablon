// Karuszel és statikus poszt kódból: JSON-leírás → 1080×1440 (3:4) PNG-k (márkaszínek, Inter 900).
// Futtatás: tools/egyszerre.sh node tools/social/karuszel.mjs content/_social/karuszelek/<nev>/karuszel.json
// A leírás: { "diak": [ { "szin": "S|L|H", "cim": "…", "kiemel": "…", "szam": "…", "cetli": "…", "lab": "…" } ] }
//   S = sötétzöld (megállít / záró), L = lime (bizonyít), H = halványzöld (tanít, belső dia).
//   kiemel: a cím egy részlete, ami lime (sötétzöldön) vagy teal (világoson) színt kap.
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { chromium } = await import(join(root, "tools/recorder/node_modules/playwright-core/index.mjs"));
const specPath = resolve(process.argv[2] ?? "");
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const outDir = dirname(specPath);
mkdirSync(outDir, { recursive: true });

const C = { S: ["#0C2825", "#FFFFFF", "#A3E635"], L: ["#A3E635", "#0C2825", "#0C2825"], H: ["#DDE8DC", "#0C2825", "#0F766E"] };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function slide(d, i, n) {
  const [bg, fg, hl] = C[d.szin] ?? C.H;
  let cim = esc(d.cim);
  if (d.kiemel) cim = cim.replace(esc(d.kiemel), `<span style="color:${hl}">${esc(d.kiemel)}</span>`);
  return `<div style="box-sizing:border-box;width:1080px;height:1440px;background:${bg};color:${fg};position:relative;padding:96px 88px;font-family:Inter,sans-serif;overflow:hidden">
    ${d.szam ? `<div style="font-weight:900;font-size:300px;line-height:.9;letter-spacing:-.04em">${esc(d.szam)}</div>` : ""}
    ${d.cim ? `<div style="font-weight:900;font-size:${d.szam ? 64 : 104}px;line-height:1.02;text-transform:uppercase;letter-spacing:-.02em;margin-top:${d.szam ? 40 : 0}px">${cim}</div>` : ""}
    ${d.cetli ? `<div style="position:absolute;left:88px;bottom:180px;width:640px;background:#F1E7CF;color:#0C2825;padding:34px 38px;font-weight:600;font-size:40px;line-height:1.3;transform:rotate(-2deg);box-shadow:0 6px 18px rgba(0,0,0,.18)">
        <div style="position:absolute;top:-16px;left:50%;width:150px;height:34px;margin-left:-75px;background:rgba(255,255,255,.55)"></div>${esc(d.cetli)}</div>` : ""}
    ${d.lab ? `<div style="position:absolute;left:88px;right:88px;bottom:${d.cetli ? 96 : 180}px;font-weight:600;font-size:40px;line-height:1.35;opacity:.9">${esc(d.lab)}</div>` : ""}
    <div style="position:absolute;left:88px;bottom:64px;font-weight:700;font-size:28px;opacity:.75">${process.env.DOMAIN || "weboldalad.hu"}</div>
    <div style="position:absolute;right:88px;bottom:64px;font-weight:700;font-size:28px;opacity:.6">${i + 1}/${n}</div>
  </div>`;
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1 });
  for (const [i, d] of spec.diak.entries()) {
    await page.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;900&display=swap" rel="stylesheet"></head><body style="margin:0">${slide(d, i, spec.diak.length)}</body></html>`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const f = join(outDir, `${String(i + 1).padStart(2, "0")}.png`);
    await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 1080, height: 1440 } });
    console.log("kész:", f.slice(root.length + 1));
  }
} finally {
  await browser.close();
}
