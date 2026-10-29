# Tartalomgyár 🎬

Félautomata short-form videógyár (Instagram Reels, TikTok, YouTube Shorts, Facebook Reels) Claude Code-dal.
Az AI ötletel, kutat, szöveget ír, hangot generál, vág, animál, feliratoz és csomagol.
**Te két ponton kellesz:** jóváhagyod a szöveget, és a végén ellenőrzöd a kész videót.

> Hogyan működik, mi automata, hol kellesz te: [docs/HOGYAN-MUKODIK.md](docs/HOGYAN-MUKODIK.md) · A szabályok: [CLAUDE.md](CLAUDE.md)

## Első lépések

### 1. Amit külön telepítened kell (nem részei a repónak)
| Mi | Mire kell | Hogyan |
|---|---|---|
| **Claude Code** (CLI vagy asztali app) | a gyár motorja | claude.com/claude-code |
| **HyperFrames skillek** (`hyperframes`, `hyperframes-core`, `-animation`, `-registry`, `-creative`, `-cli`, `media-use`, `faceless-explainer`) | animáció, render | a HyperFrames telepítési útmutatója szerint (Claude Code skillek) |
| **humanizer skill** | emberi hangzású szöveg (szövegíró, csomagoló) | `~/.claude/skills/humanizer/` (nyílt forrású, Wikipedia „Signs of AI writing” alapú) |
| **Node.js 20+** | eszközök, dashboard, HyperFrames | nodejs.org |
| **ffmpeg** | vágás, kódolás, hang | `brew install ffmpeg` |
| **Google Chrome** | képernyőfelvétel, PDF, virális kereső | a gépen lévő Chrome-ot használja |
| **whisper.cpp** (`whisper-cli`) + **large-v3 modell** | helyi, ingyenes leirat | `brew install whisper-cpp`, a modell: `ggml-large-v3-q5_0.bin` → `tools/whisper/models/` (Hugging Face: ggerganov/whisper.cpp) |
| **yt-dlp** | virális kereső (YouTube) | `brew install yt-dlp` |
| Recorder függőség | képernyőfelvétel | `cd tools/recorder && npm install` |

### 2. Fiókok és connectorok (a sajátjaid)
- **ElevenLabs**: saját fiók + **saját hangklón** (gyors klón 1–2 perc hanganyagból, minőségi ~30+ percből). Kösd be a Claude-ba connectorként (MCP). A hang nevét és ID-ját írd a `brand/brand.md` → Hang részbe és a `.claude/agents/narrator.md`-be (`<HANG_NEVE>`, `<HANG_ID>`).
- **Metricool** (vagy más ütemező): connectorként bekötve ütemez, és innen jönnek a mérési számok.
- **DM-automatizálás** (pl. ManyChat): a komment-kulcsszóra automatikus DM a gyakorlati útmutatóval.
- Opcionális: `.env` a `.env.example` alapján (csak a saját gépeden, soha ne commitold).

### 3. Töltsd ki a márkát
- `brand/brand.md` (ki vagy, mit adsz el, célközönség, hangnem, CTA, bizonyítékok, hang) · `brand/visual-style.md` (színek, betűk) · `brand/content-pillars.md` (témaarányok) · `docs/social-strategia.md` (napi ütem, platformok)
- Minden `[TODO]` helyet: minél pontosabb, annál jobb az első szöveg.

### 4. Az első 3 videó, kézi felügyelettel
```
/ideas 3     → ötlet, kutatás, szöveg, szint-javaslat
/review      → jóváhagyod a szöveget és a szintet (kapu #1)
/produce     → hang, leirat, animáció, felirat, csomagolás
```
Mérd az időt lépésenként (`docs/mert-idok.md`). A legjobban sikerült videóból építsd meg az első induló sablont: [video-templates/README.md](video-templates/README.md).

### 5. Utána
- Mondd ki, hogy „feedback”, amikor valami nem tetszik: szabály lesz belőle (`/feedback`).
- Koordinátor-munkamenet + videónként külön munkamenet, akár 10 egymás mellett.
- Éjszakai műszak: `/nightly` ütemezve (a gép legyen ébren, töltőn, a gyártási parancsok előre engedélyezve).
- Szombaton `/heti-terv`, vasárnap jóváhagyás és ütemezés.
- 2–3 hét adat után `/learn`.

## Felépítés

```
CLAUDE.md                 a koordinátor szabályai: pipeline, státuszok, kapuk, szintek, gépterhelés
brand/                    ki vagy, kinek szólsz, hogyan beszélsz, mi működik (kitöltendő)
  hook-mintak.md          hook-pszichológia (4 lépcső) + fájdalom-mondat
  kiejtes.md              TTS kiejtési szótár (angol szakszavak magyarosan)
  sorozatok/              sorozat-bibliák (_SABLON.md)
.claude/agents/           a stáb: 12 subagent, mindegyikben Induló + Tanult szabályok
  lessons/                agentenként saját hibanapló (Hiba → Ok → Megelőzés)
.claude/skills/           parancsok: /ideas /review /produce /ingest /nightly /learn /feedback /heti-terv /viral-kereso /ebook-pdf
content/_TEMPLATE/        egy videó mappájának sablonja (meta.yaml = az állapot)
content/_social/          posztolási naptár (naptar.json)
docs/                     működés, mérés, mért idők, social-stratégia, SOP
feedback/                 a visszajelzéseid naplója (3 minta-bejegyzéssel)
otletek/                  ötletdoboz (INBOX.md)
inbox/                    nyers felvételek (raw/), virális keresések (viral/)
video-templates/          a te sablonjaid és jelenet-könyvtárad (útmutató: README)
tools/                    egyszerre.sh (gépi zár), heat.sh, audit-dinamika, whisper, recorder,
                          viral, videoanim (automata vágás), social (naptár, borító, karuszel,
                          minőségőr), dashboard (helyi vezérlőpult)
scripts/status.mjs        melyik videó hol tart
```

## A 12 agent
| Agent | Mit csinál |
|---|---|
| idea-scout | témát talál (elsőként az ötletdobozból) |
| researcher | tényt + forrást gyűjt; virálisnál azt, miért működik |
| scriptwriter | A + B hook, szöveg, CTA, teleprompter |
| creative-director | szint-javaslat, jelenetkártyák (storyboard) |
| narrator | a klónhangod szövege + összefűzés |
| screen-recorder | valódi weboldal-felvétel |
| transcriber | szóra pontos, helyi leirat |
| editor | arcos vágás (csend, baki, oldalra nézés ki) |
| motion-designer | animáció (két agent párhuzamosan) |
| captioner | animált felirat |
| packager | poszt-szöveg, borító, végső QA |
| analyst | számokból tanulság |

## Gép
8 GB RAM-on is megy, de a nehéz munka (whisper, render, böngésző, kódolás) mindig a `tools/egyszerre.sh` záron át fusson: egyszerre legfeljebb 3. Tömeges leiratozás tilos. Ha a gép kevés, a render mehet felhőbe (`npx hyperframes cloud render`).
