---
name: review
description: Emberi jóváhagyási kör. Végigmegy a concept_ready koncepciókon (jóváhagy / elutasít / módosít) és a ready_to_post videókon (megnézésre, posztolásra). Ez az a két pont, ahol a felhasználó kell.
---

# /review

## 1. Koncepciók (`concept_ready`)
Minden koncepcióhoz mutasd meg tömören: **cím · koncepció mondata · A/B hook · hossz · formátum (faceless/arcos)**.
Ha a felhasználó a szkriptet is kéri, a `script.md` "Szkript (jelenet → szöveg)" szekcióját mutasd meg: jelenet, alatta a szöveg, aztán a következő jelenet.
**Szint:** ha van `szint-javaslat.md`, mutasd meg a 2–3 változatot (szintenként egy sor, idővel) és a javaslatot; a felhasználó a szkripttel együtt itt választ szintet. A teljes storyboard a választás után, csak azon a szinten készül.
Kérdezd meg egyszerre (AskUserQuestion, max. 4 koncepció kérdésenként):
- ✅ Jóváhagy → `status: approved`, `approved: <dátum>`. Arcos formátumnál `awaiting_footage`, és mondd meg, mit kell felvenni (teleprompter: `script.md`)
- ✏️ Módosít → a felhasználó megjegyzése a `notes` mezőbe, a **scriptwriter** átírja (vizuális kérésnél a **creative-director** a storyboardot), majd újra ide kerül
- 🔁 Formátumcsere (faceless ↔ arcos)
- ❌ Elutasít → `status: rejected` + ok a `notes` mezőben (az idea-scout ebből tanul)

## 2. Kész videók (`ready_to_post`)
Listázd: cím · `final/final.mp4` útvonal · `post.md` útvonal. A videókat küldd át fájlként (SendUserFile), hogy a felhasználó telefonról is megnézhesse.
Ha a felhasználó azt mondja, hogy posztolta: `status: posted`, `posted: <dátum>`, linkek a `links` mezőbe, ha megadja.
Ha javítást kér: a megfelelő agent javítja (pl. felirat → captioner), majd újra render.

## 3. Metrikák (opcionális)
Ha van 3+ napos `posted` videó `metrics.md` nélkül, kérd el a számokat (nézés, átlagos nézési idő, mentés, megosztás, követés), és írd be.

- A koncepciót **a chatben táblázatban** mutasd be: `# | Idő | Háttér | Képernyőn | Felolvasva (szó szerint) | Animáció`, minden javítási kör után újra ugyanígy. A részletes kártyák a `storyboard.md`-ben maradnak
- Jóváhagyáskor a storyboard összesítő sorát (♻️ könyvtárból / 🆕 új építés) mindig mutasd meg elsőként, és a 🆕 jelenetekre kérdezz rá: mehet új építéssel, vagy a ♻️ olcsóbb alternatívával _(felhasználó, 2026-10-12: jelenet-könyvtár jelölése a jóváhagyáskor)_
