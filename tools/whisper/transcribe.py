#!/usr/bin/env python3
"""Helyi, ingyenes szó szintű leirat: whisper.cpp (large-v3, Metal GPU) + szünethez igazítás.

Használat:
  python3 tools/whisper/transcribe.py <hang.wav|mp3> <kimenet.json> [--lang hu]

Kimenet: {"source", "model", "duration", "words": [{"text", "start", "end"}]}
Időzítés: DTW (token-szintű, a large-v3 alignment-fejeivel), a Scribe-hoz mérve
medián 0,02 mp eltérés. A szó vége a következő szó eleje, de ha szünet jön,
az ffmpeg silencedetect szerinti szünet elejére vágjuk.
A szöveget (pl. "klód" → "Claude") a transcriber agent igazítja a szkripthez.
"""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, "models", "ggml-large-v3-q5_0.bin")


def silences(path, noise="-35dB", dur=0.12):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", f"silencedetect=n={noise}:d={dur}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(starts, ends))


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit(__doc__)
    src, out = args[0], args[1]
    lang = args[args.index("--lang") + 1] if "--lang" in args else "hu"
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "in16.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ar", "16000", "-ac", "1", wav], check=True)
        base = os.path.join(tmp, "out")
        subprocess.run(["whisper-cli", "-m", MODEL, "-f", wav, "-l", lang, "-nfa", "-dtw", "large.v3", "-ojf", "-of", base, "-np"],
                       check=True, capture_output=True)
        data = json.load(open(base + ".json"))
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav],
                                   capture_output=True, text=True).stdout.strip())
    toks = []
    for seg in data["transcription"]:
        for tk in seg["tokens"]:
            if tk["text"].startswith("[_") or tk["t_dtw"] < 0:
                continue
            toks.append((tk["text"], tk["t_dtw"] / 100, seg["offsets"]["to"] / 1000))
    words = []
    for txt, t, seg_end in toks:
        if txt.startswith(" ") or not words:
            words.append({"text": txt.strip(), "start": round(t, 3), "end": seg_end})
        else:
            words[-1]["text"] += txt
    words = [w for w in words if w["text"]]
    for i, w in enumerate(words):
        nxt = words[i + 1]["start"] if i + 1 < len(words) else min(w["end"], dur)
        w["end"] = round(max(w["start"] + 0.05, nxt), 3)
    for a, b in silences(src):
        for w in words:
            if w["start"] < a < w["end"]:  # a szó vége belelóg a szünetbe → a szünet elejére
                w["end"] = round(max(w["start"] + 0.05, a), 3)
    json.dump({"source": src, "model": "whisper.cpp large-v3 q5_0 + DTW (helyi, ingyenes)", "duration": dur, "words": words},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(words)} szó → {out}")


if __name__ == "__main__":
    main()
