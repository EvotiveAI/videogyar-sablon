# Vizuális stílus

> A motion-designer és a captioner innen dolgozik. Egy konzisztens, felismerhető stílus jobb, mint videónként új.
> Tipp: indulj egy HyperFrames-presetből (layout, tipográfia), és tedd rá a weboldalad színeit.

## Alapok
- Képarány: 9:16, 1080×1920, 30 fps
- **Biztonsági zóna:** fent 250 px, lent 350 px (a platform felülete eltakarja; a felirat alsó éle max. y≈1500), bal oldalt 60 px, jobb oldalt ~120 px. Story: fent 250, lent 250 px. Karuszel: 1080×1440. Profilrács: 4:5 (a borító szövege y≈285–1635).
- **Display font:** [TODO] (egy jelenetben egy „display” pillanat)
- **Címke font:** [TODO]
- Felület: [TODO] (pl. lapos, nincs árnyék, nincs gradient; hierarchia méretből, súlyból, színváltásból)

## Színek (két változat, videónként váltva)

| Szerep | A változat | B változat |
|---|---|---|
| Alap (sötét regiszter) | [TODO] | [TODO] |
| Emeltebb felület | [TODO] | [TODO] |
| Szöveg | [TODO] | [TODO] |
| Halk szöveg | [TODO] | [TODO] |
| **Kiemelő / „kijelentő” lap** | [TODO] | [TODO] |

- A kiemelő szín teli háttérként csak a videó 1–2 legfontosabb szavának jár.
- Probléma = piros kiemelés, megoldás = zöld kiemelés (a kijelölt kulcsszón).

## Mozgás
- Gyors, határozott, ne legyen „PowerPoint-effekt”
- A számok mindig pörögjenek fel 0-ról
- Minden pillanatban legalább 3 réteg mozog, a kamera sosem áll

## Tempó
- ~3 mp / fejezet (új fejezetcím), 0,5–1 mp-enként új réteg; ugyanaz a kép legfeljebb ~3 mp (gépi ellenőrzés: `tools/audit-dinamika.py`)

## Hang és zene
- **Hook-zene:** [TODO] (rövid riser + becsapódás), szabad licencű
- **Alapzene:** szabad licencű, ütemes, halkan, beszédnél duckolva; ha a kedvenc számod csak a platform zenetárában van, zene nélküli render, és a zenét az appban adod hozzá
- **Effektek:** whoosh, kattintás, pop, valódi gépelés-hang; ingyenes, CC0 forrásból (nem kreditből generálva)

## Felirat
- Max. 3 szó egyszerre, az aktív szó kiemelve, a biztonságos sávban; stílus: [TODO]

## Háttér-ritmus
- Fejezetenként váltakozik (sötét → világos → papír / textúra …); két egymást követő fejezet háttere nem lehet azonos

## Állandó elemek
- Logó / handle vízjel: [TODO]
- Intro: nincs (rögtön a hook)
- Outro: 2–3 mp komment-CTA, nagy kulcsszóval
