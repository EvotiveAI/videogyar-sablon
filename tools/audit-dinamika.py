#!/usr/bin/env python3
"""Dinamika-audit.
Használat: python3 tools/audit-dinamika.py <snapshot-mappa> [--max 3.0]
A mappában a hyperframes snapshot képei: frame-NN-at-<mp>s.png (ajánlott: 0,5 mp-enként: --at 0,0.5,1,...).
Jelzi azokat az ablakokat, ahol a kép (háttér + főelem) a --max másodpercnél hosszabban nem változik látványosan,
és kiírja a 'beat'-váltásokat (nagy képkocka-különbség), valamint a háttér-világosság váltakozását."""
import sys, re, glob, os
from PIL import Image, ImageChops
import numpy as np
d = sys.argv[1]; mx = float(sys.argv[sys.argv.index("--max")+1]) if "--max" in sys.argv else 3.0
fr = []
for f in glob.glob(os.path.join(d, "frame-*-at-*s.png")):
    m = re.search(r"-at-([0-9.]+)s\.png", f)
    if m: fr.append((float(m.group(1)), f))
fr.sort()
if len(fr) < 3: sys.exit("kevés kocka (kell: --at 0,0.5,1,… )")
small = lambda f: Image.open(f).convert("RGB").resize((54, 96))
imgs = [(t, small(f)) for t, f in fr]
def bgl(im):  # háttér-világosság: a 4 sarok + szélek átlaga
    a = np.asarray(im).astype(float); e = np.concatenate([a[:6].reshape(-1,3), a[-6:].reshape(-1,3), a[:,:4].reshape(-1,3), a[:,-4:].reshape(-1,3)])
    return e.mean()
cuts = [0.0]; last_bg = bgl(imgs[0][1]); last_img = np.asarray(imgs[0][1]).astype(float)
log = []
for t, im in imgs[1:]:
    a = np.asarray(im).astype(float); diff = np.abs(a - last_img).mean(); bg = bgl(im)
    big = diff > 38 or abs(bg - last_bg) > 45          # nagy váltás: új háttér / új főelem
    if big: cuts.append(t); log.append((t, round(diff,1), round(bg)))
    last_img = a if big else last_img * 0.0 + a;        # a referencia mindig az előző kocka (finom mozgás nem vágás)
    last_bg = bg
cuts.append(imgs[-1][0])
bad = [(a, b) for a, b in zip(cuts, cuts[1:]) if b - a > mx]
print(f"{len(fr)} kocka, {len(cuts)-2} beat-váltás; legnagyobb állás: {max((b-a) for a,b in zip(cuts,cuts[1:])):.1f} mp")
print("váltások:", ", ".join(f"{t:.1f}s" for t, *_ in log))
if bad:
    print(f"✗ {len(bad)} ablak > {mx} mp váltás nélkül:"); [print(f"   {a:.1f}–{b:.1f} s ({b-a:.1f} mp)") for a, b in bad]; sys.exit(1)
print("✓ nincs {0} mp-nél hosszabb állás".format(mx))
