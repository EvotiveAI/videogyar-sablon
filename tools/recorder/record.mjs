#!/usr/bin/env node
// Weboldal-felvevő: headless Chrome-mal képkockánként felveszi egy oldal görgetését, majd MP4-et készít belőle.
// Használat:
//   node tools/recorder/record.mjs --url https://example.com --out content/<id>/recordings/pelda.mp4 [opciók]
// Opciók:
//   --mode mobile|desktop   mobile = 1080×1920 (432×768 CSS, DPR 2.5), desktop = 1920×1200 (1440×900, DPR 1.333)
//   --seconds 6             a felvétel hossza
//   --screens 2.5           ennyi képernyőnyit görget le (0 = nem görget, csak áll)
//   --hold 0.8              ennyi mp-ig áll az elején és a végén görgetés nélkül
//   --fps 30
//   --width 720 --height 1280 --dpr 1.5   egyedi nézet (CSS px + DPR) a --mode helyett: pl. a nem teljesen reszponzív oldalakat abban a szélességben vedd fel, ahol hibátlan (720×1280 → 1080×1920 kimenet)
//   --click-text "Reject"   a felvétel előtt rákattint egy gombra a megadott szöveggel (pl. cookie-sáv "Reject")
//   --scroll-to-text "..."  a görgetés célja: az a szövegrészlet, amit a --target-y magasságba görget (felülírja a --screens-t)
//   --target-y 0.45         a cél szöveg függőleges helye a képernyőn (0..1, alapérték 0.45)
//   --still out.png         a felvétel végén álló képkockát ment PNG-be, és kiírja a cél szöveg pozícióját (px-ben)
//   --css "..."             extra CSS a felvétel előtt (pl. ha az oldal az adott szélességen nem reszponzív; fájlútvonal is lehet)
//   --route "<url-minta>=<helyi mappa>"   a mintára (Playwright glob, pl. "**/360-cut/daytona-*.webp") illeszkedő kéréseket a helyi mappából szolgálja ki, fájlnév szerint
//                           (content-type a kiterjesztésből); ha a fájl nincs a mappában, a kérés megszakad (nem megy az oldalra). Több --route megengedett, a többi kérés az oldalra megy
//   --from-selector "#korbe"  a görgetés ennek az elemnek a tetejéről indul (alap: az oldal teteje); a --screens ettől számít
//   --hold-end 0.3         a végi állókép hossza (alap: ugyanannyi, mint a --hold)
//   --ease linear          egyenletes görgetési sebesség (alap: easeInOutCubic)
//   --vclock               virtuális óra az oldal JS-ének: a performance.now() és a requestAnimationFrame csak a felvétel kockáival lép (kockánként 1/fps mp), így a
//                          JS-vezérelt beúszás / fordulat (pl. egy hero-animáció) a videóban valós ütemben, a 0. kockától látszik. A CSS-átmenetek továbbra is a --slowmo-val lassulnak
//   --slowmo 0.2            az oldal animációinak lejátszási sebessége a felvétel alatt (a képkockázás lassú, így valós tempónak látszik)
import { chromium } from "playwright-core";
import { mkdtempSync, rmSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const routes = process.argv.slice(2).flatMap((a, i, all) => (a === "--route" && all[i + 1] ? [all[i + 1]] : [])).map((r) => {
  const k = r.lastIndexOf("=");
  if (k < 1) throw new Error(`--route formátum: "<url-minta>=<helyi mappa>", kaptam: ${r}`);
  return { pattern: r.slice(0, k), dir: resolve(r.slice(k + 1)) };
});
const holdEndArg = args["hold-end"];
const linear = args.ease === "linear";
const vclock = process.argv.includes("--vclock");
const fromSelector = args["from-selector"];
const url = args.url;
const out = resolve(args.out ?? "recording.mp4");
const mode = args.mode ?? "mobile";
const seconds = Number(args.seconds ?? 6);
const screens = Number(args.screens ?? 2.5);
const hold = Number(args.hold ?? 0.8);
const fps = Number(args.fps ?? 30);
const slowmo = Number(args.slowmo ?? 0.2);
const clickText = args["click-text"];
const scrollToText = args["scroll-to-text"];
const targetY = Number(args["target-y"] ?? 0.45);
const extraCss = args.css ? (existsSync(args.css) ? readFileSync(args.css, "utf8") : args.css) : "";
const stillOut = args.still ? resolve(args.still) : null;
if (!url) throw new Error("--url kötelező");

const VIEWPORTS = {
  mobile: { viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.3334, isMobile: false, hasTouch: false },
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

const browser = await chromium.launch({ channel: "chrome", headless: true });
const custom = args.width ? { viewport: { width: Number(args.width), height: Number(args.height ?? Math.round(Number(args.width) * 16 / 9)) }, deviceScaleFactor: Number(args.dpr ?? 1.5), isMobile: false, hasTouch: false } : null;
const context = await browser.newContext({ ...(custom ?? VIEWPORTS[mode]), locale: "hu-HU", reducedMotion: "no-preference" });
const MIME = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".avif": "image/avif", ".mp4": "video/mp4", ".json": "application/json", ".svg": "image/svg+xml", ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8" };
const routeStats = routes.map(() => ({ served: 0, missing: 0 }));
routes.forEach(({ pattern, dir }, ri) => context.route(pattern, async (route) => {
  const file = join(dir, decodeURIComponent(new URL(route.request().url()).pathname.split("/").pop()));
  if (!existsSync(file)) { routeStats[ri].missing++; return route.abort(); }
  routeStats[ri].served++;
  const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
  await route.fulfill({ body: readFileSync(file), contentType: MIME[ext] ?? "application/octet-stream" });
}));
if (vclock) await context.addInitScript(() => {
  let vt = 0, id = 0; const q = new Map();
  performance.now = () => vt;
  window.requestAnimationFrame = (cb) => { q.set(++id, cb); return id; };
  window.cancelAnimationFrame = (i) => q.delete(i);
  window.__vstep = (dt) => { vt += dt; const cbs = [...q.values()]; q.clear(); cbs.forEach((cb) => cb(vt)); };
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => page.waitForLoadState("load"));
if (extraCss) await page.addStyleTag({ content: extraCss });
await page.waitForTimeout(1500);

if (clickText) {
  const btn = page.getByRole("button", { name: clickText, exact: true }).first();
  if (await btn.count()) { await btn.click().catch(() => {}); await page.waitForTimeout(800); }
  else console.log(`figyelmeztetés: nincs "${clickText}" gomb`);
}

// Lusta betöltésű képek előtöltése: végiggörget, majd vissza a tetejére.
const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
const vh = page.viewportSize().height;
for (let y = 0; y < pageHeight; y += vh) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(120);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);
const startY = fromSelector ? await page.evaluate((sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : null; }, fromSelector) : 0;
if (startY === null) throw new Error(`nem található az elem: ${fromSelector}`);

// Az oldal animációi lassítva futnak, hogy a lassú képkockázás mellett valós tempónak hassanak.
const cdp = await context.newCDPSession(page);
await cdp.send("Animation.enable");
await cdp.send("Animation.setPlaybackRate", { playbackRate: slowmo });

// Szövegrészlet pozíciója (dokumentum-koordináta, CSS px) a --scroll-to-text célhoz.
const findText = (needle) => page.evaluate((needle) => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const i = n.nodeValue.indexOf(needle);
    if (i < 0) continue;
    const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + needle.length);
    const rects = [...r.getClientRects()];
    return { top: Math.min(...rects.map((q) => q.top)) + scrollY, bottom: Math.max(...rects.map((q) => q.bottom)) + scrollY };
  }
  return null;
}, needle);
const target = scrollToText ? await findText(scrollToText) : null;
if (scrollToText && !target) throw new Error(`nem található a szöveg: ${scrollToText}`);
const maxScroll = target
  ? Math.max(0, Math.min(pageHeight - vh, Math.round(target.top - targetY * vh)))
  : Math.max(0, Math.min(pageHeight - vh - startY, screens * vh));
const total = Math.round(seconds * fps);
const holdFrames = Math.round(hold * fps);
const holdEndFrames = Math.round(Number(holdEndArg ?? hold) * fps);
const tmp = mkdtempSync(join(tmpdir(), "rec-"));
for (let i = 0; i < total; i++) {
  const p = Math.min(1, Math.max(0, (i - holdFrames) / Math.max(1, total - holdFrames - holdEndFrames)));
  await page.evaluate((y) => window.scrollTo(0, y), startY + Math.round((linear ? p : ease(p)) * maxScroll));
  if (vclock) await page.evaluate((dt) => window.__vstep(dt), 1000 / fps);
  await page.screenshot({ path: join(tmp, `f${String(i).padStart(5, "0")}.png`), animations: "allow" });
}
if (stillOut) {
  mkdirSync(dirname(stillOut), { recursive: true });
  await page.screenshot({ path: stillOut, animations: "allow" });
  if (target) {
    const k = VIEWPORTS[mode].deviceScaleFactor, sy = await page.evaluate(() => scrollY);
    console.log(`cél szöveg a képen: y = ${Math.round((target.top - sy) * k)}–${Math.round((target.bottom - sy) * k)} px (felvétel-pixel)`);
  }
}
await browser.close();
routes.forEach((r, i) => console.log(`route ${r.pattern} → ${r.dir}: kiszolgálva ${routeStats[i].served}, hiányzó (megszakítva) ${routeStats[i].missing}`));

mkdirSync(dirname(out), { recursive: true });
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(fps), "-i", join(tmp, "f%05d.png"),
  "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "h264_videotoolbox", "-q:v", "65", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
rmSync(tmp, { recursive: true, force: true });
console.log(`kész: ${out} (${mode}, ${seconds}s, ${total} kép, görgetés ${Math.round(maxScroll)}px / oldal ${pageHeight}px)`);
