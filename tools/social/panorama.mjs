// Egybefüggő (panoráma) karuszel: egy N×1080 széles képet rajzol, és 1080×1440-es (3:4) diákra vágja.
// Ami a vágáson átnyúlik (töltőcsík, nyíl), az lapozáskor átúszik a következő diára.
// Futtatás: node tools/social/panorama.mjs content/_social/karuszelek/<nev>/panorama.json  (kb. 20 mp, könnyű)
// NE az egyszerre.sh zárral: a taskpolicy -b háttér-prioritás alatt a Chrome indítása és a betű-letöltés beragadhat (2026-10-20).
// Instagram (Metricool API): karuszelben legfeljebb 10 dia mehet.
// Leírás (JSON):
//   diak[]: { szin: S|L|H, cim, kiemel, lab, szam, foto (fájlút, borítóhoz), grafika: "nyil" | "bongeszo" }
//   csik:   { y, ovek: { tol:[dia,x], megall:[dia,x], cimke, elhal:[dia,x] }, mienk: { tol:[dia,x], ig:[dia,x], jelek:[{at:[dia,x], cimke}], vegcimke } }
import { readFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { chromium } = await import(join(root, "tools/recorder/node_modules/playwright-core/index.mjs"));
const specPath = resolve(process.argv[2] ?? "");
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const outDir = dirname(specPath);
const W = 1080, H = 1440, N = spec.diak.length, TOTAL = W * N;

const C = { S: ["#0C2825", "#FFFFFF", "#A3E635"], L: ["#A3E635", "#0C2825", "#0C2825"], H: ["#DDE8DC", "#0C2825", "#0F766E"] };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const X = ([dia, x]) => dia * W + x;
// minőségőr: a forrásfotó ne legyen kisebb, mint ahova kerül (felnagyítás = életlenség)
function fotoMeret(p) { try { const o = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-of", "json", resolve(root, p)]).toString()).streams[0]; return [o.width, o.height]; } catch { return [0, 0]; } }
for (const d of spec.diak) if (d.foto) { const [w] = fotoMeret(d.foto); if (w < W) console.warn(`FIGYELEM: a fotó (${d.foto}) csak ${w} px széles, ${W} px-re nagyítjuk. Nagyobb felbontású eredeti kell a legjobb minőséghez.`); }
const dataUri = (p) => `data:image/${extname(p).slice(1).replace("jpg", "jpeg")};base64,${readFileSync(resolve(root, p)).toString("base64")}`;
const fs = (t) => (t.length < 34 ? 124 : t.length < 60 ? 104 : 88);

function title(d, fg, hl, size) {
  let t = esc(d.cim);
  if (d.kiemel) t = t.replace(esc(d.kiemel), `<span style="color:${hl}">${esc(d.kiemel).replace(/-/g, "&#8209;")}</span>`);
  return `<div style="font-weight:900;font-size:${size}px;line-height:1.02;text-transform:uppercase;letter-spacing:-.02em">${t}</div>`;
}

function slide(d, i) {
  const [bg, fg, hl] = C[d.szin] ?? C.H;
  const num = i > 0 ? `<div style="position:absolute;right:88px;bottom:56px;font-weight:700;font-size:26px;opacity:.55">${i}/${N - 1}</div>` : "";
  if (d.foto) {
    return `<div style="position:absolute;left:${i * W}px;top:0;width:${W}px;height:${H}px;background:${bg};overflow:hidden">
      <img src="${dataUri(d.foto)}" style="position:absolute;left:0;top:0;width:100%;height:1024px;object-fit:cover;object-position:50% 0%">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(12,40,37,0) 40%,rgba(12,40,37,.08) 46%,rgba(12,40,37,.22) 52%,rgba(12,40,37,.45) 57%,rgba(12,40,37,.7) 62%,rgba(12,40,37,.9) 66%,#0C2825 71%)"></div>
      <div style="position:absolute;left:88px;right:88px;bottom:210px;color:#fff">${title(d, "#fff", "#A3E635", 92)}</div>
      ${d.lab ? `<div style="position:absolute;left:88px;bottom:120px;color:#fff;font-weight:600;font-size:36px;opacity:.85">${esc(d.lab)}</div>` : ""}
      <div style="position:absolute;right:88px;bottom:120px;color:#A3E635;font-weight:800;font-size:36px">lapozz →</div>
    </div>`;
  }
  const size = d.szam ? 72 : d.grafika ? Math.min(fs(d.cim || ""), 84) : fs(d.cim || "");
  let graf = "";
  if (d.grafika === "bongeszo") {
    const gombok = ["Tovább", "Részletek", "Ajánlat", "Kapcsolat", "Start", "Fedezd fel"];
    graf = `<div style="position:relative;margin-top:48px;height:370px;flex:none;background:#fff;border-radius:22px;box-shadow:0 10px 30px rgba(12,40,37,.18);overflow:hidden">
      <div style="height:46px;background:#eef2ee;display:flex;gap:12px;align-items:center;padding-left:20px">${["#f87171", "#fbbf24", "#4ade80"].map((c) => `<i style="width:16px;height:16px;border-radius:50%;background:${c};display:block"></i>`).join("")}</div>
      <div style="margin:22px;height:120px;border-radius:14px;background:linear-gradient(120deg,#c084fc,#f472b6,#fb923c,#38bdf8)"></div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;padding:0 22px">${gombok.map((g, k) => `<span style="font:700 26px Inter;padding:14px 22px;border-radius:999px;color:#fff;background:${["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#0ea5e9"][k]}">${g}</span>`).join("")}</div>
      <div style="position:absolute;right:28px;bottom:14px;font:900 56px Inter;color:#0C2825;background:#F1E7CF;border-radius:50%;width:84px;height:84px;display:grid;place-items:center;box-shadow:0 4px 12px rgba(0,0,0,.2)">?</div>
    </div>`;
  }
  // a tartalom függőlegesen középen, a töltőcsík fölötti térben
  const felso = (spec.csik?.y ?? H - 150) - 60;
  return `<div style="position:absolute;left:${i * W}px;top:0;width:${W}px;height:${H}px;background:${bg};color:${fg}">
    <div style="position:absolute;left:88px;right:88px;top:60px;height:${felso - 60}px;display:flex;flex-direction:column;justify-content:center">
      ${d.szam ? `<div style="font-weight:900;font-size:320px;line-height:.9;letter-spacing:-.04em;margin-bottom:32px">${esc(d.szam)}</div>` : ""}
      ${d.cim ? title(d, fg, hl, size) : ""}
      ${d.lab ? `<div style="margin-top:48px;font-weight:600;font-size:46px;line-height:1.35;opacity:.92">${esc(d.lab)}</div>` : ""}
      ${graf}
    </div>${num}
  </div>`;
}

function overlay() {
  const c = spec.csik, y = c.y, parts = [];
  const dark = (x) => (spec.diak[Math.floor(x / W)]?.szin ?? "H") === "S";
  const label = (x, txt, dy = -58) => `<div style="position:absolute;left:${x}px;top:${y + dy}px;transform:translateX(-50%);font:700 28px 'IBM Plex Mono',monospace;color:${dark(x) ? "#fff" : "#0C2825"};white-space:nowrap">${esc(txt)}</div>`;
  if (c.ovek) {
    const a = X(c.ovek.tol), b = X(c.ovek.megall), e = X(c.ovek.elhal);
    parts.push(`<div style="position:absolute;left:${a}px;top:${y}px;width:${b - a}px;height:24px;border-radius:12px;background:#7C8F8B"></div>`);
    parts.push(`<div style="position:absolute;left:${b}px;top:${y + 9}px;width:${e - b}px;height:0;border-top:6px dashed #7C8F8B;-webkit-mask-image:linear-gradient(to right,#000 40%,transparent)"></div>`);
    parts.push(`<div style="position:absolute;left:${b - 4}px;top:${y - 18}px;width:8px;height:60px;background:#0C2825"></div>`);
    if (c.ovek.cimke) parts.push(label(b, c.ovek.cimke));
  }
  if (c.mienk) {
    const a = X(c.mienk.tol), b = X(c.mienk.ig);
    parts.push(`<div style="position:absolute;left:${a}px;top:${y}px;width:${b - a}px;height:24px;border-radius:12px;background:#A3E635;box-shadow:0 0 0 4px #0C2825"></div>`);
    for (const j of c.mienk.jelek ?? []) { const x = X(j.at); parts.push(`<div style="position:absolute;left:${x - 4}px;top:${y - 18}px;width:8px;height:60px;background:#0C2825;box-shadow:0 0 0 3px #A3E635"></div>`); parts.push(label(x, j.cimke)); }
    parts.push(`<div style="position:absolute;left:${b - 26}px;top:${y - 14}px;width:52px;height:52px;border-radius:50%;background:#A3E635;box-shadow:0 0 0 4px #0C2825"></div>`);
    if (c.mienk.vegcimke) parts.push(label(b - 120, c.mienk.vegcimke));
  }
  if (spec.nyil) {
    const a = X(spec.nyil.tol), b = X(spec.nyil.ig), ny = spec.nyil.y;
    parts.push(`<div style="position:absolute;left:${a}px;top:${ny - 14}px;width:${b - a - 60}px;height:28px;background:#A3E635;border-radius:14px"></div>`);
    parts.push(`<div style="position:absolute;left:${b - 80}px;top:${ny - 50}px;width:0;height:0;border-left:90px solid #A3E635;border-top:50px solid transparent;border-bottom:50px solid transparent"></div>`);
  }
  return `<div style="position:absolute;left:0;top:0;width:${TOTAL}px;height:${H}px;pointer-events:none">${parts.join("")}</div>`;
}

const html = `<html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800;900&family=IBM+Plex+Mono:wght@700&display=swap" rel="stylesheet"></head>
<body style="margin:0;font-family:Inter,sans-serif"><div style="position:relative;width:${TOTAL}px;height:${H}px">${spec.diak.map(slide).join("")}${overlay()}</div></body></html>`;

for (const f of readdirSync(outDir)) if (/^\d\d\.png$/.test(f)) unlinkSync(join(outDir, f)); // régi diák
const browser = await chromium.launch({ channel: "chrome", headless: true, timeout: 45000, args: ["--no-first-run", "--no-default-browser-check"] });
try {
  const page = await browser.newPage({ viewport: { width: TOTAL, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load", timeout: 60000 });
  await Promise.race([page.evaluate(() => document.fonts.ready), new Promise((r) => setTimeout(r, 15000))]);
  for (let i = 0; i < N; i++) {
    const f = join(outDir, `${String(i).padStart(2, "0")}.png`);
    await page.screenshot({ path: f, clip: { x: i * W, y: 0, width: W, height: H } });
    console.log("kész:", f.slice(root.length + 1));
  }
  await page.screenshot({ path: join(outDir, "_panorama.png"), clip: { x: 0, y: 0, width: TOTAL, height: H } });
} finally {
  await browser.close();
}
