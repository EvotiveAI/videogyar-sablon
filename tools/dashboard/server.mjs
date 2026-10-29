#!/usr/bin/env node
// Tartalom-dashboard: a content/ és otletek/ mappákból dolgozik, adatbázis és npm-függőség nélkül.
// Indítás: node tools/dashboard/server.mjs  →  http://localhost:8770
import { createServer } from "node:http";
import { readFile, writeFile, rename, readdir, stat, mkdir, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT ?? 8770);
const HOST = "127.0.0.1";
const ROOT = resolve(import.meta.dirname, "..", "..");
const CONTENT = join(ROOT, "content");
const IDEAS = join(ROOT, "otletek");
const CACHE = join(import.meta.dirname, ".cache");
const MONTHLY_GOAL = 90;
const SOCIAL = join(CONTENT, "_social"); // naptar.json (terv) + allapot.json (firebase / metricool / kint)
const REF_DIR = process.env.REF_DIR ? resolve(process.env.REF_DIR) : join(ROOT, "docs", "referencia-videok"); // csak olvasás; opcionális esettanulmány-videók (.mp4)

const ID_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]{0,80}$/;
const IDEA_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,100}\.md$/;
const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD, helyi idő

// ---------- biztonság: csak a content/ és otletek/ alatt ----------
async function inside(base, ...parts) {
  const p = resolve(base, ...parts);
  if (p !== base && !p.startsWith(base + sep)) throw httpError(400, "Érvénytelen útvonal");
  // a symlinkek (composition -> <id>) is maradjanak a gyökér alatt
  if (existsSync(p)) {
    const real = await realpath(p);
    const realBase = await realpath(base);
    if (real !== realBase && !real.startsWith(realBase + sep)) throw httpError(400, "Érvénytelen útvonal");
  }
  return p;
}
function httpError(code, msg) { return Object.assign(new Error(msg), { code }); }
async function videoDir(id) {
  if (typeof id !== "string" || !ID_RE.test(id)) throw httpError(400, "Érvénytelen id");
  const dir = await inside(CONTENT, id);
  if (!existsSync(join(dir, "meta.yaml"))) throw httpError(404, "Nincs ilyen videó");
  return dir;
}

// ---------- meta.yaml: soronkénti olvasás és óvatos írás ----------
// Egy sor értékének helye: [start, end), a megjegyzés (# …) a végén érintetlen marad.
function valueSpan(line) {
  const m = line.match(/^([A-Za-z_][\w-]*):[ \t]*/);
  if (!m) return null;
  const start = m[0].length;
  let end = line.length;
  const q = line[start];
  if (q === '"' || q === "'") {
    let i = start + 1;
    while (i < line.length) {
      if (q === '"' && line[i] === "\\") { i += 2; continue; }
      if (line[i] === q) { if (q === "'" && line[i + 1] === "'") { i += 2; continue; } break; }
      i++;
    }
    end = Math.min(i + 1, line.length);
  } else {
    const c = line.slice(start).search(/\s#/);
    if (c >= 0) end = start + c;
    while (end > start && /\s/.test(line[end - 1])) end--;
  }
  return { key: m[1], start, end };
}
function unquote(v) {
  if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) return v.slice(1, -1).replace(/\\(["\\])/g, "$1").replace(/\\n/g, "\n");
  if (v.startsWith("'") && v.endsWith("'") && v.length >= 2) return v.slice(1, -1).replace(/''/g, "'");
  return v;
}
function parseMeta(text) {
  const fields = {};
  const blocks = {};
  let cur = null;
  for (const line of text.split("\n")) {
    const span = /^[A-Za-z_]/.test(line) ? valueSpan(line) : null;
    if (span) {
      const raw = line.slice(span.start, span.end);
      fields[span.key] = unquote(raw);
      cur = raw === "" || raw === "|" || raw === ">" ? span.key : null;
      if (cur) blocks[cur] = [];
    } else if (cur && /^\s+\S/.test(line)) {
      blocks[cur].push(line);
    } else if (line.trim()) cur = null;
  }
  for (const [k, lines] of Object.entries(blocks)) if (lines.length) fields[k] = lines.join("\n");
  return fields;
}
// Egy felső szintű mező beállítása (value === null: a sor törlése). Minden más sor bájtra azonos marad.
function setField(text, key, value) {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => valueSpan(l)?.key === key && !/^\s/.test(l));
  if (value === null) {
    if (idx >= 0) lines.splice(idx, 1);
    return lines.join("\n");
  }
  const v = /^[a-z_]+$/.test(value) ? value : JSON.stringify(String(value)); // status: posted (mint a repóban), dátum: "…"
  if (idx >= 0) {
    const s = valueSpan(lines[idx]);
    const rest = lines[idx].slice(s.end);
    lines[idx] = lines[idx].slice(0, s.start) + v + (rest && !/^\s/.test(rest) ? " " + rest : rest);
  } else {
    let at = lines.findIndex((l) => valueSpan(l)?.key === "posted" && !/^\s/.test(l));
    if (at < 0) at = lines.findIndex((l) => valueSpan(l)?.key === "status" && !/^\s/.test(l));
    if (at < 0) at = lines.length - (lines.at(-1) === "" ? 2 : 1);
    lines.splice(at + 1, 0, `${key}: ${v}`);
  }
  return lines.join("\n");
}
async function atomicWrite(file, text) {
  const tmp = file + ".dashboard-tmp";
  await writeFile(tmp, text);
  await rename(tmp, file);
}

// ---------- videók beolvasása (gyorsítótárral) ----------
const fileCache = new Map(); // path -> { mtimeMs, value }
async function cachedRead(path, fn) {
  let st;
  try { st = await stat(path); } catch { return null; }
  const hit = fileCache.get(path);
  if (hit && hit.mtimeMs === st.mtimeMs) return hit.value;
  const value = fn(await readFile(path, "utf8"));
  fileCache.set(path, { mtimeMs: st.mtimeMs, value });
  return value;
}
const durationFromIndex = (html) => {
  const tag = html.match(/<[^>]*data-composition-id="main"[^>]*>/)?.[0] ?? "";
  const d = tag.match(/data-duration="([\d.]+)"/)?.[1];
  return d ? Number(d) : null;
};
const durationFromNotes = (notes = "") => {
  const m = notes.match(/(?:hossz|hang)\s*(\d+(?:[.,]\d+)?)\s*mp/i);
  return m ? Number(m[1].replace(",", ".")) : null;
};

// Saját sorozataid: [regex a meta.yaml `sorozat` mezőjére, megjelenített név]
const SERIES = [
  // [/pelda-sorozat/i, "Példa sorozat"],
];
function seriesOf(id, meta) {
  const raw = meta.sorozat || "";
  if (!raw) return "";
  for (const [re, name] of SERIES) if (re.test(raw)) return name;
  return raw;
}
function columnOf(m) {
  const s = (m.status || "").trim();
  if (s === "posted" || s === "measured") return "posztolva";
  if (s === "ready_to_post") return m.rendered ? "renderelve" : m.reviewed ? "atnezve" : "kesz";
  if (s === "concept_ready") return "szoveg";
  if (s === "idea") return "otlet";
  if (s === "failed") return "elakadt";
  if (s === "rejected") return "kuka";
  return "gyartas"; // approved, in_production, researching, awaiting_footage, ismeretlen
}
async function firstImage(dir) {
  try {
    const files = (await readdir(dir)).filter((f) => /^frame-.*\.(png|jpe?g)$/i.test(f)).sort();
    return files.length ? join(dir, files[Math.min(1, files.length - 1)]) : null;
  } catch { return null; }
}
async function thumbSource(id) {
  const dir = join(CONTENT, id);
  const cover = join(dir, "final", "cover.png");
  if (existsSync(cover)) return { kind: "file", path: cover };
  const snap = (await firstImage(join(dir, id, "snapshots"))) ?? (await firstImage(join(dir, "snap")));
  if (snap) return { kind: "file", path: snap };
  const finals = existsSync(join(dir, "final")) ? (await readdir(join(dir, "final"))).filter((f) => f.endsWith(".mp4")).sort().map((f) => "final/" + f) : [];
  for (const v of ["edit/vegleges.mp4", "final/final.mp4", ...finals, "edit/vagott-nyers.mp4", "edit/face_a.mp4"]) if (existsSync(join(dir, v))) return { kind: "video", path: join(dir, v) };
  return null;
}

async function loadVideo(id) {
  const dir = join(CONTENT, id);
  const meta = await cachedRead(join(dir, "meta.yaml"), parseMeta);
  if (!meta) return null;
  const project = existsSync(join(dir, id, "index.html")) ? join(dir, id) : existsSync(join(dir, "composition", "index.html")) ? join(dir, "composition") : null;
  const duration = (project && (await cachedRead(join(project, "index.html"), durationFromIndex))) || durationFromNotes(meta.notes);
  const thumb = await thumbSource(id);
  const finalVideo = existsSync(join(dir, "final", "final.mp4")) || existsSync(join(dir, "edit", "vegleges.mp4"));
  // valódi végső render: final/*.mp4 vagy a Studio-projekt renders/*.mp4 (a vágott arcos edit/vegleges.mp4 nem az)
  const mp4s = async (d) => { try { return (await readdir(d)).some((f) => f.endsWith(".mp4") && !/kicsi|preview/i.test(f)); } catch { return false; } };
  const hasRender = (await mp4s(join(dir, "final"))) || (await mp4s(join(dir, id, "renders")));
  return {
    id,
    title: meta.title || id,
    status: meta.status || "",
    stage: meta.stage || "",
    column: columnOf(meta),
    kategoria: (meta.kategoria || "").toUpperCase(),
    szint: meta.szint || "",
    format: meta.format || "",
    sorozat: seriesOf(id, meta),
    date: meta.created || id.slice(0, 10),
    reviewed: meta.reviewed || "",
    rendered: meta.rendered || "",
    posted: meta.posted || "",
    duration,
    hasThumb: !!thumb,
    hasPost: existsSync(join(dir, "post.md")),
    hasStudio: existsSync(join(dir, id, "index.html")),
    hasFinalVideo: finalVideo,
    hasRender,
  };
}

// ---------- ötletek ----------
function ideaTitle(line) {
  return (line.match(/\*\*(.+?)\*\*/)?.[1] ?? line.replace(/^-\s*/, "")).replace(/[*_`~]/g, "").trim().slice(0, 200);
}
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  return { fm: m ? parseMeta(m[1]) : {}, body: m ? text.slice(m[0].length) : text };
}
async function loadIdeas() {
  const ideas = [];
  const linked = new Set();
  const inbox = await cachedRead(join(IDEAS, "INBOX.md"), (t) => t);
  if (inbox) {
    inbox.split("\n").forEach((line, i) => {
      if (!/^- /.test(line) || /^- ~~/.test(line)) return;
      const file = line.match(/\]\(([A-Za-z0-9._-]+\.md)\)/)?.[1];
      if (file) linked.add(file);
      ideas.push({
        key: `inbox-${i}`,
        source: "INBOX.md",
        title: ideaTitle(line),
        text: line.replace(/^- /, ""),
        date: line.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "",
        file: file && existsSync(join(IDEAS, file)) ? file : "",
        kategoria: "",
      });
    });
  }
  for (const f of (await readdir(IDEAS)).sort()) {
    if (!IDEA_FILE_RE.test(f) || f === "README.md" || f === "INBOX.md") continue;
    const info = await cachedRead(join(IDEAS, f), (t) => {
      const { fm, body } = parseFrontmatter(t);
      return { fm, title: body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? f };
    });
    if (!info || /felhaszn/i.test(info.fm.status || "")) continue;
    const meta = { kategoria: info.fm.kategoria || "", date: info.fm.date || (info.fm.forras || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "" };
    const existing = ideas.find((i) => i.file === f);
    if (existing) { Object.assign(existing, { kategoria: meta.kategoria, date: existing.date || meta.date }); continue; }
    ideas.push({ key: `file-${f}`, source: f, title: info.title.replace(/[*_`]/g, ""), text: "", file: f, ...meta });
  }
  return ideas;
}

// ---------- összesítés, gyorsítótárazva ----------
let snapshot = null;
let snapshotAt = 0;
async function getData(force = false) {
  if (!force && snapshot && Date.now() - snapshotAt < 4000) return snapshot;
  const ids = (await readdir(CONTENT, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && ID_RE.test(d.name))
    .map((d) => d.name);
  const videos = (await Promise.all(ids.map(loadVideo))).filter(Boolean);
  const ideas = await loadIdeas();
  const month = today().slice(0, 7);
  const postedThisMonth = videos.filter((v) => v.column === "posztolva" && v.posted.startsWith(month)).length;
  const body = { videos, ideas, month, postedThisMonth, goal: MONTHLY_GOAL };
  const version = JSON.stringify(body).length + ":" + hash(JSON.stringify(body));
  snapshot = { ...body, version };
  snapshotAt = Date.now();
  return snapshot;
}
// ---------- social: terv + állapot + vödrök (a social.html olvassa) ----------
async function getSocial() {
  const readJsonFile = async (f, fallback) => { try { return JSON.parse(await readFile(f, "utf8")); } catch { return fallback; } };
  const plan = await readJsonFile(join(SOCIAL, "naptar.json"), { napok: [] });
  const state = await readJsonFile(join(SOCIAL, "allapot.json"), {});
  const { videos } = await getData();
  let refs = [];
  try { refs = (await readdir(REF_DIR)).filter((f) => f.endsWith(".mp4")).sort(); } catch {}
  return { plan, state, videos, refs, today: today() };
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

// ---------- bélyegképek: kicsinyített másolat a .cache/-ben (kép: sips, videó: egy ffmpeg-kocka), egyszerre egy ----------
let thumbQueue = Promise.resolve();
function makeThumb(src, out) {
  const args = src.kind === "video"
    ? ["-b", "ffmpeg", "-y", "-loglevel", "error", "-ss", "2", "-i", src.path, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "4", out]
    : ["-b", "sips", "-s", "format", "jpeg", "-s", "formatOptions", "70", "-Z", "640", src.path, "--out", out];
  const run = () => new Promise((ok) => {
    const p = spawn("taskpolicy", args, { stdio: "ignore" });
    p.on("close", ok);
    p.on("error", ok);
  });
  return (thumbQueue = thumbQueue.then(run, run));
}
async function thumbFile(id) {
  await videoDir(id);
  const src = await thumbSource(id);
  if (!src) return null;
  await mkdir(CACHE, { recursive: true });
  const out = join(CACHE, `${id}-${hash(src.path)}.jpg`);
  const fresh = existsSync(out) && (await stat(out)).mtimeMs >= (await stat(src.path)).mtimeMs;
  if (!fresh) await makeThumb(src, out);
  return existsSync(out) ? out : src.kind === "file" ? src.path : null;
}

// ---------- műveletek ----------
async function mark(id, action, undo) {
  const dir = await videoDir(id);
  const file = join(dir, "meta.yaml");
  let text = await readFile(file, "utf8");
  const meta = parseMeta(text);
  if (action === "reviewed" || action === "rendered") {
    text = setField(text, action, undo ? null : today());
  } else if (action === "posted") {
    if (undo) {
      if (meta.status !== "posted") throw httpError(409, `A státusz „${meta.status}”, nem „posted”, ezért nem vonom vissza.`);
      text = setField(setField(text, "status", "ready_to_post"), "posted", "");
    } else {
      text = setField(setField(text, "status", "posted"), "posted", today());
    }
  } else throw httpError(400, "Ismeretlen művelet");
  await atomicWrite(file, text);
  fileCache.delete(file);
  return getData(true);
}
async function addIdea(raw) {
  const text = String(raw ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 3) throw httpError(400, "Túl rövid ötlet");
  if (text.length > 400) throw httpError(400, "Max. 400 karakter");
  const file = join(IDEAS, "INBOX.md");
  let cur = await readFile(file, "utf8");
  if (cur && !cur.endsWith("\n")) cur += "\n";
  const safe = text.replace(/\*\*/g, "");
  await atomicWrite(file, cur + `- **${safe}** · _(${today()}, dashboard)_\n`);
  fileCache.delete(file);
  return getData(true);
}
let lastStudio = 0;
async function openStudio(id) {
  const dir = await videoDir(id);
  const project = await inside(CONTENT, id, id);
  if (!existsSync(join(project, "index.html"))) throw httpError(404, `Nincs Studio-projekt: content/${id}/${id}`);
  if (Date.now() - lastStudio < 4000) throw httpError(429, "Egy pillanat, az előző megnyitás még fut.");
  lastStudio = Date.now();
  const p = spawn("npx", ["--yes", "hyperframes@0.8.149", "open", `content/${id}/${id}`], { cwd: ROOT, stdio: "ignore", detached: true });
  p.on("error", () => {});
  p.unref();
  return { ok: true, dir: dir.slice(ROOT.length + 1) };
}

// ---------- HTTP ----------
const TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);
function send(res, code, body, type = "application/json; charset=utf-8", extra = {}) {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const c of req) { size += c.length; if (size > 16_000) throw httpError(413, "Túl nagy kérés"); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { throw httpError(400, "Hibás JSON"); }
}

createServer(async (req, res) => {
  try {
    // DNS-rebinding és idegen oldalak ellen: csak a saját host, POST-nál a saját origin
    if (!ALLOWED_HOSTS.has(req.headers.host ?? "")) return send(res, 403, { error: "host" });
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    if (req.method === "POST") {
      const origin = req.headers.origin;
      if (origin && !ALLOWED_HOSTS.has(origin.replace(/^https?:\/\//, ""))) return send(res, 403, { error: "origin" });
      if (!(req.headers["content-type"] ?? "").startsWith("application/json")) return send(res, 415, { error: "json kell" });
      const body = await readJson(req);
      if (path === "/api/mark") return send(res, 200, await mark(body.id, body.action, !!body.undo));
      if (path === "/api/idea") return send(res, 200, await addIdea(body.text));
      if (path === "/api/studio") return send(res, 200, await openStudio(body.id));
      return send(res, 404, { error: "nincs ilyen" });
    }
    if (req.method !== "GET") return send(res, 405, { error: "method" });
    if (path === "/" || path === "/index.html") {
      return send(res, 200, await readFile(join(import.meta.dirname, "index.html")), "text/html; charset=utf-8");
    }
    if (path === "/api/data") return send(res, 200, await getData());
    if (path === "/social" || path === "/social.html") {
      return send(res, 200, await readFile(join(import.meta.dirname, "social.html")), "text/html; charset=utf-8");
    }
    if (path === "/api/social") return send(res, 200, await getSocial());
    if (path === "/api/video") {
      const id = url.searchParams.get("id");
      const dir = await videoDir(id);
      const metaText = await readFile(join(dir, "meta.yaml"), "utf8");
      const post = existsSync(join(dir, "post.md")) ? await readFile(join(dir, "post.md"), "utf8") : "";
      return send(res, 200, { id, meta: parseMeta(metaText), post, video: await loadVideo(id) });
    }
    if (path === "/api/idea") {
      const f = url.searchParams.get("file") ?? "";
      if (!IDEA_FILE_RE.test(f)) throw httpError(400, "Érvénytelen fájlnév");
      const p = await inside(IDEAS, f);
      if (!existsSync(p)) throw httpError(404, "Nincs ilyen ötlet");
      return send(res, 200, { file: f, text: await readFile(p, "utf8") });
    }
    if (path.startsWith("/thumb/")) {
      const id = decodeURIComponent(path.slice(7));
      const f = await thumbFile(id);
      if (!f) return send(res, 404, { error: "nincs kép" });
      const ext = f.slice(f.lastIndexOf(".")).toLowerCase();
      return send(res, 200, await readFile(f), TYPES[ext] ?? "application/octet-stream", { "cache-control": "max-age=30" });
    }
    return send(res, 404, { error: "nincs ilyen" });
  } catch (e) {
    if (!e.code || typeof e.code !== "number") console.error(e);
    send(res, typeof e.code === "number" ? e.code : 500, { error: e.message });
  }
}).listen(PORT, HOST, () => console.log(`Tartalom-dashboard: http://localhost:${PORT}`));
