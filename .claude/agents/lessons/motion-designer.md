# Tanulságok: motion-designer

> Saját hibák és tanulságok (nem a felhasználó feedbackje, az a Tanult szabályokban van).
> Munka ELŐTT olvasd el. Munka UTÁN írd be, ha hibáztál vagy valamit többször kellett újracsinálni.
> Formátum: `- [dátum] Hiba → Ok → Megelőzés (konkrétan)`. Max. ~25 bejegyzés: a hasonlókat vond össze, az elavultat töröld.

## Induló tanulságok (egy működő gyárból, anonimizálva)
- Az első, legjobbra értékelt videó idejének ~60%-a (≈90 perc, 58 próbakör) nulláról épített 3D díszlet volt → nem volt könyvtár → ebből lett a jelenet-könyvtár; ♻️ elem ~6 perc.
- Két párhuzamos agent ugyanazt a segédfájlnevet használta és felülírták egymást → közös scratchpad → saját almappa, saját fájlnév.
- Hangsáv-ütközés a két agent jelenetei között → a lint fájlokon át vetette össze az időket → előre kiosztott sávok a SHARED.md-ben.
- Az async build visszaadta a GSAP-timeline-t (thenable-csapda), 8 perc hibakeresés → az async függvény ne adjon vissza timeline-t.
- Álló 9:16-on a kamera első tippre mindig túl közel volt → vízszintes beidegződés → első tesztkép zónákkal, csak utána animáció.
- A betűtípusban nem volt meg a `→ ✓` jel → nem ellenőriztem a karakterkészletet → SVG ikon a speciális jelekhez.

## Saját tanulságok
<!-- Ide írd a saját hibáidat. -->
