// Minőségőr: ütemezés előtt ellenőrzi a posztot. Hiba esetén nem ütemezünk.
// Futtatás: node tools/social/minoseg.mjs <mappa vagy fájl> [--szoveg post.md]
//   mappa: karuszel / statikus diák (*.png, *.jpg), sorban
//   fájl:  videó (*.mp4)
// Ellenőrzi: pontos méret (karuszel / statikus: 1080×1440, videó: 1080×1920), max. 10 dia (Instagram API), videó: H.264 + AAC hang,
// legalább 30 fps, nem túl alacsony bitráta; szöveg: max. 2200 karakter, max. 30 hashtag.
// Forrásfotó felnagyítását a panorama.mjs külön jelzi.
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const target = args[0];
const szovegIdx = args.indexOf("--szoveg");
const hibak = [], figy = [];

const probe = (f) => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", f]).toString());

if (statSync(target).isDirectory()) {
  const kepek = readdirSync(target).filter((f) => /^\d\d\.(png|jpe?g)$/i.test(f)).sort();
  if (!kepek.length) hibak.push("nincs dia (00.png, 01.png …)");
  if (kepek.length > 10) hibak.push(`${kepek.length} dia: az Instagram API legfeljebb 10-et enged`);
  for (const f of kepek) {
    const s = probe(join(target, f)).streams[0];
    if (!(s.width === 1080 && s.height === 1440)) hibak.push(`${f}: ${s.width}×${s.height}, 1080×1440 (3:4) kell`);
  }
  console.log(`${kepek.length} dia ellenőrizve`);
} else if (extname(target) === ".mp4") {
  const p = probe(target);
  const v = p.streams.find((s) => s.codec_type === "video"), a = p.streams.find((s) => s.codec_type === "audio");
  const fps = v ? eval(v.r_frame_rate) : 0, mbps = Number(p.format.bit_rate) / 1e6, dur = Number(p.format.duration);
  if (!v) hibak.push("nincs videósáv");
  else {
    if (!(v.width === 1080 && v.height === 1920)) hibak.push(`méret ${v.width}×${v.height}, 1080×1920 kell`);
    if (v.codec_name !== "h264") hibak.push(`kodek ${v.codec_name}, H.264 kell`);
    if (fps < 29) hibak.push(`${fps.toFixed(1)} fps, legalább 30 kell`);
  }
  if (!a) hibak.push("nincs hangsáv");
  else if (a.codec_name !== "aac") figy.push(`hang ${a.codec_name}, az AAC a legbiztosabb`);
  if (mbps < 3.5) figy.push(`bitráta ${mbps.toFixed(1)} Mbps, alacsony (5+ ajánlott)`);
  if (dur > 180) hibak.push(`${dur.toFixed(0)} mp, a Reels max. 3 perc`);
  console.log(`videó: ${v?.width}×${v?.height}, ${fps.toFixed(0)} fps, ${mbps.toFixed(1)} Mbps, ${dur.toFixed(1)} mp`);
} else hibak.push("ismeretlen cél: mappa (diák) vagy .mp4 kell");

if (szovegIdx >= 0) {
  const t = readFileSync(args[szovegIdx + 1], "utf8");
  const szoveg = t.includes("## Instagram") ? t.split(/## Instagram[^\n]*\n/)[1].split(/\n## /)[0].trim() : t.trim();
  const hashtag = (szoveg.match(/#[\p{L}\d_]+/gu) || []).length;
  if (szoveg.length > 2200) hibak.push(`szöveg ${szoveg.length} karakter, max. 2200`);
  if (hashtag > 30) hibak.push(`${hashtag} hashtag, max. 30`);
  if (/[!–—]/.test(szoveg)) figy.push("felkiáltójel vagy gondolatjel a szövegben (hangnem)");
  console.log(`szöveg: ${szoveg.length} karakter, ${hashtag} hashtag`);
}

for (const f of figy) console.log("FIGYELEM:", f);
for (const h of hibak) console.log("HIBA:", h);
console.log(hibak.length ? "NEM MEHET KI" : "RENDBEN");
process.exit(hibak.length ? 1 : 0);
