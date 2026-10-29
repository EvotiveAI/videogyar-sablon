# Kiejtési szótár (TTS)

A magyar TTS hangok az angol szakszavakat gyakran magyarosan ejtik ("kla-ude").
A narrator a TTS-nek küldött szövegben ezeket cseréli, de **a feliratban az eredeti írásmód marad**.

**⚠️ Perjeles IPA TILOS a TTS-szövegben (2026-10-14):** az `eleven_v4` a `/` jelet néha kimondja („per”): „másold be a linket a per claude-nak per”. A TTS-szövegbe mindig a **„TTS-nek küldött alak”** oszlop magyaros írása kerül (Klód, Klódnak, szkill, É-dzs-ent), perjel és IPA nélkül. Az IPA oszlop csak tájékoztató.

| Írás | TTS-nek küldött alak | IPA (eleven_v4) |
|---|---|---|
| Claude | Klód | /kloːd/ (Claude-nak → /kloːdnɒk/) |
| agent / Agent | É-dzs-ent | írd így a TTS-szövegbe: „É-dzs-ent” (az „éjdzsent”, „éddzsent”, „Édzsent” egy hangklónnal rosszul szólt). |
| Claude Code | Klód Kód | |
| DocuSign | Dokuszájn | a felhasználó, 2026-10-15 (a „Dókjuszájn” rossz) |
| upsell | Ápszell | a felhasználó, 2026-10-15 (az „apszell” rossz) |
| prompt | prompt | általában jó |
| skill | szkill | /skil/ (skill-lel → /skilːɛl/, skillje → /skiljɛ/) |
| AI | éj-áj | vagy "MI", ha a brand úgy dönt |
| ChatGPT | Csetdzsípítí | |
| workflow | vörkfló | |
| designer | dizájner | /dizaːjnɛr/ |
| Kowalski | Kovalszki | /koˈvɑlski/ |
| Sonner | Szonner | /ˈsonːɛr/ |
| UI/UX | jú-áj jú-iksz | /juː aɪ juː ɛks/ |
| Claude-ot | Klódot | /kloːdot/ |
| skillt / skilleket | szkillt / szkilleket | /skilt/, /skilːɛkɛt/ |
| Anthropic | Entropik | /ɛntropik/ (nem tesztelt) |
| design / Design | dizájn | /dizaːjn/ (nem tesztelt) |
| Apple | Eppel | /ɛpːɛl/ (nem tesztelt) |
| Pro Max | pró max | /proː mɒks/ (nem tesztelt) |
| brag | breg | /brɛg/ (nem tesztelt) |
| launch | lóncs | /loːnt͡ʃ/ (nem tesztelt) |
| webdesigner(ednek) | vebdizájner | /vɛbdizaːjnɛrɛdnɛk/ (2026-10-12, whisper szerint jó) |
| Impeccable Design | Impekkebl Dizájn | /ɪmˈpɛkəbl dizaːjn/ (2026-10-12, whisper szerint jó) |
| Taste | Tészt | /teɪst/ (skillt → /teɪst/ /skilt/, whisper szerint jó) |
| landing | lending | szövegesen "lending" (whisper szerint jó) |
| Windows | Vindóz | szövegesen "Vindóz" (whisper szerint jó) |
| Arena / ARENA | aréna | szövegesen "aréna" (2026-10-13, még nem hallgatott) |
| 2005-ös | kétezer-ötös | a TTS-szövegben betűvel |
| ultrathink | ultratink | szövegesen "ultratink" (felhasználó, 2026-10-14; az "altraszink" rossz) |
| /memory | memori | szövegesen "memori" (2026-10-13, jóváhagyott videóban) |
| /plan | plen | szövegesen "plen" (2026-10-13, jóváhagyott videóban) |

Új problémás szó esetén a narrator ide veszi fel.

Új bejegyzések (2026-10-14, airllm-4gb, még nem hallgatott):

| Írás | TTS-nek küldött alak | IPA (eleven_v4) |
|---|---|---|
| AirLLM | Ér el-el-em | /ɛːr ɛl ɛl ɛm/ |
| Kimi K3-at | Kimi ká-hármat | /kimi kaː haːrmɒt/ |
| Linuxon | Linukszon | /linukson/ |
| Macen | Meken | /mɛkɛn/ |
| Claude-nál | Klódnál | /kloːdnaːl/ |
| AIR (CTA) | ér | /ɛːr/ (a képernyőn az "AIR" felirat legyen látható) |

Új bejegyzések (2026-10-15, 4-claude-code-plugin, a felhasználó megadta, még nem hallgatott):

| Írás | TTS-nek küldött alak |
|---|---|
| Setup | Szetáp |
| Team | tím | 2026-10-15, 4. rész (sorozat), még nem hallgatott |
| Security | Szekúriti |
| Guidance | Gájdensz |
| Anthropic | Antropik (felülírja az „Entropik”-ot) |
| Agent Skills | É-dzs-ent Szkill |
| Frontend Design | Frontend Dizájn |
| vibe-kódolni | vájb-kódolni |
| senior | szeniór (a felhasználó, 2026-10-15) |

Új bejegyzések (2026-10-15, claude-capcut-vago, nyers whisper szerint jó):

| Írás | TTS-nek küldött alak | Megjegyzés |
|---|---|---|
| HyperFrames Studio / Studióban | Hájperfrémsz Sztúdió / Sztúdióban | whisper: „Hyperframe Studio(-ban)”, jó |
| szkriptet | szkriptet | whisper: „skriptet”, jó |
| felmelegszik | felmelegszik | a TTS természetesen „felmelekszik”-nek ejti (g+sz), elfogadható, nem hiba |
| Kommenteld | Kommenteld | a TTS „kommentelt”-nek ejti (d+h assziláció), elfogadható |
| „Pedig nem vagyok vágó.” | — | a törzs-take-ben „Te/Tehát még nem…”-nek hallatszott → külön mondat-take (`raw/pedig-t1.mp3`) kellett; hosszabb szövegben a rövid, nyitó mondatokat érdemes külön generálni |
