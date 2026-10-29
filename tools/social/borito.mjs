// Reels brand-borító pontosan a jóváhagyott rács-makett („A” változat) szerint:
//   a saját rács-maketted alapján → a kocka 3:4, 1080 szélesre nagyítva (×4,97),
//   és a 9:16-os borító középső 4:5-ös sávjába téve (y 285–1635), mert a profilrács 4:5-öt mutat; a jobb felső és bal alsó sarok szabad
//.
// Kocka-típusok (mint a makettben): S = sötétzöld (cím + a domained, CETLI NINCS), L = lime + homokcetli alul,
//   H = halványzöld + fehér cetli alul. Cím: Inter 900, nagybetű, a *csillagos* rész kiemelve. Szám: nagy szám a cím helyett.
// Futtatás: node tools/social/borito.mjs <ki.png> '{"szin":"L","cim":"Árajánlat helyett *látványterv*.","cetli":"…","jegy":"…"}'
//   vagy szám: '{"szin":"L","szam":"11,9%","cetli":"konverzió a Google-ről. És 88%-uk be is fizetett."}'
//   "fentPx": a szöveg tetejének távolsága a 4:5-ös sáv tetejétől (függőleges középre igazításhoz)
//   "tag": kis sötét címke a cím fölött (pl. SIKERSZTORI); "cetliBal"/"cetliAlja" px: a cetli helye (a bal alsó ~450×200 px sarok szabad marad)
//   statikus poszthoz: "meret":"3:4" → 1080×1440 (a karuszel-méret, 2026-10-24); a régi "4:5" (1080×1350) csak kérésre
// NE az egyszerre.sh zárral (a háttér-prioritás alatt a Chrome beragadhat).
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { chromium } = await import(join(root, "tools/recorder/node_modules/playwright-core/index.mjs"));
const [out, raw] = process.argv.slice(2);
const d = JSON.parse(raw);
const C = { mely: "#0C2825", jade: "#0F766E", lime: "#A3E635", zsalya: "#DDE8DC", homok: "#F1E7CF", white: "#FFFFFF", soft: "#DBE4E3" };
const K = 1080 / 217.3; // makett-kocka szélesség → 1080 px
const px = (v) => `${(v * K).toFixed(1)}px`;
const bg = { S: C.mely, L: C.lime, H: C.zsalya }[d.szin];
const ink = d.szin === "S" ? C.white : C.mely;
const hi = { S: C.lime, L: C.mely, H: C.jade }[d.szin];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kiemel = (s) => esc(s).replace(/\*(.+?)\*/g, `<span style="color:${hi}">$1</span>`);
const Wv = 1080, Hv = d.meret === "3:4" ? 1440 : d.meret === "4:5" ? 1350 : 1920;
const top = Hv === 1920 ? 285 : 0, H = Hv === 1920 ? 1350 : Hv; // a középső 4:5-ös sáv a 1920 magas borítón, statikusnál az egész kép
const tag = d.tag ? `<div style="display:inline-block;margin-bottom:34px;padding:14px 26px;border-radius:12px;background:${C.mely};color:${C.lime};font-weight:900;font-size:46px;letter-spacing:.06em;text-transform:uppercase">${esc(d.tag)}</div>` : "";
const nagy = d.szam
  ? `<div style="font-weight:900;letter-spacing:-0.05em;line-height:.9;font-size:${px(d.szamMeret ?? 40)};margin-top:${px(4)};text-transform:uppercase;white-space:nowrap;color:${ink}">${esc(d.szam)}</div>`
  : `<div style="font-weight:900;text-transform:uppercase;letter-spacing:-0.035em;line-height:${d.sorMagas ?? .98};font-size:${px(d.cimMeret ?? 17)};color:${ink}">${kiemel(d.cim)}</div>`;
const cetliSzin = d.szin === "H" ? C.white : C.homok;
const cetli = d.cetli && d.szin !== "S"
  ? `<div style="position:absolute;left:${d.cetliBal != null ? d.cetliBal + "px" : px(10)};right:${px(22)};bottom:${d.cetliAlja != null ? d.cetliAlja + "px" : px(22)};padding:${px(12)} ${px(11)} ${px(11)};font-size:${px(13)};line-height:1.28;font-weight:600;color:${C.mely};background:${cetliSzin};box-shadow:0 ${px(2)} ${px(5)} rgba(12,40,37,.18);transform:rotate(-2.6deg)">
      <div style="position:absolute;top:${px(-5)};left:50%;width:${px(30)};height:${px(10)};margin-left:${px(-15)};background:rgba(255,255,255,.55);transform:rotate(-3deg)"></div>${esc(d.cetli)}</div>`
  : "";
const jegy = d.szin === "S" ? `<div style="position:absolute;left:${px(10)};bottom:${px(9)};font-size:${px(7.5)};font-weight:700;color:${C.soft};opacity:.7">${esc(d.jegy ?? (process.env.DOMAIN || "weboldalad.hu"))}</div>` : "";
const html = `<html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;900&display=swap" rel="stylesheet"></head><body style="margin:0">
<div style="width:1080px;height:${Hv}px;background:${bg};position:relative;font-family:Inter;overflow:hidden">
  <div style="position:absolute;left:0;top:${top}px;width:1080px;height:${H}px;box-sizing:border-box;padding:${px(11)} ${px(10)};${d.fentPx ? `padding-top:${d.fentPx}px;` : ""}">${tag}${nagy}${cetli}${jegy}</div>
</div></body></html>`;
const b = await chromium.launch({ channel: "chrome", headless: true, timeout: 45000 });
try {
  const p = await b.newPage({ viewport: { width: Wv, height: Hv } });
  await p.setContent(html, { waitUntil: "load", timeout: 30000 });
  await Promise.race([p.evaluate(() => document.fonts.ready), new Promise((r) => setTimeout(r, 10000))]);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: Wv, height: Hv } });
  console.log("kész:", out);
} finally {
  await b.close();
}
