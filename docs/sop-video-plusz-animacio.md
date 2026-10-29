# SOP · „videó + animáció” stílus (a saját arcod + 2D animáció)

Két stílus van: **ANIMÁCIÓS** (arc nélküli, klónozott TTS-hang + animáció) és **VIDEÓ + ANIMÁCIÓS** (a saját arcod és hangod, elrendezés-váltással). Ez a SOP az utóbbi. A kategória (HIR / VIRAL / SOROZAT / UGYFELSIKER) és a szint ettől független. Videó + animációsnál nincs TTS-kredit.

| Stílus | Hang | Kép | Mikor |
|---|---|---|---|
| **ANIMÁCIÓS** | klónozott TTS | csak animáció | hír, virális-másolás, sorozat |
| **VIDEÓ + ANIMÁCIÓS** | a saját hangod (pl. iPhone, Fotók → Hangkeverés „Stúdió”) | 3 elrendezés: **osztott** (fent ~40% animáció, lent ~60% arc), **teljes animáció** (a hang megy tovább), **teljes arc** (hook / CTA) | személyes tartalom, ügyfélsiker |

## A recept (sorrend)
1. **Szöveg + storyboard** (kapu #1). A felvétel előtt rövid útmutató: álló, 4K, mellkastól felfelé, fej fölött hely, ~1 m, egy menetben; a **hosszú csend (≥3 mp) = az animáció helye**. Improvizálhatsz, ezért a vágás után a **mondott szöveg az igazság**.
2. **Vágás (automata, ~3 perc):** `tools/egyszerre.sh python3 tools/videoanim/vagas.py <nyers.mov> <mappa> --slot 3.5`, a hang feldolgozása nélkül. Utána szöveg-alapú finomvágás: `tools/videoanim/szovegvagas.py`.
3. **Idővonal:** arc-blokkok + betétek (képernyőfelvétel, ügyfélklip) egymás után; az arc-blokkok külön videó-elemek, így a hang sosem szakad. Az idők a leiratból.
4. **Kompozíció** a saját arcos sablonodból (`video-templates/<arcos-sablon>/`), két motion-agenttel párhuzamosan.
5. Check → 8–10 tesztkocka (`npx hyperframes snapshot`) → packager QA → `ready_to_post`.

## Ami elakadás volt, és a megoldása (egy működő gyárból; ide írd a sajátjaidat is)
| Gond | Megoldás |
|---|---|
| A telefonos hang halk (~ −31 LUFS), és egy „feljavító” lánc (kompresszor + limiter) vízhangos lett | ha a felvétel jó, **nem nyúlunk hozzá**: nincs erősítés, limiter, EQ, zajszűrés; csak darabolás, a LUFS-t csak mérjük |
| Levegővétel / 1 mp-es szünetek maradnak a vágásban | szoros vágás: mondatonként az utolsó jó take, a vágás a hangerő-burkoló völgyébe; szóvesztés-ellenőrzés whisperrel |
| A felirat a szemen ült az osztott jelenetnél | felirat-sáv a nyak / póló magasságában (y≈1740), CTA-nál feljebb |
| A mondott szöveg eltért a jóváhagyottól (improvizálás) | vágás után a leirat a forrás; a poszt szövegét is abból írd; a változást mondd el |
| Utólagos sorrendcsere | az arc több fájlban van, így csak az időzítés változik |
| **Kitalált ár egy kártyán** | ár csak a hivatalos árlapról, vagy „??? Ft” |
| Emoji a képernyőn → check-hiba | SVG ikon (a renderelőnek nincs emoji-betűje) |
| Két agent közös scratchpadja (felülírták egymás fájlját) | mindenki a saját almappájába |
| Effekt-hang sáv-ütközés a két agent között | előre kiosztott sávok a SHARED.md-ben |
| Egy betét-klip közepén váratlan vágás-mozaik | a klipet teljes hosszában nézd át |
| `timeout` nincs macOS-en | ne használd; hosszú folyamat háttérbe |
| **Személyes adat** (ügyfél arca / hangja egy meeting-felvételen) | csak a felhasználó kifejezett kérésére + az ügyfél írásos engedélyével; megkerülni tilos |
| Az újrafelvett mondatok a blokkokon belül maradnak (csak hosszú csendnél vág) | whisper blokkonként, egy ffmpeg-futás a nyersből (nincs kétszeres kódolás) |
| A whisper egy hosszú hezitálást egy szóba von | 50 ms-os hangerő-burkoló a szegmenshatárokhoz; a rough cutot végighallgatni |
| A vágottban oldalra nézés, dupla szó, 0,3 mp-es csonk, rossz szóvég | minden vágási pontról ellenőrző kép, a szakaszvég a burkoló völgyéből |
| macOS-es ffmpeg nem ismeri a `filter_complex_script`-et | a szűrőláncot egy sorba téve `-filter_complex "$FC"` |
| A 4K iPhone .mov-nak 2 hangsávja van | `0:a:0` az aac (Stúdió-hang) |
| A régi sablon-másolatot az ellenőrzés is ellenőrzi (hiányzó fájl → hiba) | a referencia-másolatot a `compositions/`-on kívül tartsd |
| A render hangereje túl halk lett | utólagos limiter csak automatikus felerősítés nélkül |
| AirDrop a Letöltésekbe teszi a felvételt, nem az `inbox/raw/`-ba | `find ~/Downloads -mmin -90 -name '*.mov'`, és másold a helyére |
| **Sablon-hibát csak a videó mappájában javítottuk** (a kilógó fej a homloknál vágódott, aznap kétszer) | a javítás a sablonba is bekerül, ugyanabban a körben, + gépi ellenőrzés (pl. a fej tetejének mérése) |
