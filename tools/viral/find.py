#!/usr/bin/env python3
"""Nagyot ment short-form videók keresése (YouTube Shorts + TikTok), hogy lásd, mások hogyan csinálják.

Két mód:
  1) Ötletből:  python3 tools/viral/find.py --tags aiwebsite,webdesign,lovable --search "build a website with AI"
     → az ötlethez tartozó angol hashtagek és keresések videói, amik elérték a küszöböt.
  2) Trend:     python3 tools/viral/find.py --trend
     → a niche hashtagjei (tools/viral/niche.json) az utolsó 30 napból: mi megy most.
  Leirat:       python3 tools/viral/find.py --hooks <kimeneti mappa> [id1 id2 …]
     → a megadott videók (alap: a top 5) hangja a helyi Whisperrel, hook = első ~3 mp.

Opciók:
  --tags a,b,c        hashtagek # nélkül (YouTube és TikTok is)
  --search "q1;q2"    YouTube-keresések, pontosvesszővel elválasztva (TikTokon csak hashtag megy)
  --must "a,b,c"      témaszűrő: csak az marad, aminek a címében/leírásában szerepel valamelyik szó
                      (a hashtagek alatt sok a spam, pl. #lovable alatt bollywoodi videók)
  --platform yt,tt    melyik platform (alap: mindkettő)
  --min-views N       küszöb: ennyi megtekintés … (alap: 100000)
  --min-comments N    … VAGY ennyi komment (alap: 1000)
  --days N            csak az utolsó N nap videói (alap: 365, --trend esetén 30)
  --top N             ennyi sor a markdown-táblázatban (alap: 40)
  --out DIR           kimenet (alap: inbox/viral/<dátum>-<slug>/)

Kimenet: results.md (táblázat linkekkel), results.csv, raw.json; --hooks után hooks.md.

Hogyan:
  - YouTube: a youtube.com/hashtag/<tag>/shorts oldalak és a ytsearch találatai (yt-dlp, ingyenes).
    A Shortsnak számító (≤ 180 mp) videók közül a 20K nézés fölöttiekhez lekéri a kommentszámot is.
  - TikTok: tiktok_tags.mjs, headless Chrome a hashtag-oldalon, bejelentkezés nélkül.

Átvett ötletek (MIT): chris-jk/claude-outliers (https://github.com/chris-jk/claude-outliers):
a yt-dlp CLI hívása a Python-modul helyett; Melvynx/video-agent-skill /video-viral
(https://github.com/Melvynx/video-agent-skill): a hook = az első 3 mp, a forma szabad, a mondat nem.
"""
import csv
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WHISPER = os.path.join(ROOT, "tools", "whisper", "transcribe.py")


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def fmt(n):
    if n is None:
        return "—"
    for cut, suf in ((1_000_000_000, "B"), (1_000_000, "M"), (1_000, "K")):
        if n >= cut:
            return f"{n / cut:.1f}".rstrip("0").rstrip(".") + suf
    return str(int(n))


def ytdlp(args, timeout=300):
    try:
        r = subprocess.run(["yt-dlp", "--ignore-errors", "--no-warnings", *args],
                           capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return []
    out = []
    for line in r.stdout.splitlines():
        if line.startswith("{"):
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return out


def flat(url, limit):
    res = ytdlp(["-J", "--flat-playlist", "--playlist-end", str(limit), url])
    return [e for e in (res[0].get("entries") or []) if e] if res else []


# ---------- YouTube ----------

def youtube(tags, searches, min_views):
    sources = [(f"#{t}", f"https://www.youtube.com/hashtag/{t}/shorts") for t in tags]
    sources += [(f"„{q}”", f"ytsearch100:{q} shorts") for q in searches]
    with ThreadPoolExecutor(6) as ex:
        pages = list(ex.map(lambda s: (s[0], flat(s[1], 100)), sources))
    cands = {}
    for src, entries in pages:
        n_ok = 0
        for e in entries:
            if (e.get("duration") or 0) > 180:
                continue  # hosszú videó, nem Short
            if (e.get("view_count") or 0) >= min(20_000, min_views):
                cands.setdefault(e["id"], src)
                n_ok += 1
        print(f"YouTube {src}: {len(entries)} videó, {n_ok} jelölt", file=sys.stderr)
    # teljes metaadat (kommentszám, dátum, csatorna) a jelöltekhez, 10-es csomagokban
    urls = [f"https://www.youtube.com/shorts/{i}" for i in cands]
    chunks = [urls[i:i + 10] for i in range(0, len(urls), 10)]
    with ThreadPoolExecutor(6) as ex:
        details = [v for c in ex.map(lambda c: ytdlp(["-j", "--skip-download", *c], timeout=600), chunks) for v in c]
    rows = []
    for v in details:
        w, h = v.get("width") or 0, v.get("height") or 0
        if (v.get("duration") or 0) > 180 or (w and h and w > h):
            continue
        rows.append({
            "platform": "YouTube",
            "source": cands.get(v["id"], ""),
            "id": v["id"],
            "url": f"https://www.youtube.com/shorts/{v['id']}",
            "creator": v.get("channel") or v.get("uploader") or "",
            "followers": v.get("channel_follower_count"),
            "title": (v.get("title") or "").replace("\n", " ")[:200],
            "views": v.get("view_count"),
            "likes": v.get("like_count"),
            "comments": v.get("comment_count"),
            "shares": None,
            "saves": None,
            "date": v.get("upload_date"),
            "duration": v.get("duration"),
            "language": v.get("language") or "",
        })
    return rows


# ---------- TikTok ----------

def tiktok(tags):
    if not tags:
        return []
    if not os.path.exists(os.path.join(ROOT, "tools", "recorder", "node_modules", "playwright-core")):
        print("TikTok kimarad: hiányzik a playwright-core (cd tools/recorder && npm install)", file=sys.stderr)
        return []
    r = subprocess.run(["node", os.path.join(HERE, "tiktok_tags.mjs"), ",".join(tags)],
                       capture_output=True, text=True, timeout=900)
    sys.stderr.write(r.stderr)
    rows = []
    for line in r.stdout.splitlines():
        try:
            e = json.loads(line)
        except json.JSONDecodeError:
            continue
        rows.append({
            "platform": "TikTok",
            "source": f"#{e['tag']}",
            "id": e["id"],
            "url": e["url"],
            "creator": e["author"],
            "followers": e.get("followers"),
            "title": e["desc"].encode("utf-8", "replace").decode("utf-8"),
            "views": e["views"],
            "likes": e["likes"],
            "comments": e["comments"],
            "shares": e["shares"],
            "saves": e["saves"],
            "date": datetime.fromtimestamp(e["created"], timezone.utc).strftime("%Y%m%d") if e.get("created") else None,
            "duration": e.get("duration"),
            "language": "",
        })
    return rows


# ---------- kimenet ----------

COLS = ["rank", "platform", "views", "comments", "likes", "shares", "saves", "date", "creator", "followers",
        "title", "url", "source", "duration", "id"]


def d10(d):
    return f"{d[:4]}-{d[4:6]}-{d[6:]}" if d and len(d) == 8 else "—"


def table(rows):
    out = ["| # | Platform | Nézés | Komment | Like | Megosztás | Dátum | Alkotó (követő) | Videó |",
           "|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        title = re.sub(r"\s+", " ", r["title"]).replace("|", "/")[:70] or "(cím nélkül)"
        out.append(f"| {r['rank']} | {r['platform']} | **{fmt(r['views'])}** | **{fmt(r['comments'])}** | "
                   f"{fmt(r['likes'])} | {fmt(r['shares'])} | {d10(r['date'])} | "
                   f"{r['creator'][:22]} ({fmt(r['followers'])}) | [{title}]({r['url']}) |")
    return out


def write_outputs(rows, outdir, label, argv, min_views, min_comments, top):
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "results.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    json.dump(rows, open(os.path.join(outdir, "raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    n_yt = sum(r["platform"] == "YouTube" for r in rows)
    lines = [f"# Nagyot ment videók · {label} · {date.today().isoformat()}", "",
             f"`find.py {' '.join(argv)}`  ",
             f"**{len(rows)} videó** (YouTube {n_yt}, TikTok {len(rows) - n_yt}) érte el a küszöböt: "
             f"≥ {fmt(min_views)} nézés VAGY ≥ {fmt(min_comments)} komment. Nézettség szerint:", ""]
    lines += table(rows[:top])
    by_comments = sorted(rows, key=lambda r: r["comments"] or 0, reverse=True)[:10]
    lines += ["", "## Legtöbb komment", ""] + table(by_comments)
    open(os.path.join(outdir, "results.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")


# ---------- leirat ----------

def transcribe(row, outdir):
    tdir = os.path.join(outdir, "transcripts")
    os.makedirs(tdir, exist_ok=True)
    base = os.path.join(tdir, row["id"])
    subprocess.run(["yt-dlp", "-q", "--no-warnings", "-f", "bestaudio/best", "-x", "--audio-format", "mp3",
                    "-o", base + ".%(ext)s", row["url"]], capture_output=True, timeout=600)
    audio = base + ".mp3"
    if not os.path.exists(audio):
        return None
    lang = (row.get("language") or "auto").split("-")[0] or "auto"
    r = subprocess.run([sys.executable, WHISPER, audio, base + ".json", "--lang", lang], capture_output=True, text=True)
    os.remove(audio)  # a hangot nem tartjuk meg, csak a leiratot
    if r.returncode != 0 or not os.path.exists(base + ".json"):
        return None
    words = json.load(open(base + ".json", encoding="utf-8"))["words"]
    text = " ".join(w["text"] for w in words)
    open(base + ".txt", "w", encoding="utf-8").write(text + "\n")  # sima szöveg is, olvasáshoz
    return {"hook": " ".join(w["text"] for w in words if w["start"] < 3.0), "text": text}


def hooks_mode(argv):
    outdir = argv[0]
    rows = json.load(open(os.path.join(outdir, "raw.json"), encoding="utf-8"))
    selected = [r for i in argv[1:] for r in rows if r["id"] == i] if argv[1:] else rows[:5]
    lines = ["# Hookok és leiratok", ""]
    for r in selected:
        print(f"Leirat: {r['url']} …", file=sys.stderr)
        t = transcribe(r, outdir)
        lines += [f"## #{r['rank']} · {r['platform']} · {fmt(r['views'])} nézés · {fmt(r['comments'])} komment · {r['creator']}",
                  r["url"], f"**Cím:** {r['title']}", ""]
        if t and re.sub(r"[\W_]|music|outro|intro|zene", "", t["text"], flags=re.I):
            lines += [f"**Hook (0–3 mp):** {t['hook']}", "", f"**Teljes leirat:** {t['text']}", ""]
        elif t:
            lines += ["_Nincs beszéd (zenés / vizuális videó): a hookot a kép és a felirat adja, nézd meg._", ""]
        else:
            lines += ["_Nem sikerült leiratozni (letöltési hiba)._", ""]
    open(os.path.join(outdir, "hooks.md"), "w", encoding="utf-8").write("\n".join(lines))
    print(f"→ {os.path.relpath(os.path.join(outdir, 'hooks.md'), ROOT)}", file=sys.stderr)


def main():
    argv = sys.argv[1:]
    if not argv or argv[0] in ("-h", "--help"):
        sys.exit(__doc__)
    if not shutil.which("yt-dlp"):
        sys.exit("A yt-dlp nincs telepítve: brew install yt-dlp")
    if argv[0] == "--hooks":
        return hooks_mode(argv[1:])

    def opt(name, default):
        return argv[argv.index(f"--{name}") + 1] if f"--{name}" in argv else default

    trend = "--trend" in argv
    niche = json.load(open(os.path.join(HERE, "niche.json"), encoding="utf-8"))
    tags = [t.strip().lstrip("#").lower() for t in opt("tags", ",".join(niche["tags"]) if trend else "").split(",") if t.strip()]
    searches = [q.strip() for q in opt("search", "").split(";") if q.strip()]
    platforms = opt("platform", "yt,tt").split(",")
    must = [w.strip().lower() for w in opt("must", ",".join(niche.get("must", [])) if trend else "").split(",") if w.strip()]
    min_views, min_comments = int(opt("min-views", 100_000)), int(opt("min-comments", 1000))
    days, top = int(opt("days", 30 if trend else 365)), int(opt("top", 40))
    if not tags and not searches:
        sys.exit("Adj meg --tags és/vagy --search értéket, vagy használd a --trend módot.")
    if trend:
        label = "trend (" + ", ".join(tags[:6]) + ("…)" if len(tags) > 6 else ")")
    else:
        label = ", ".join([f"#{t}" for t in tags] + searches)
    slug = "trend" if trend else slugify("-".join(tags + searches))[:50]
    outdir = opt("out", os.path.join(ROOT, "inbox", "viral", f"{date.today().isoformat()}-{slug}"))

    rows = []
    if "yt" in platforms:
        rows += youtube(tags, searches, min_views)
    if "tt" in platforms:
        rows += tiktok(tags)

    oldest = (date.today() - timedelta(days=days)).strftime("%Y%m%d")
    seen, hits = set(), []
    for r in rows:
        if r["id"] in seen or (r["date"] and r["date"] < oldest):
            continue
        if must and not any(re.search(r"\b" + re.escape(w), r["title"].lower()) for w in must):  # szó eleje
            continue
        if (r["views"] or 0) >= min_views or (r["comments"] or 0) >= min_comments:
            seen.add(r["id"])
            hits.append(r)
    hits.sort(key=lambda r: r["views"] or 0, reverse=True)
    for i, r in enumerate(hits, 1):
        r["rank"] = i

    write_outputs(hits, outdir, label, argv, min_views, min_comments, top)
    print(open(os.path.join(outdir, "results.md"), encoding="utf-8").read())
    print(f"→ {os.path.relpath(outdir, ROOT)}/", file=sys.stderr)


if __name__ == "__main__":
    main()
