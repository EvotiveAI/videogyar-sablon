---
name: ingest
description: Az inbox/raw/ mappába dobott saját felvételeket hozzárendeli a megfelelő awaiting_footage videóhoz (vagy nyers ötletből új videót indít), majd approved állapotba teszi gyártásra.
---

# /ingest

1. Listázd az `inbox/raw/` tartalmát és az `awaiting_footage` videókat.
2. Párosítás:
   - Ha a fájlnév tartalmazza az id-t vagy a slugot → automatikus
   - Különben gyors leirat az első 20 mp-ről (transcriber), és a szkriptek hookjaihoz hasonlítva javasolj párosítást, majd kérdezd meg a felhasználót
   - Ha egyik szkripthez sem illik, akkor **spontán videó**: új mappa `format: face`, és a transcriber teljes leiratából a scriptwriter visszafelé megírja a `script.md`-t (koncepció, hook, jelenetek). Ezután `concept_ready`, mert ez is jóváhagyási pont
3. A fájlt mozgasd a `content/<id>/raw/`-ba, és állítsd: `status: approved`.
4. Kérdezd meg, hogy induljon-e azonnal `/produce`, vagy maradjon éjszakára.
