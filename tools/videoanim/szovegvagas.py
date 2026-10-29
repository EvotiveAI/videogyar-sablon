#!/usr/bin/env python3
"""SZÖVEG-ALAPÚ vágás: a leirat alapján megtartott szakaszok (a „value”), a bakik / ismétlések / meta-megjegyzések kihagyásával.

python3 tools/videoanim/szovegvagas.py <mappa> "1:1.0-1.4" "1:2.3-5.7" "3:0.1-5.4" ... [--pre 0.06] [--post 0.14] [--size 1080x1920] [--name szoveg-vagott] [--fix "boldogát=boldoggá,habi=havi"]

- <mappa>: a vagas.py kimenete (blokk_N.mp4 + tr_N.json = a blokk whisper-leirata)
- minden szakasz: <blokk>:<első megtartott szó kezdete>-<utolsó megtartott szó KEZDETE> (a leirat szókezdet-idejei); a vég az utolsó szó végéig tart
- kimenet: <mappa>/<name>.mp4 (hanggal) + <name>-nemahang.mp4 + <name>.json (szakaszok, kimeneti idők) + <name>-leirat.json (a megtartott szavak a KIMENETI időn, whisper-formátum: ez kell a build-captions.mjs-nek; --fix: whisper-elírások javítása)
- a vágási pontokon 20 ms hang-fade (nincs csattanás); a szó előtt --pre, utána --post mp ráhagyás (a szomszéd szóba nem lóg bele)
"""
import json, os, subprocess, sys, argparse
ap = argparse.ArgumentParser(); ap.add_argument("dir"); ap.add_argument("segs", nargs="+")
ap.add_argument("--pre", type=float, default=0.06); ap.add_argument("--post", type=float, default=0.14); ap.add_argument("--size", default="1080x1920"); ap.add_argument("--name", default="szoveg-vagott"); ap.add_argument("--fix", default="")
a = ap.parse_args(); SW, SH = a.size.split("x")
FIX = dict(x.split("=") for x in a.fix.split(",") if "=" in x); lw = []
def fixw(t):
    core = t.rstrip(",.!?"); return FIX.get(core, core) + t[len(core):]
out, parts, t_out = [], [], 0.0
for k, s in enumerate(a.segs):
    b, rng = s.split(":"); t0, t1 = [float(x) for x in rng.split("-")]
    W = json.load(open(f"{a.dir}/tr_{b}.json"))["words"]
    i0 = min(range(len(W)), key=lambda i: abs(W[i]["start"] - t0)); i1 = min(range(len(W)), key=lambda i: abs(W[i]["start"] - t1))
    s0 = max(0, W[i0]["start"] - a.pre, (W[i0 - 1]["end"] if i0 else 0)); e0 = W[i1]["end"] + a.post
    if i1 + 1 < len(W): e0 = min(e0, W[i1 + 1]["start"] - 0.01) if W[i1 + 1]["start"] > W[i1]["end"] else W[i1]["end"]
    d = e0 - s0; p = f"{a.dir}/_s{k}.mp4"
    f = (f"[0:v]trim={s0:.3f}:{e0:.3f},setpts=PTS-STARTPTS,scale={SW}:{SH}:flags=lanczos,fps=30[v];"
         f"[0:a]atrim={s0:.3f}:{e0:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={d-0.02:.3f}:d=0.02[a]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{a.dir}/blokk_{b}.mp4", "-filter_complex", f, "-map", "[v]", "-map", "[a]", "-c:v", "h264_videotoolbox", "-q:v", "65", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", p], check=True)
    lw += [{"text": fixw(w["text"]), "start": round(t_out + w["start"] - s0, 3), "end": round(t_out + min(w["end"], e0) - s0, 3)} for w in W[i0:i1 + 1]]
    parts.append(p); out.append({"blokk": int(b), "forras": [round(s0, 2), round(e0, 2)], "ki": [round(t_out, 2), round(t_out + d, 2)], "szoveg": " ".join(w["text"] for w in W[i0:i1 + 1])}); t_out += d
open(f"{a.dir}/_lista.txt", "w").write("".join(f"file '{os.path.abspath(p)}'\n" for p in parts))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{a.dir}/_lista.txt", "-c", "copy", f"{a.dir}/{a.name}.mp4"], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{a.dir}/{a.name}.mp4", "-an", "-c:v", "copy", f"{a.dir}/{a.name}-nemahang.mp4"], check=True)
for p in parts: os.remove(p)
json.dump(out, open(f"{a.dir}/{a.name}.json", "w"), indent=1, ensure_ascii=False)
json.dump({"duration": round(t_out, 3), "words": lw}, open(f"{a.dir}/{a.name}-leirat.json", "w"), indent=1, ensure_ascii=False)
for o in out: print(o["ki"], f'b{o["blokk"]}', o["szoveg"])
print(f"összesen {t_out:.1f} mp")
