# Videósablonok és jelenet-könyvtár

Ez a mappa üresen indul: **a sablonokat te építed meg, a saját stílusodra.** Ez a mennyiségi gyártás kulcsa: ha a sablon kész, egy új videó csak tartalomcsere. Nulláról minden videó kiszámíthatatlan (idő, minőség).

## 1. Az első induló sablon
A legjobban sikerült első videódból emeld ki a vázat (pl. `video-templates/starter/`):
- üres jelenet-helyek (pl. `compositions/sc01–sc07.html`), mindegyik külön sub-composition, hogy két motion-agent párhuzamosan dolgozhasson
- hang és alapzene helye (duckolva a beszéd alatt), vágás-effektek
- felirat-hely (a captioner külön fájlba dolgozik)
- időzítés-váz (ANCHORS): minden jelenet egy kimondott szóhoz kötve, így a hang változásakor nem kell átírni a jeleneteket
- közös segédfájl (pl. `shared.js`: zónák, kamera-mozgás, helyi idő)
- `SHARED.md`: ki melyik fájlt írja (A agent: `index.html` + időzítés + sc01–04; B agent: sc05–07), hangsáv-tartományok, LOCK-szabály
- előkészítő script (pl. `scripts/init.mjs`): bemásolja a hangot, a leiratot és a könyvtár aktuális állapotát (nem link: a videónak a gyártáskori állapotot kell megőriznie)
- `README.md` a lépésekkel

Használat: `cp -R video-templates/starter content/<id>/composition` → előkészítő script → a két motion-agent kitölti a saját jeleneteit. A `/produce` így indul.

## 2. Jelenet-könyvtár (♻️)
Amit egyszer megépítettél és bevált (díszlet, figura, kellék, 2D grafika, átmenet), az kerüljön egy könyvtárba (pl. `video-templates/konyvtar/`):
- `CATALOG.md`: elemenként egy mondat, mintakép, példakód, **beépítési idő**
- `MOTION.md`: a mozgásnyelv (easing funkció szerint, 2–3 átmenet-típus)
- minden elem paraméterezhető (szöveg, szín, ütemek) és **determinisztikus** (ugyanaz az időpont mindig ugyanazt a képet adja: nincs véletlen, végtelen ismétlés, időzítő)
- a kreatív rendező elsőként innen tervez, a motion-designer innen épít, és minden új 🆕 elemet ugyanabban a körben visszament ide

## 3. Eszközgyártás nagy adagban (éjjel)
Ha sok elem kell (pl. 100+ mozgó grafika), ne egyenként: egy brief + egy közös szerződés + témánként egy agent, párhuzamosan.
1. **Brief:** mit, milyen stílusban, milyen méretben, mik a tiltások.
2. **Közös szerződés:** minden elem ugyanúgy regisztrál (név, paraméterek, méret, demó), a közös segédfüggvényeket használja, csak a saját modulfájlját írja; minden elemben ≥3 mozgásréteg.
3. **Témánként egy agent,** párhuzamosan, a gépi záron át.
4. **Gépi ellenőrzés:** képkockák hívásonként 5–8 elemről, legfeljebb 2 javító kör; ami utána sem jó, kimarad. Reggel válogatás, a jók a katalógusba.

## 4. Kész elemek, mielőtt építesz
- Ingyenes, kereskedelmi célra is szabad: Kenney (CC0 3D és 2D), OpenGameArt, itch.io CC0, HyperFrames-registry (`npx hyperframes add`)
- AI-kép: a kreatív rendező megírja a promptot, te ~1 perc alatt legenerálod
- Minden letöltött elemet vezess egy licenc-táblázatban (forrás, licenc, mire jó)
- Figyelj a licencre: pl. a Mixamo-animációk nyersen nem terjeszthetők, a fizetős zenék nem keverhetők a fájlba
