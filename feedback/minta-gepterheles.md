---
date: MINTA
video: általános
agents: [koordinátor, transcriber, idea-scout, viral-kereso]
type: szabaly
---
# Tömeges whisper-leiratozás tilos (8 GB RAM)

**Amit mondott (szó szerint):**
> Konkrétan meghalt a gépem. Elég lesz a cím, mert abból már tudjuk, miről szól nagy valószínűséggel a videó.

**Értelmezés:** egy 90 ötletes naptárhoz a rendszer 140 virális videót akart leiratozni: 2 párhuzamos whisper + 4 letöltés / böngésző egyszerre. A 8 GB-os gép lefagyott és kikapcsolt.

**Bevezetett szabály(ok):**
- CLAUDE.md: nehéz helyi folyamat a `tools/egyszerre.sh` záron át (egyszerre legfeljebb 3), hardveres kódolás, háttér-prioritás.
- transcriber: egyszerre egy whisper, csak a saját hangunkra.
- idea-scout, /viral-kereso: virális videót a címből értékelünk, tömegesen nem leiratozunk.
