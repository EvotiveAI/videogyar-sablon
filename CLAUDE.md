# Tartalomgyár: félautomata short-form videógyár

Ez a repó egy félautomata short-form videógyár (Instagram Reels, TikTok, YouTube Shorts, Facebook Reels).
A cél: tartalom a célközönségednek (`brand/brand.md`) → követők → érdeklődők → ügyfelek.
**Mennyiség > tökéletesség.** Egy jó videó ma többet ér, mint egy tökéletes jövő héten.

Mielőtt bármit gyártasz, olvasd el: `brand/brand.md`, `brand/content-pillars.md`, `brand/learnings.md`.

## A pipeline

Minden videó egy mappa: `content/YYYY-MM-DD-slug/`, az állapota a `meta.yaml` `status` mezőjében van.
A mappát mindig a `content/_TEMPLATE/` másolatából hozd létre.

```
idea → researching → concept_ready ──[EMBER #1: jóváhagyás]──→ approved
                                                           └─→ rejected
approved ─┬─ format: faceless → narrator → transcriber ─────────────┐
          │   (ha a szkript valódi weboldalt mutat: + screen-recorder)  │
          └─ format: face → awaiting_footage ──[EMBER: felvétel]──→ │
                             (ingest) → transcriber → editor ───────┤
                                                                    ▼
                         motion-designer → captioner → render → packager
                                                                    ▼
                     ready_to_post ──[EMBER #2: megnézi + posztolja]──→ posted → measured
```

| Status | Ki állítja | Jelentés |
|---|---|---|
| `idea` | idea-scout | Ötlet a backlogban |
| `researching` | researcher | Kutatás folyamatban |
| `concept_ready` | scriptwriter | Szkript kész, **emberi jóváhagyásra vár** |
| `approved` / `rejected` | **ember** (`/review`) | Mehet gyártásra / kuka (indoklással a `meta.yaml` `notes` mezőjében) |
| `awaiting_footage` | orchestrator | Arcos videó: a felvételre vár (`inbox/raw/`) |
| `in_production` | orchestrator | Gyártás folyamatban, a `stage` mező mutatja, hol tart |
| `ready_to_post` | packager | Kész, **emberi ellenőrzésre + posztolásra vár** |
| `posted` | **ember** | Kint van (dátum + linkek a `meta.yaml`-ben) |
| `measured` | analyst | Metrikák rögzítve, tanulságok kinyerve |
| `failed` | bárki | Elakadt: a `notes` mezőben az ok, emberi ránézés kell |

## Szabályok az orchestratornak (a fő Claude-munkamenet)

1. **Minden szerep egy subagent** (`.claude/agents/`). A fő munkamenet nem gyárt maga, hanem delegál, és a lépések között frissíti a `meta.yaml` mezőit.
2. **Két kapu van, ezeket soha ne ugord át:** `concept_ready → approved` és `ready_to_post → posted`. Ezeket csak az ember állítja. (Kivétel csak akkor, ha a `brand/brand.md`-ben `auto_approve: true` szerepel.)
3. **Hiba esetén ne állj le az egész batch-csel.** Az adott videót tedd `failed` állapotba, írd az okot a `notes` mezőbe, és lépj a következőre. Éjszakai futásnál ez kötelező.
4. **A tények forrásból jönnek.** A szövegíró csak a `research.md`-ben forrással alátámasztott állítást használhat. Kitalált szám, dátum vagy funkció nem lehet. **Kivétel: virális-másolás mód** (lásd lent): ott a forrás az eredeti videó, a bizonytalan állítás ⚠️-lel bent marad, és a felhasználó validálja a jóváhagyáskor.
5. **A tartalom nyelve** a `brand/brand.md` szerint (alap: magyar, tegező, közvetlen). Az angol szakszavakat a TTS a `brand/kiejtes.md` alapján ejti.
6. **Fájlnevek és ID-k ASCII-k**, ékezet nélkül (`2026-01-15-claude-skillek`).
7. A nagy médiafájlok (`*.mp4`, `*.mov`, `*.wav`, `*.mp3`) nem kerülnek gitbe, lásd `.gitignore`.
8. Az állapot áttekintéséhez: `node scripts/status.mjs`.
9. **Gépterhelés (kötelező, főleg 8–16 GB RAM-os gépen):** nehéz helyi folyamat (whisper, render, headless Chrome, yt-dlp-letöltés, videókódolás) mindig a `tools/egyszerre.sh <parancs>` záron át fusson (gépszintű sor: egyszerre legfeljebb 3, a többi vár, automatikusan háttér-prioritáson). **Tömeges whisper-leiratozás tilos**: egy 8 GB-os gép egyszer lefagyott és kikapcsolt tőle. Virális videóknál a cím elég, whisper csak a saját videód hangjára fut, egyesével. Videókódolás hardverrel (Macen `-hwaccel videotoolbox` … `-c:v h264_videotoolbox -q:v 65`), 4K-t csak egyszer, a legelején skálázz le. A gép állapota: `tools/heat.sh`. Ha a gép kevés, a render mehet felhőbe (`npx hyperframes cloud render`).

## Munkamenet-modell: koordinátor + videónként egy munkamenet

- **A fő munkamenet a koordinátor („agy”).** Nem gyárt videót. Ötletet választ, új munkameneteket indít és követ, a rendszert (szabályok, agentek, brand) karbantartja, és válaszol a felhasználónak.
- **Minden új videó külön Claude-munkamenetben fut** (akár 10 egymás mellett). A koordinátor indítja, és a briefben leírja, hogyan néz ki egy ilyen munkamenet (lásd lent). Így a videók nem keverednek, egy elakadás nem állítja meg a többit, és bármelyik bármikor folytatható.
- **Ötlet kiválasztása:** ha van feldolgozatlan ötlet az `otletek/` dobozban, onnan vesz egyet; ha nincs, az idea-scout hoz egyet. A felhasznált ötlet fájlja azonnal az `otletek/feldolgozva/` mappába kerül (`status: felhasznalva`, `video: <content id>`). Felhasznált ötletből soha nem lesz újra ötlet.
- **A videó-munkamenet menete:**
  1. A `content/<id>/` mappa létrehozása, majd researcher → scriptwriter → **creative-director: szint-javaslat** (2–3 változat szintenként egy sorban, becsült idővel, ajánlással) → **a felhasználó a szkripttel együtt szintet választ** → creative-director: teljes `storyboard.md` **csak a választott szinten**, és csak utána `concept_ready`.
  2. **A szkriptet a felhasználónak el kell fogadnia** (kapu #1), ebben a munkamenetben. Két kör: **szöveg-kör** (a chatbe csak a sima szöveg megy, mondatonként, táblázat nélkül), majd **storyboard-kör** (táblázatban: `# | Idő | Háttér | Képernyőn | Felolvasva (szó szerint) | Animáció`, minden javítási kör után újra). Csak kifejezett „mehet” után lesz `approved`.
  3. Utána jönnek az agentek **párhuzamos hullámokban** (részletek: `/produce`): 1) narrator + screen-recorder + motion-váz + packager-vázlat; 2) transcriber; 3) a motion időzítése + captioner; 4) check, packager QA → `ready_to_post` (render csak kérésre). **Motion mindig két párhuzamos agenttel** (jelenetenként külön sub-composition, 1. fele / 2. fele; az `index.html` és az időzítés az 1. agenté). A TTS-t a videó-munkamenet hívja, mert a subagent nem látja a hang-connectort. Cél: ~30 perc / videó.
  4. A végén rövid jelentés a koordinátornak (mi készült, mennyi kredit ment el, mi akadt el), és a mért idő bekerül a `docs/mert-idok.md`-be.

## Kategória × szint (cél: átlag ~30–40 perc / videó)

Minden videónak két mezője van a `meta.yaml`-ban: **`kategoria`** (miről szól) és **`szint`** (mennyi munkát teszünk bele). A kreatív rendező és a motion-designer a szinthez tartja magát.

**Kategória (alap, bővíthető):** `HIR` (hír, gyors téma) · `VIRAL` (virális-másolás, biztonsági háló) · `SOROZAT` (a sorozat-biblia szerint, `brand/sorozatok/`) · `UGYFELSIKER` (valódi ügyfél-eset, arccal; csak írásos engedéllyel)

| Szint | Mit szabad | 3D | Storyboard | Cél idő |
|---|---|---|---|---|
| `LITE` | **végig 2D**, csak a könyvtárból, a hook és a CTA is; csak szöveg + ütemek | nincs | ≤ 1 oldal | a mért adatokból |
| `MEDIUM` | 2D, szabad kreativitás: új 2D grafikák, saját koreográfia, kép-kérés; **a könyvtár kész 3D elemei is**, új 3D építés nélkül | ♻️ | ≤ 1,5 oldal | a mért adatokból (`docs/mert-idok.md`) |
| `HIGH` | **csak ha új 3D elemet kell építeni**: legfeljebb 1 új 3D elem | ♻️ + max. 1 🆕 | részletes | a mért adatokból |
| `MAX` | sok jelenet és animáció, 1–2 új 3D elem; csak a felhasználó kérésére | ♻️ + 1–2 🆕 | részletes | a mért adatokból |

- **Időbecslés valós adatból:** a szinteknek nincs fix ideje. A kreatív rendező a `docs/mert-idok.md` mért soraiból becsül, és minden kész videó után a videó-munkamenet beírja oda a mért időt és tokent. A könyvtári ♻️ 3D nem tesz egy videót `HIGH`-ba.
- **Alapszint:** a többség `MEDIUM`. `HIR` → `LITE` · `VIRAL` → `MEDIUM` · `SOROZAT` → epizódonként. A felhasználó a jóváhagyáskor felülírhatja.
- **Képernyőfelvétel minden szinten:** ha a videó valódi dologról beszél (eszköz, weboldal, repó, parancs), azt valódi felvétellel mutatjuk meg (screen-recorder).
- A fix lépések (hang, leirat, felirat, check, csomagolás) ~8–10 perc; a cél idő ezt tartalmazza. A `HIGH` ritka (heti 1–2), a `MAX` csak kérésre.
- **🆕 előtt kész megoldás:** előbb a saját könyvtár, aztán kereskedelmi célra is szabad forrás (Kenney, OpenGameArt, itch.io CC0, HyperFrames-registry), vagy egy AI-kép, amit a felhasználó ~1 perc alatt legenerál a kész prompttal. A felhasználóhoz kész javaslattal menj (link, licenc, előnézet, beépítési idő).
- Ami 🆕-ként készül és bevált, bekerül a jelenet-könyvtárba (`video-templates/<könyvtár>/CATALOG.md`), így legközelebb `MEDIUM`-ban újrahasznosítható. Hogyan épül: `video-templates/README.md`.

## Stílusok
- **ANIMÁCIÓS** (faceless): klónozott TTS-hang + animáció.
- **VIDEÓ + ANIMÁCIÓS** (arcos): a felhasználó saját arca és hangja, elrendezés-váltással (osztott / teljes animáció / teljes arc). Recept és elakadások: `docs/sop-video-plusz-animacio.md`; automata első vágás: `tools/videoanim/vagas.py`.

## Virális-másolás mód

Ha a videó egy nagyot ment videóból készül (`/viral-kereso` találat), a cél a bizonyítottan működő videó saját változata:
- **Hook:** az A hook az eredeti szinte szó szerinti fordítása. **Kitalálni tilos:** ha az eredeti hook nem ismert, előbb ki kell venni a videóból. Csak a B hook kísérletezhet.
- **Törzs:** ugyanazok az elemek, állítások és sorrend, a te hangodon és CTA-ddal. Tartalmat nem cserélünk ki.
- **Tények:** a forrás az eredeti videó. A bizonytalan állítás ⚠️-lel bent marad, a szkript végén „Ellenőrizd” lista; a felhasználó validálja a jóváhagyáskor.
- **Kutató:** nem tényt ellenőriz, hanem azt elemzi, **miért működik** a videó.
- Más alkotó szövegét szó szerint nem másoljuk: „a forma szabad, a mondat nem”.

## Social stratégia

A posztolási terv: `docs/social-strategia.md` (pl. napi 3 poszt: videó, karuszel, statikus keverve, + story). **A stratégia a felhasználóé, nem írjuk át** (pl. napi 3-ból nem lesz napi 1). Az AI dolga: mi hiányzik hozzá, hogyan oldjuk meg a szűk keresztmetszetet, és mit kell a felhasználónak felvennie.

**Heti rendszer:** napi 3 poszt fix időben (pl. reggel tanít, délben bizonyít, este megállít). Szombaton `/heti-terv` (a jövő hét 21 helye + felvételi lista + hiánylista), utána felvétel, vasárnap jóváhagyás és ütemezés. A naptár: `content/_social/naptar.json` → `node tools/social/naptar.mjs` → `docs/social-naptar.html` + `docs/naptar-import/*.ics`.

## Ötletdoboz

A felhasználó saját ötletei az `otletek/` mappába kerülnek (`INBOX.md` egysoros, vagy külön `.md` fájl). Ha a chatben azt mondja, „ötlet: …”, te írd be. Az `/ideas` és a `/nightly` **elsőként ezeket** dolgozza fel.

## Feedback = tanulás (kötelező)

Ha a felhasználó azt mondja, hogy **„feedback”**, vagy olyan kritikát / kérést ad, ami később is érvényes, futtasd a `/feedback` skillt: naplózás a `feedback/` mappába, és szabály az érintett agent `## Tanult szabályok` szekciójába.
**Minden agent a munkája előtt elolvassa a saját Induló és Tanult szabályait. A Tanult szabályok felülírják az általános szabályokat.**

**Saját tanulságok (lessons):** minden agentnek van egy `.claude/agents/lessons/<agent>.md` fájlja. Munka **előtt** elolvassa, munka **után** beírja, ha hibázott vagy valamit többször kellett újracsinálni (`Hiba → Ok → Megelőzés`). A Tanult szabályok a felhasználó feedbackje, a lessons az agent saját tapasztalata.

**A diktált szöveg teljes marad.** Ha a felhasználó bediktál egy szöveget, a teljes szöveget mutatjuk vissza, csak összerakva (sorrend, tördelés, elírásjavítás). Rövidíteni, átírni, kihagyni, hozzáírni tilos; a javaslat külön, a szöveg alatt.

**A jóváhagyott szöveg lezárt.** A `concept_ready → approved` után a szöveg nem változik; ha mégis kell, az új jóváhagyás, és a gyártás érintett része újraindul (idő + kredit). Ezért jóváhagyás előtt a szöveget hangosan, „kinek szól” szemmel végig kell olvasni.

**Sablon-hibát a sablonban is javítsd.** Ha egy videóban egy sablon (`video-templates/...`) hibáját javítod, ugyanabban a körben a sablonba és a SOP „Ami elakadás volt” táblájába is bekerül; csak a videó mappájában javítani tilos, különben holnap ugyanaz jön elő.

A cél: a felhasználónak soha ne kelljen ugyanazt kétszer elmondania.

## Parancsok (skillek)

| Parancs | Mit csinál |
|---|---|
| `/ideas [db]` | Ötletek → kutatás → szkript. N db koncepciót hoz `concept_ready` állapotba |
| `/review` | Végigviszi az embert a jóváhagyandó koncepciókon és a kész videókon |
| `/produce` | Az összes `approved` videót legyártja egészen a `ready_to_post` állapotig |
| `/ingest` | Az `inbox/raw/`-ba dobott felvételeket hozzárendeli a megfelelő videóhoz |
| `/nightly` | Éjszakai műszak: `/produce`, majd `/ideas` a holnapi adaghoz |
| `/learn` | Heti elemzés: a metrikákból tanulságokat ír a `brand/learnings.md`-be |
| `/feedback` | A felhasználó visszajelzését naplózza és szabállyá alakítja az érintett agentnél |
| `/ebook-pdf "téma"` | Brandelt PDF-útmutató a komment-CTA-hoz (weboldal-design, logó, UTM-linkes zárás) |
| `/heti-terv` | Szombati heti tervezés: a jövő hét 21 posztja a naptárban, felvételi lista, hiánylista |
| `/viral-kereso "ötlet"` vagy `trend` | Nagyot ment Shortsot és TikTokot keres (≥ 100K nézés vagy ≥ 1000 komment) |

## Eszközök

- **Videó/motion:** HyperFrames (`/hyperframes` és a kapcsolódó skillek), renderelés: `npx hyperframes render`
- **Hang (TTS):** ElevenLabs + a felhasználó hangklónja, a connectoron keresztül (beállítás: `narrator` agent, `brand/brand.md` → Hang)
- **Leirat:** helyi whisper.cpp `large-v3`, ingyenes (egyszerre egy példány): `python3 tools/whisper/transcribe.py <hang> <kimenet.json>` (a modell a `tools/whisper/models/` alá kerül, gitben nincs)
- **Utómunka:** ffmpeg
- **Weboldal-felvétel:** `node tools/recorder/record.mjs` (headless Chrome, a `screen-recorder` agent használja)
- **Virális keresés:** `python3 tools/viral/find.py --tags ... | --trend` (a `/viral-kereso` használja, kimenet: `inbox/viral/`)
- **Social:** `tools/social/` (naptár, borító, karuszel, highlight, minőségőr), ütemezés pl. Metricool-connectorral
- **Áttekintés:** `node tools/dashboard/server.mjs` (helyi vezérlőpult, http://localhost:8770)
