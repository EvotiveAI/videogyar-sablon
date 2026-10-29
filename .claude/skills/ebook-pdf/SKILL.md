---
name: ebook-pdf
description: Brandelt PDF-útmutatót / e-bookot készít (a komment-CTA "gyakorlati útmutatója", puska, checklista). HTML-ből headless Chrome-mal A4 PDF, a weboldal designjával, logóval fent, UTM-linkes zárással. Használd, ha a felhasználó PDF-et, e-bookot, puskát, útmutatót, lead magnetet kér, vagy egy videó CTA-anyagát kell elkészíteni.
argument-hint: "\"téma\" [videó content id]"
---

# /ebook-pdf

Minden kiküldött anyag (a komment-CTA után DM-ben küldött "gyakorlati útmutató") így készül. Az első kész útmutatód lesz a minta a többinek.

## Tanult szabályok (feedbackből)
<!-- A /feedback skill írja. Ezek felülírják a lenti általános lépéseket. -->
- **A weboldal designja a mérce:** színek, betűk, gombok, kártyák a felhasználó weboldaláról (`brand/brand.md` → Weboldal), ne a videós stílusból. Ha nem egyezik, az anyag nem kész
- **Logó minden oldal tetején** (fejléc), nem csak a láblécben. A szóvédjegy és a mottó a márka írásmódjával, a mottó végén pont
- **Oldalszám és lábléc a helyén:** a lábléc a lap aljára igazodik, soha nem lóg bele a tartalomba, az oldalszám egy sorban marad ("1 / 2", nem tördelve). A tartalom és a lábléc között fix hely van (flex oszlop, nem abszolút pozíció)
- **Zárás:** „Ha érdekel még több tartalom, kövess be Instán, vagy látogass el a weboldalunkra.” A „Kövess be Instán” gomb a saját Instagram-profilodra visz (`brand/brand.md`), mellette a weboldalad linkje **UTM-paraméterrel** (mérhető forgalom)
- **Telepítési útmutató (skill- és eszközvideóhoz) = segítség:** 1) kimásolható link + kész mondat a Claude-nak („Telepítsd ezt a skillt, és nézd meg, hogy a /… működik”), mellette a plugin-parancs; 2) mire tudod használni: use case-ek bemásolható kéréssel; 3) tippek és trükkök két oszlopban (Csináld / Ne csináld); 4) gyakori hibák táblázat (Ha ezt látod → Ezt csináld); 5) „Ha csak hármat jegyzel meg”; 6) zárás
- **Számok és arányok nem kellenek:** a videóban elhangzott százalékos ígéretek (pl. −50% token, +250%) és statisztikák nem kerülnek az útmutatóba, és „a készítő állítása, mérd meg” típusú figyelmeztetést sem írunk. Csak a használathoz szükséges tény maradhat (pl. mi kell hozzá, melyik parancs)
- **Az időzítő nem tiltott:** ne írd, hogy az automata posztolás tilos vagy veszélyes. A hivatalos időzítő (Metricool és társai) rendben van, ajánld is. Csak a botokat (kommentelő, követő, DM-küldő) említsd kerülendőnek

## UTM-séma (mindig így)
`?utm_source=pdf&utm_medium=lead_magnet&utm_campaign=<anyag-slug>&utm_content=<videó content id>`
- `utm_campaign`: az anyag mappaneve (pl. `claude-puska`), így látszik, melyik anyag hoz forgalmat
- `utm_content`: melyik videó kommentjéből jött (pl. `2026-01-15-claude-tippek`); ha több videó is ezt küldi, mindegyik saját PDF-változatot kap ezzel a mezővel
- A linket a PDF-ben kattinthatóra tedd (`<a href>`), és írd ki rövid, olvasható formában is
- A `utmutatok/<slug>/README.md`-be írd be a teljes linket. A felhasználó a Google Analyticsben a forrás / médium = `pdf / lead_magnet` szűrővel látja a forgalmat és a konverziót

## Lépések
1. **Mappa:** `utmutatok/<slug>/` → `index.html`, `assets/` (fontok, logó), `README.md` (forrás, ellenőrzés dátuma, UTM-link, melyik videóhoz).
2. **Tartalom:** csak ellenőrzött állítás (hivatalos dokumentáció / research.md), a dátummal. Egyszerű nyelv, a célközönségednek (`brand/brand.md`). A végén a humanizer szabályai szerint átnézve (`~/.claude/skills/humanizer/SKILL.md`): nincs "nem X, hanem Y", kötőjel-áradat, felfújt mondat.
3. **Felépítés:** fejléc (logó + mottó) minden oldalon → cím, alcím, „így használd” sáv → tartalmi kártyák kategóriánként → „ha csak hármat jegyzel meg” összefoglaló → záró CTA-blokk UTM-linkkel → lábléc (oldalszám, ellenőrzés dátuma).
4. **Render:** `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf=<slug>.pdf "file://$PWD/index.html"` (8 GB gép: közben más nehéz folyamat ne fusson).
5. **Ellenőrzés (kötelező, átadás előtt):** olvasd vissza a PDF-et oldalanként (Read), és nézd meg: semmi nem lóg ki, a lábléc nem ér a tartalomba, az oldalszám egy sorban van, a fontok betöltődtek (nem Arial/Helvetica), a link működik. Ha bármi elcsúszik, javítsd, és renderelj újra.
6. **Átadás:** a PDF-et `SendUserFile`-lal küldd el, és írd meg a UTM-linket.
