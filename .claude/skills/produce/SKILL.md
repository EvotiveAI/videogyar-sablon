---
name: produce
description: Legyártja az összes approved állapotú videót egészen a ready_to_post állapotig (hang/vágás → leirat → motion → felirat → render → csomagolás). Emberi beavatkozás nélkül fut, éjszakára is alkalmas.
---

# /produce

Keresd meg az összes `status: approved` videót (`node scripts/status.mjs`), és állítsd őket `status: in_production` állapotba.

## Párhuzamos hullámok (videón belül)
Ami nem függ egymástól, az **egyszerre** fusson: több subagent-hívás egy üzenetben. Csak a valódi függőség vár.

**1. hullám (a jóváhagyás után azonnal, párhuzamosan):**
- **Ha a kategóriának saját sablonja van** (pl. arcos videó): azt használd (`cp -R video-templates/<sablon> content/<id>/composition`, majd a sablon README-jének lépései). Kész sablonnál egy motion-agent is elég.
- **faceless:** narrator (hang). **arcos:** transcriber → editor
- **screen-recorder:** a szkriptben jelölt felvételek (`felvétel: github:…`, weboldalak). Csak a szkripttől függ
- **TTS:** a narrator-subagent nem látja az ElevenLabs connectort: a `creative_generate_speech` hívást a fő munkamenet végzi (`audio/tts-text.txt` szövegéből), a letöltött take-ekből az `audio/build-vo.sh` fűz `voiceover.wav`-ot
- **Első lépés, a motion indítása előtt (a fő munkamenet, ~10 mp):** az induló sablon bemásolása: `cp -R video-templates/<induló-sablon> content/<id>/composition`, és a sablon előkészítő scriptje (ha van). Egy jó induló sablonban kész: üres jelenet-helyek, hang, alapzene, felirat-hely, időzítés-váz (ANCHORS), közös segédfájl, és egy SHARED.md a két agent fájl-tulajdonáról. Hogyan építs ilyet: `video-templates/README.md`
- **motion-designer ×2, párhuzamosan (A: 1. fele, B: 2. fele):** mindkettő az induló sablonból dolgozik, és az első perctől a saját jelenetein. Minden jelenet külön sub-composition (`composition/compositions/scNN.html`); az `index.html`, az ANCHORS (`timing/anchors.hu.json` → `build-timing --synthetic`, amíg nincs leirat) és a közös segédfájlok az A agenté, B csak a saját jelenetfájljait írja (`set-lang --only`). A briefben add meg: a jelenetek kiosztását (alap: sc01–sc04 A, sc05–sc07 B; más jelenetszámnál a slotokat A igazítja) és a sablon README útvonalát
- **motion-designer, "váz" mód:** jelenetek, díszletek, figurák mozgása, fejezetcím-csíkok, UI-kártyák, a szkript becsült időzítésével. Az időket egy `ANCHORS` táblában tartsa, hogy a 2. hullámban csak ezt kelljen átírni
- **packager, "vázlat" mód:** poszt szöveg, hashtagek (csak a szkripttől függ). A QA és a `ready_to_post` később jön

**2. hullám (amikor kész a hang):**
- transcriber (`transcript.json`)

**3. hullám (amikor kész a leirat, párhuzamosan):**
- **motion-designer, "időzítés" mód:** `node scripts/init.mjs` (átmásolja a hangot és a leiratot) → `build-timing` a valódi transcripttel → `build-bed` → `set-lang hu`; a jelenetekben semmit nem kell átírni. A felvételek beillesztése
- **captioner:** a feliratokat **külön fájlba** írja (`composition/compositions/captions.html`, sub-compositionként mountolva), hogy ne szerkessze egyszerre ugyanazt a fájlt a motion-designerrel

**4. hullám:**
- `npx hyperframes check` → javítás → Studio (`preview --background`). Render csak kérésre
- packager QA → `ready_to_post`
- **Utolsó lépés: átadás a HyperFrames Studio appnak, érthető névvel:** az app a projekt **valódi mappájának nevét** adja névként (a linket és a `package.json` nevet nem veszi figyelembe). Ezért: `cd content/<id> && mv composition <id> && ln -s <id> composition && cd - && npx hyperframes open content/<id>/<id>`. A `composition` link marad, minden más eszköz (check, render, agentek) azon keresztül ugyanúgy működik. Ha a futó Studio-előnézet még megy, előtte állítsd le (8 GB RAM)

**Videók között:** a render erőforrás-igényes, ezért videónként egymás után. A többi hullám több videón is futhat egyszerre.

Minden lépés előtt állítsd a `stage` mezőt. Ha egy lépés elhasal: egyszer próbáld újra, utána `failed` + ok a `notes` mezőben, és mehet a következő videó.

A végén írj összefoglalót a `content/_last-run.md` fájlba (dátum, kész, elhasalt + ok, futásidő videónként). Ezt a felhasználó reggel elolvassa.
