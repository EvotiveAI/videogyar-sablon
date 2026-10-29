# Hogyan működik ez az egész? (és hol kellesz te)

## 1. A rendszer egy mondatban

Claude Code itt egy **karmester**: a `CLAUDE.md` mondja meg neki a folyamatot, a `.claude/agents/` a stábot (12 szerep),
a `.claude/skills/` pedig a parancsokat (`/ideas`, `/produce`…). Minden videó egy mappa, aminek az állapota egy fájlban van.
Így a folyamat bármikor megállítható és folytatható, és éjszaka is tud dolgozni.

**Agent vs. skill:** az *agent* a munkaköri leírás (ki vagy, mit kapsz, mit adsz le), a *skill* a szakmai tudás (hogyan csinálj jó feliratot).
A később küldött skilleket az agentek `## Skillek` szekciójába kötjük be.

## 2. Mennyire automata? Lépésenként, őszintén

| Lépés | Automata? | Megbízhatóság ma | Megjegyzés |
|---|---|---|---|
| Ötletgyártás | ✅ teljesen | jó | Az első hetekben sok lesz a "langyos" ötlet. A `learnings.md` és az elutasítási indoklások javítják |
| Kutatás | ✅ teljesen | jó, de ellenőrizni kell | **A legnagyobb kockázat a téves tény.** Ezért kell forrás minden állításhoz |
| Szkript | ✅ teljesen | jó | A magyar szövegírás minősége erős, a hook-írás a gyengébb pont, ezért van 2 változat (A + B) |
| **Koncepció jóváhagyás** | 👤 **TE** | — | ~1 perc/koncepció. Ez a minőség fő szűrője |
| Hang (faceless) | ✅ teljesen | közepes-jó | A magyar TTS jó, de angol szavaknál botlik → kiejtési szótár |
| Felvétel (arcos) | 👤 **TE** | — | Batch-ben: 5 videó szkriptje ~20–30 perc teleprompterről |
| Leirat | ✅ teljesen | jó | Whisper large-v3 + magyar nyelv, és a szkripthez igazítjuk |
| Vágás (arcos) | ✅ teljesen | közepes | Csend- és bakivágás megbízható, a "ritmusérzék" kevésbé |
| Motion grafika | ✅ teljesen | **sablonfüggő** | Sablonból megbízható, a nulláról minden videóban kiszámíthatatlan. **Ezért sablonokra építünk** |
| Felirat + render | ✅ teljesen | jó | |
| Poszt szöveg, QA | ✅ teljesen | jó | |
| **Végső ellenőrzés + posztolás** | 👤 **TE** | — | ~2–3 perc/videó |
| Elemzés | 🟡 félig | — | A metrikákat eleinte te másolod be (Insights), később API |

**Napi idő-ráfordításod faceless módban: ~15–20 perc** (5 koncepció jóváhagyása, 4–5 videó megnézése és posztolása).
Arcos módban plusz ~20–30 perc felvétel, de batch-ben, heti 2× is elég lehet.

## 3. Megoldható faceless csatornával? **Igen.**

Pontosan úgy, ahogy elképzelted: te csak jóváhagysz és posztolsz. De három dolgot érdemes tudni:

1. **Klónozd a saját hangodat (ElevenLabs).** Ez a legfontosabb tanácsom. A faceless videók a *te hangodon* szólnak,
   így amikor később kamerára állsz, a közönség már ismeri a hangodat, és nem lesz törés a brandben.
   Ráadásul egy szakértői szolgáltatásnál a "valódi ember van mögötte" érzés a bizalom alapja.
   (Gyors klón ~1–2 perc hanganyagból, a minőségi klónhoz ~30+ perc kell.)
2. **Faceless = gyorsabb növekedés, gyengébb konverzió.** Szakértői szolgáltatást arcnak adnak el az emberek.
   Ezért a terv: faceless-szel töltjük fel a fiókot és tanuljuk ki, mi működik, aztán fokozatosan jönnek az arcos videók.
   Az első naptól érdemes heti 1–2 arcos videót betenni A/B tesztnek (a rendszer ugyanarra a témára mindkettőt tudja).
3. **Az Instagram egyre inkább bünteti a "tömeggyártott, nem eredeti" tartalmat.** A megoldás nem a kevesebb videó, hanem az,
   hogy legyen benne saját szög, saját példa és saját hang. Ezért van a kutatás és a brand-hang, és ezért nem másolunk mások videóiból.

## 4. Milyen nyelven? **Azon, ahol a vevőid vannak.**

- **A pénz ott van, ahol a vevőid:** ha helyi piacnak adsz el, egy külföldi követő nem vesz tőled.
- **Kisebb a verseny:** angolul a legtöbb szakmai niche telített; magyarul még kevés a minőségi, rendszeres szakmai tartalom.
- **10 000 helyi követő üzletileg többet érhet**, mint 50 000 nemzetközi, mert az ügyfeleid közülük kerülnek ki.
- **A rendszer nyelvfüggetlen:** ha később angol fiókot indítasz, ugyanaz a gyár megy tovább (`language: en` + angol hang). A legjobban teljesítő magyar videókat át lehet fordítani.

## 5. Mennyit posztolj?

A rendszer el tudja vinni a napi 4–5 videót, de **egy fiókra nem ezt javaslom induláskor**. Helyette:
- **Instagram: napi 2–3 Reel**, mindig ugyanakkor, következetesen
- **Ugyanazok a videók TikTokra és YouTube Shortsra is**: ez napi 6–9 megjelenés, extra gyártási munka nélkül
- **A maradék kapacitás menjen hook-tesztre:** minden videóhoz 2 hook-változat készül. Az Instagram **Trial Reels** funkciója
  először nem követőknek mutatja a videót, így a követőidet nem terheled, de látod, melyik hook nyer. A virálisságot így lehet tanulni
- Ha a minőség stabil, és a számok nem esnek, emelj napi 3–4-re

## 6. Az "éjszaka, míg alszom" rész: hogyan lesz automata?

A `/nightly` parancsot kell ütemezetten futtatni, például minden este 23:00-kor. Két lehetőség:

| | Helyi ütemezett feladat (Claude desktop) | Felhős rutin |
|---|---|---|
| Hol fut | A Maceden | Az Anthropic felhőjében |
| Feltétel | **A Mac legyen bekapcsolva és ébren** (töltőn, alvás tiltva) | A repó GitHubon legyen, és a renderhez Chrome + ffmpeg kell a felhős környezetben |
| Javaslat | ✅ **Ezzel kezdünk.** Egyszerű, és minden helyben van | Később, ha stabil a folyamat |

**Két gyakorlati buktató, amit előre megoldunk:**
- **Engedélykérések:** felügyelet nélküli futásnál, ha a Claude engedélyt kér (pl. egy parancs futtatásához), a folyamat megáll és reggelig vár.
  Ezért a projektben előre engedélyezni kell a gyártási parancsokat (ffmpeg, `npx hyperframes`, `node scripts/…`)
- **Költség:** egy videó több agent-hívás plusz render. Az első héten mérjük meg a videónkénti tokenköltséget. A mechanikus szerepek (leirat, felirat, csomagolás) már most az olcsóbb Sonnet modellel futnak

## 7. Feltöltés automatizálása: később, és csak részben

Az Instagram API tud Reelst posztolni (üzleti/creator fiókról), tehát meg lehet csinálni. **De induláskor posztolj kézzel**, mert:
- A trending zenét és egyes funkciókat (Trial Reels, borítóválasztás finomhangolása) csak az appban éred el
- A 2 perces kézi posztolás egyben a végső minőségellenőrzés is
- Ha 2–3 hónap múlva stabil a folyamat, a feltöltést is beköthetjük konnektorral

## 8. Leadgyűjtés: ne felejtsd el

A követő csak az első lépés. Javaslom már az elején:
- **Komment-kulcsszavas DM-automatizáció** (pl. ManyChat): "Írd kommentbe, hogy KULCSSZÓ" → automatikus DM egy ingyenes anyaggal és a weboldaladdal.
  Ez egyben az algoritmusnak is jó jel (kommentek)
- A bio link a weboldaladra vagy egy egyszerű "Foglalj 15 perces hívást" oldalra mutasson

## 9. Bővítési sorrend (javaslat)

1. ✅ Váz (kész)
2. Brand kitöltése (`brand/brand.md` [TODO] részek) + vizuális stílus a design skillekkel
3. ElevenLabs fiók + hangklón → `.env`
4. Az első induló sablon megépítése (`video-templates/README.md`), és az első 3 videó kézi felügyelettel (`/ideas 3` → `/review` → `/produce`)
5. A szerep-skillek bekötése, ahogy küldöd őket
6. Engedélyek + éjszakai ütemezés
7. 2–3 hét adat után: `/learn`, finomhangolás, további sablonok
