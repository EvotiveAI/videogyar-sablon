---
name: heti-terv
description: Szombati heti tervezés a social naptárhoz. Kitölti a jövő hét 21 posztját (napi 3, három színnel) a kész készletből, megmondja, mit kell felvenni és mit csinál a gyár, és frissíti a naptárat (docs/social-naptar.html + .ics). Használd, ha a felhasználó azt mondja, „tervezzük meg a hetet”, „heti terv”, „mit kell felvenni”, vagy szombaton a felvétel előtt.
---

# /heti-terv

A cél: szombaton 30 perc alatt kész a jövő hét terve, és a felhasználó pontosan tudja, mit vesz fel.
A stratégia a felhasználóé (`docs/social-strategia.md`): az ütemet nem lassítjuk, a hiányra megoldást adunk.

## Szabályok

- **Napi 3 poszt, fix időben:** 7:30 tanít (halványzöld), 12:00 bizonyít (lime), 19:30 megállít (sötétzöld). Az idők a `content/_social/naptar.json` `idopontok` mezőjében vannak.
- **A formátum keverhető:** videó, karuszel, statikus. Egy nap lehet 2 videó + 1 karuszel, vagy 1 videó + 1 karuszel + 1 statikus.
- **Platformonként más mehet:** pl. Instára az arcos, személyes tartalom; az arc nélküli sorozat és a VIRAL csak TikTok + YouTube Shorts, ott napi 1 extra. A te szabályod a `docs/social-strategia.md`-ben.
- **Ügyfélsikerből heti 2** a felhasználótól (ha van). A lime sáv többi része gyár: eredmény-animáció, képernyő-bejárás (screen-recorder), eredmény-karuszel, statikus nagy szám, referencia videó 9:16-ban.
- **A tanít sáv** alapból karuszel az előző esti videóból (gyár). Ha a felhasználó többet vesz fel, a többlet ide megy arcos tippként.
- Számok csak a saját, ellenőrzött bizonyíték-listádból (`brand/brand.md` → Bizonyítékok). Hangnem: `brand/brand.md`. Ügyfélnév csak engedéllyel: `engedely` mező.

## Menet

1. **Állapot.** Olvasd el: `content/_social/naptar.json`, `docs/social-strategia.md`, és a `content/*/meta.yaml`-okat (`ready_to_post`, `posted`). Nézd meg, mi ment ki a héten (ha a Metricool connector be van kötve: `getScheduledPosts`, elemzés), és hogy a következő hét napjai léteznek-e már a naptárban.
2. **A jövő hét 21 helye** (hétfőtől vasárnapig). Minden helyre egy poszt ezekkel a mezőkkel: `szin` (S/L/H), `ido`, `formatum` (video/karuszel/statikus), `allapot` (kesz/gyar/felvenni), `cim`, `hook`, `forras`, `kulcsszo`, `engedely`, `render`, `megjegyzes`. Sorrend: kész készlet → gyár → felvenni.
3. **Felvételi lista.** Minden FELVENNI helyhez a creative-director agent ad konkrét témát és hookot (sorozatrésznél a sorozat-biblia, ügyfélsikernél az ügyfél-anyagok alapján). Alap: heti 9 (7 sorozatrész + 2 ügyfélsiker). Ha a felhasználó többet akar felvenni (16-ig gond nélkül, akár 30), add hozzá: arcos tippek a tanít sávba, utána TikTok/YouTube extra.
4. **Hiánylista a hétre:** render (felhőben: `npx hyperframes cloud render`), borító, karuszelek és statikusok, DM-útmutató minden kulcsszóhoz (`/ebook-pdf`), engedélyek, 9:16 keret a referencia videókhoz. Mindegyik mellé: ki csinálja, meddig.
5. **Mutasd meg a chatben** táblázatban, és várd meg a jóváhagyást:
   `Nap | 7:30 tanít | 12:00 bizonyít | 19:30 megállít` (cellánként: formátum, cím, KÉSZ/GYÁR/FELVENNI), alatta a felvételi lista (sorszám, sáv, téma, hook, hossz), és a hiánylista.
6. **Mentés.** Írd be a `content/_social/naptar.json`-ba, futtasd: `node tools/social/naptar.mjs` (frissül a `docs/social-naptar.html` és a `docs/naptar-import/*.ics`). Szólj, hogy az .ics-t újra kell importálni.
7. **Ütemezés:** videó = Instagram Reels + Facebook Reels + TikTok + YouTube Short. A TikTok- és YouTube-cím kötelező (rövid, a hook alapján), a YouTube-nál madeForKids: false.
7a. **Brand-borító nélkül videót nem ütemezünk** (`videoThumbnailUrl`): 1080×1920, a szerep színe, Inter 900 cím a középső 3:4-es sávban, rácsméretben olvasható (3–4 sor, ≥ ~130 px, a jobb felső és bal alsó sarok szabad, **apró szöveg nincs; cetli csak rövid (≤ ~5 szó, kérdés), nagy betűs és nem a bal alsó sarokban**; a legjobban olvasható saját borítód a mérce).
7b. **Minőségőr ütemezés előtt (kötelező):** minden posztra `node tools/social/minoseg.mjs <diák mappája | videó.mp4> --szoveg <post.md>`. Ha „NEM MEHET KI”, javítani kell, nem ütemezünk. A `panorama.mjs` figyelmeztet, ha egy fotó kisebb, mint ahova kerül: ilyenkor nagyobb felbontású eredetit kérünk.
8. **Felvétel után** (`/ingest`): a gyártás párhuzamos videó-munkamenetekben indul, a GYÁR helyek is. Vasárnap este a felhasználó átnézi a hetet (kapu #2), és csak az ő igenje után megy az ütemezőbe. Posztolni, ütemezni jóváhagyás nélkül tilos.
