// A posztolási naptár: content/_social/naptar.json → docs/social-naptar.html + docs/naptar-import/*.ics
// Futtatás: node tools/social/naptar.mjs   (könnyű, nem kell zár)
// Az .ics-eket színenként külön naptárként importáld (Apple/Google Naptár), és színezd be őket:
//   megállít = sötétzöld, bizonyít = lime, tanít = halványzöld.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const data = JSON.parse(readFileSync(join(root, "content/_social/naptar.json"), "utf8"));
const MARKA = process.env.MARKA || "Tartalom";
const DOMAIN = process.env.DOMAIN || "weboldalad.hu";
const MARKA_SLUG = MARKA.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");

const NAP = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];
const NAPNEV = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
const FORMA = { video: "VIDEÓ", karuszel: "KARUSZEL", statikus: "STATIKUS" };
const ALLAPOT = { kesz: "KÉSZ", gyar: "GYÁR", felvenni: "FELVENNI" };
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const dt = iso => new Date(iso + "T12:00:00");

// hetek (hétfőtől vasárnapig)
const weeks = new Map();
for (const nap of data.napok) {
  const d = dt(nap.datum);
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const key = monday.toISOString().slice(0, 10);
  if (!weeks.has(key)) weeks.set(key, []);
  weeks.get(key).push(nap);
}
const md = iso => { const d = dt(iso); return `${d.getMonth() + 1}. ${String(d.getDate()).padStart(2, "0")}.`; };

function card(p) {
  const meta = [];
  if (p.kulcsszo) meta.push(`komment: ${esc(p.kulcsszo)}`);
  if (p.engedely) meta.push(`<span class="warn">⚠ engedély: ${esc(p.engedely)}</span>`);
  if (p.megjegyzes) meta.push(esc(p.megjegyzes));
  return `<div class="card ${p.szin} ${p.allapot}">
    <div class="row"><span class="time">${esc(p.ido)}</span><span class="fmt">${FORMA[p.formatum] ?? p.formatum}</span><span class="st ${p.allapot}">${ALLAPOT[p.allapot]}</span></div>
    <div class="title">${esc(p.cim)}</div>
    ${p.forras ? `<div class="src">${esc(p.forras.replace(/^\d{4}-\d{2}-\d{2}-/, ""))}</div>` : ""}
    ${meta.length ? `<div class="meta">${meta.join(" · ")}</div>` : ""}
  </div>`;
}

let html = "";
for (const [monday, napok] of weeks) {
  const all = napok.flatMap(n => n.posztok);
  const cnt = k => all.filter(p => p.allapot === k).length;
  const felv = all.filter(p => p.allapot === "felvenni");
  const szombat = new Date(dt(monday)); szombat.setDate(szombat.getDate() - 2);
  const vas = new Date(dt(monday)); vas.setDate(vas.getDate() + 6);
  html += `<section class="week"><div class="wh"><h2>${md(monday)}-${vas.getMonth() + 1}. ${String(vas.getDate()).padStart(2, "0")}.</h2>
    <div class="cnt"><span>${all.length} poszt</span><span class="c-kesz">${cnt("kesz")} kész</span><span class="c-gyar">${cnt("gyar")} gyár</span>${cnt("felvenni") ? `<span class="c-felv">${cnt("felvenni")} felvenni</span>` : ""}</div></div>
    ${felv.length ? `<p class="todo">Szombaton (${szombat.getMonth() + 1}. ${String(szombat.getDate()).padStart(2, "0")}.) fel kell venni: <b>${felv.length} videó</b> (${[...new Set(felv.map(p => p.cim))].map(c => `${felv.filter(p => p.cim === c).length} × ${esc(c.toLowerCase())}`).join(", ")}).</p>` : ""}
    <div class="days">`;
  const elso = (dt(napok[0].datum).getDay() + 6) % 7; // hétfő = 0
  for (let i = 0; i < elso; i++) html += `<div class="day pad"></div>`;
  for (const nap of napok) {
    const d = dt(nap.datum);
    const posts = [...nap.posztok].sort((a, b) => a.ido.localeCompare(b.ido));
    html += `<div class="day" data-date="${nap.datum}"><div class="dh"><b>${NAP[d.getDay()]}</b> ${md(nap.datum)}</div>${posts.map(card).join("")}</div>`;
  }
  html += `</div></section>`;
}

const page = `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${MARKA} naptár</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
<style>
:root{--sz:#0C2825;--lime:#A3E635;--hz:#DDE8DC;--bg:#F5F6F2;--line:#D7DDD5;--muted:#5B6B68;--warn:#C2410C}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--sz);font:14px/1.35 Inter,system-ui,sans-serif}
header{max-width:1400px;margin:0 auto;padding:20px 16px 4px}
h1{font-size:22px;font-weight:900;margin:0 0 6px}
.leg{display:flex;flex-wrap:wrap;gap:14px;color:var(--muted);font-size:12.5px;margin:6px 0 4px}
.leg i{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:6px}
main{max-width:1400px;margin:0 auto;padding:0 16px 40px}
.week{margin-top:22px}
.wh{display:flex;flex-wrap:wrap;align-items:baseline;gap:12px}
.wh h2{font-size:17px;font-weight:900;margin:0}
.cnt{display:flex;gap:8px;font-size:12px;font-weight:700}
.cnt span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:2px 9px}
.cnt .c-felv{color:var(--warn);border-color:#FDBA74}
.todo{margin:6px 0 8px;font-size:13px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:8px 10px}
.days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.day{background:#fff;border:1px solid var(--line);border-radius:10px;padding:6px;min-height:120px}
.day.today{outline:2px solid #F97316}
.day.pad{background:none;border:1px dashed var(--line)}
@media (max-width:900px){.day.pad{display:none}}
.dh{font-size:12.5px;color:var(--muted);margin:2px 2px 6px}.dh b{color:var(--sz)}
.card{border-radius:8px;padding:7px 8px;margin-bottom:6px}
.card.S{background:var(--sz);color:#fff}.card.L{background:var(--lime)}.card.H{background:var(--hz)}
.card.felvenni{background-image:none;outline:2px dashed var(--warn);outline-offset:-2px;opacity:.92}
.row{display:flex;gap:6px;align-items:center;font-size:10.5px;font-weight:800;letter-spacing:.02em}
.time{font-size:12px}
.fmt{opacity:.8}
.st{margin-left:auto;border-radius:4px;padding:1px 5px;background:rgba(255,255,255,.75);color:var(--sz)}
.st.felvenni{background:var(--warn);color:#fff}
.st.kesz{background:#fff}
.title{font-weight:800;font-size:13px;margin-top:3px;line-height:1.2}
.src,.meta{font-size:10.5px;opacity:.8;margin-top:3px;word-break:break-word}
.warn{color:var(--warn);font-weight:700}.card.S .warn{color:#FDBA74}
@media (max-width:900px){.days{grid-template-columns:1fr}.day{min-height:0}}
</style></head><body>
<header>
<h1>${MARKA} posztolási naptár</h1>
<div class="leg">
<span><i style="background:var(--sz)"></i>megállít · ${data.idopontok.S}</span>
<span><i style="background:var(--lime)"></i>bizonyít · ${data.idopontok.L}</span>
<span><i style="background:var(--hz)"></i>tanít · ${data.idopontok.H}</span>
<span><b>KÉSZ</b> megvan · <b>GYÁR</b> felvétel nélkül készül · <b style="color:var(--warn)">FELVENNI</b> szombaton veszed fel</span>
</div>
<div class="leg">Forrás: content/_social/naptar.json · frissítés: node tools/social/naptar.mjs · a heti tervezés: /heti-terv</div>
</header>
<main>${html}</main>
<script>const t=new Date().toISOString().slice(0,10);document.querySelectorAll('.day').forEach(d=>{if(d.dataset.date===t){d.classList.add('today');d.scrollIntoView({block:'center'})}})</script>
</body></html>`;
writeFileSync(join(root, "docs/social-naptar.html"), page);

// .ics színenként (lebegő helyi idő, így a telefon naptára a saját időzónájában mutatja)
const icsEsc = s => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const fold = line => { const out = []; let s = line; while (Buffer.byteLength(s) > 74) { let n = 74; while (Buffer.byteLength(s.slice(0, n)) > 74) n--; out.push(s.slice(0, n)); s = " " + s.slice(n); } out.push(s); return out.join("\r\n"); };
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
mkdirSync(join(root, "docs/naptar-import"), { recursive: true });
for (const [k, v] of Object.entries(data.szinek)) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//${MARKA}//Social naptar//HU", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${MARKA} · ${v.nev}`, `X-APPLE-CALENDAR-COLOR:${v.hex}`];
  for (const nap of data.napok) for (const p of nap.posztok.filter(p => p.szin === k)) {
    const [h, m] = p.ido.split(":");
    const start = nap.datum.replace(/-/g, "") + `T${h}${m}00`;
    const endMin = Number(h) * 60 + Number(m) + 15;
    const end = nap.datum.replace(/-/g, "") + `T${String(Math.floor(endMin / 60)).padStart(2, "0")}${String(endMin % 60).padStart(2, "0")}00`;
    const desc = [p.hook, p.forras && `Forrás: ${p.forras}`, p.kulcsszo && `Komment-kulcsszó: ${p.kulcsszo}`, p.engedely && `Engedély kell: ${p.engedely}`, `Állapot: ${ALLAPOT[p.allapot]}`, p.megjegyzes].filter(Boolean).join("\n");
    lines.push("BEGIN:VEVENT", `UID:${nap.datum}-${p.ido.replace(":", "")}-${k}-${(p.forras || p.cim).replace(/[^a-z0-9]/gi, "").slice(0, 24)}@${DOMAIN}`, `DTSTAMP:${stamp}`,
      `DTSTART:${start}`, `DTEND:${end}`, fold(`SUMMARY:${p.allapot === "felvenni" ? "FELVENNI · " : ""}${FORMA[p.formatum]} · ${icsEsc(p.cim)}`), fold(`DESCRIPTION:${icsEsc(desc)}`), "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  writeFileSync(join(root, "docs/naptar-import", `${MARKA_SLUG}-${v.nev.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.ics`), lines.join("\r\n") + "\r\n");
}
console.log("kész: docs/social-naptar.html + docs/naptar-import/*.ics");
