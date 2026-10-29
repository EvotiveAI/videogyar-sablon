---
name: nightly
description: Éjszakai műszak, ütemezett futtatásra. Legyártja a jóváhagyott videókat, megírja a holnapi koncepciókat, és reggeli összefoglalót hagy. Soha nem kérdez, és nem lép át emberi kaput.
---

# /nightly

**Felügyelet nélkül fut: ne kérdezz semmit, ne várj válaszra.** Ha döntés kellene, azt jelöld meg, és lépj tovább.

1. `/ingest`: csak az automatikusan párosítható felvételek (fájlnév = id). A többi marad reggelre
2. `/produce`
3. `/ideas`: annyi új koncepció, hogy a `concept_ready` + `approved` összesen elérje a `daily_target × 2` értéket (ne halmozódjon a backlog)
4. Ha vasárnap van: `/learn`
5. Írd meg a `content/_morning.md` fájlt:
   - ✅ Kész posztolásra: lista
   - 📝 Jóváhagyásra vár: lista a koncepció mondatával
   - 🎥 Felvételre vár (arcos): lista
   - ⚠️ Elhasalt: lista + ok
   - 💡 Egy mondat: mit tanultunk / mi a holnapi fókusz

Az emberi kapukat (`concept_ready → approved`, `ready_to_post → posted`) **nem lépi át**, kivéve ha `brand.md` → `auto_approve: true`.
