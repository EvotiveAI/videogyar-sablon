---
name: ideas
description: Új videókoncepciók gyártása jóváhagyásra. Ötlet → kutatás → szkript, a végén concept_ready állapot. Argumentum: darabszám (alapértelmezés a brand.md daily_target értéke).
---

# /ideas [db]

1. Olvasd be a `brand/brand.md`-t (`daily_target`), a `content-pillars.md`-t és a `learnings.md`-t.
2. **idea-scout** subagent: hozzon létre `db` darab új ötletet (`status: idea`). **Elsőként az `otletek/` ötletdoboz feldolgozatlan ötleteit** vegye sorra, és csak a maradék helyre hozzon sajátot.
3. Minden új ötletre **párhuzamosan** (külön subagent-hívások egy üzenetben):
   **researcher** → **scriptwriter** → **creative-director** (storyboard.md) ugyanarra az id-ra. Ha a researcher `rejected` állapotba tette, ott vége.
4. Ha egy videó elhasal, legyen `failed` + ok, a többi menjen tovább.
5. Zárásként futtasd: `node scripts/status.mjs`. Rövid összefoglaló: hány koncepció vár jóváhagyásra, egy-egy sorban a koncepció mondata.
