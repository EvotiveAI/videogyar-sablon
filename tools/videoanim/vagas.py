#!/usr/bin/env python3
"""Videó+animáció stílus: a nyers arcos felvételből beszéd-blokkokat vág (a hosszú csendek = az animáció helyei).

python3 tools/videoanim/vagas.py <nyers.mov> <kimeneti-mappa> [--slot 2.0] [--gain 30] [--noise -38] [--pad 0.15] [--size 1080x1920] [--lufs -14]

- csend-felismerés (ffmpeg silencedetect a 0:a:0 sávon); a `--slot` mp-nél hosszabb csend = "slot" (oda kerül animáció / portálklip / ügyfél-klip), a rövidebb szünet bent marad
- minden beszéd-blokk külön mp4: 1080x1920, 30 fps, hangerő + kompresszor + limiter (az iPhone Stúdió-hang ~ -31 LUFS, ezért +30 dB), 20 ms fade a vágásoknál
- --size WxH: a kimenet felbontása (alap 1080x1920). 4K állóból arcos sablonhoz 1458x2592 ajánlott: a 1,25x / 1,35x-es CSS-kivágás így sem puhul
- --tiszta DB: TISZTA HANG (2026-10-16, a felhasználó jóváhagyta): csak egyenes erősítés + limiter, kompresszor nélkül (a 3:1 kompresszor „vízhangosra” nyomta az iPhone-hangot). Az új arcos videóknál ez az alap: --tiszta 12.5 (→ ~−16,5 LUFS)
- --lufs X: a vágás után a TELJES anyag hangerejét méri, és EGY közös erősítéssel (a dinamika megmarad) X LUFS-ra viszi a blokkokat (ügyfélklip: -14, így nincs hangerőugrás)
- kimenet: blokk_N.mp4, blokkok.json (blokk, nyers kezdet/vég, hossz, a slot hossza utána), vagott-nyers.mp4 (a blokkok egymás után, megnézéshez)
- whisper NEM fut itt (8 GB RAM, egy példány): utána `python3 tools/whisper/transcribe.py blokk_N.wav ...` egyesével
"""
import json, re, subprocess, sys, os, argparse
ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--slot", type=float, default=2.0); ap.add_argument("--gain", type=float, default=30)
ap.add_argument("--noise", type=float, default=-38); ap.add_argument("--pad", type=float, default=0.15)
ap.add_argument("--size", default="1080x1920"); ap.add_argument("--lufs", type=float, default=None)
ap.add_argument("--tiszta", type=float, default=None, metavar="DB", help="TISZTA HANG (B recept): csak egyenes erősítés DB-lel + limiter, kompresszor nélkül (ajánlott: 12.5)")
a = ap.parse_args()
SW, SH = a.size.lower().split("x")
os.makedirs(a.out, exist_ok=True)
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.src]).decode())
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", a.src, "-map", "0:a:0", "-af", f"silencedetect=noise={a.noise}dB:d=0.4", "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
sil = list(zip(starts, ends + [dur] * (len(starts) - len(ends))))
big = [(s, e) for s, e in sil if e - s >= a.slot]
blocks, cur = [], 0.0
for s, e in big:
    if s - cur > 0.3: blocks.append([cur, s, e - s])
    cur = e
if dur - cur > 0.3: blocks.append([cur, dur, 0.0])
info = []
chain = (f"volume={a.tiszta}dB,alimiter=limit=0.89:attack=5:release=60" if a.tiszta is not None else f"volume={a.gain}dB,acompressor=threshold=-24dB:ratio=3:attack=5:release=80,alimiter=limit=0.89")
for i, (s, e, slot) in enumerate(blocks, 1):
    s0, e0 = max(0, s - a.pad), min(dur, e + a.pad)
    fo = e0 - s0 - 0.02
    f = (f"[0:v]trim={s0}:{e0},setpts=PTS-STARTPTS,scale={SW}:{SH}:flags=lanczos,fps=30[v];"
         f"[0:a:0]atrim={s0}:{e0},asetpts=PTS-STARTPTS,{chain},"
         f"afade=t=in:d=0.02,afade=t=out:st={fo:.3f}:d=0.02[a]")
    p = f"{a.out}/blokk_{i}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-hwaccel", "videotoolbox", "-i", a.src, "-filter_complex", f, "-map", "[v]", "-map", "[a]", "-c:v", "h264_videotoolbox", "-q:v", "65", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", p], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-vn", "-ac", "1", "-ar", "16000", f"{a.out}/blokk_{i}.wav"], check=True)
    info.append({"blokk": i, "forras_kezdet": round(s0, 2), "forras_veg": round(e0, 2), "hossz": round(e0 - s0, 2), "slot_utana": round(slot, 2), "fajl": p})
json.dump(info, open(f"{a.out}/blokkok.json", "w"), indent=1, ensure_ascii=False)
lst = "".join(f"file '{os.path.abspath(x['fajl'])}'\n" for x in info)
open(f"{a.out}/lista.txt", "w").write(lst)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{a.out}/lista.txt", "-c", "copy", f"{a.out}/vagott-nyers.mp4"], check=True)
if a.lufs is not None:
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{a.out}/vagott-nyers.mp4", "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    cur = float(re.findall(r'"input_i"\s*:\s*"(-?[\d.]+)"', m)[-1]); delta = a.lufs - cur
    print(f"hangerő: {cur:.1f} LUFS -> {a.lufs} ({delta:+.1f} dB, közös erősítés)")
    if abs(delta) > 0.4:
        for x in info:
            p = x["fajl"]; tmp = p + ".tmp.mp4"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-c:v", "copy", "-af", f"volume={delta}dB,alimiter=limit=0.89", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", tmp], check=True)
            os.replace(tmp, p)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-vn", "-ac", "1", "-ar", "16000", p[:-4] + ".wav"], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{a.out}/lista.txt", "-c", "copy", f"{a.out}/vagott-nyers.mp4"], check=True)
for x in info: print(x)
