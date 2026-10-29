# Mért gyártási idők (ebből becsül a kreatív rendező, nem fix számokból)

> Szabály: az időbecslés a **valódi mért adatokból** jön, nem hardcode-olt szint-időből.
> Minden kész videó után a videó-munkamenet ide ír egy sort. A becslés = a hasonló sorok átlaga + a különbségek.

## Videónkénti mérések (falióra, a jóváhagyástól / felvételtől a posztolásra kész állapotig)

| Dátum | Videó | Típus | Hossz | Jelenet | 3D (könyvtári ♻️ / új 🆕) | Képernyőfelvétel | Teljes idő | Motion-agentek ideje | Motion token |
|---|---|---|---|---|---|---|---|---|---|
| _minta_ | _sorozatrész-01_ | _faceless, SOROZAT, MEDIUM, induló sablonból_ | _45 mp_ | _7_ | _6 / 0_ | _nincs_ | _~13 perc (TTS ~2, whisper <1, motion A+B párhuzamosan ~10, check ~3)_ | _A ~10 p + B ~10 p_ | _A ~200e + B ~210e_ |

## Lépésenkénti tipikus idők (egy működő gyár méréseiből; cseréld a sajátjaidra)

| Lépés | Tipikus idő | Megjegyzés |
|---|---|---|
| ElevenLabs TTS | ~1–2 perc | kredit: karakterszám ≈ kredit |
| Whisper (egy példány) | ~1 perc / 1–1,5 perc hang | |
| Storyboard + váz | ~3–5 perc | |
| Motion, 2 agent párhuzamosan, 2D, 7–12 jelenet | ~9–10 perc | a jelenetszám alig számít, a rétegek igen |
| Könyvtári 3D jelenet beillesztése | ~6 perc / jelenet | az első javító körrel ~6–11 perc |
| Új 3D elem | még nincs mérésed | becsüld óvatosan, és mérd |
| Új weboldal-felvétel | ~6 perc / oldal | párhuzamosan mehet a motionnel |
| Check + snapshot + javítás | ~3–5 perc | |
| Csomagolás | ~1–2 perc | |

## Amit a mérések megmutattak (egy működő gyárból)
- Egy korai, sablon nélküli videó 96 perc volt (ember ~24, gép ~72); a 12 jelenet megírása ebből csak ~12 perc. Az idő az egyszeri előkészítésen, a soros munkán és a hibakeresésen ment el. Megoldás: induló sablon + két párhuzamos motion-agent.
- Sok párhuzamos munkamenet mellett a nehéz munka közös sorára (gépi zár) várás órákat is vihet: ütemezd a renderelést.
- Egy új sablon kitalálása egyszeri befektetés (órák), utána minden videó gyorsabb.
