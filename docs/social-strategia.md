# Social stratégia (sablon)

> **A stratégia a tiéd.** Az AI dolga nem az, hogy átírja (pl. napi 3-ból napi 1), hanem hogy megmondja, mi hiányzik hozzá, és megoldást adjon a szűk keresztmetszetre.

## Cél
- Követőszám-cél és határidő: [TODO]
- Mérföldkövek (tervszám, nem ígéret), mindegyikhez egy „kar”, amit elmaradáskor meghúzol (pl. hook-átírás → fizetett rásegítés → közös posztok): [TODO]

## Platformok és szerepük
| Platform | Mi megy ide | Megjegyzés |
|---|---|---|
| Instagram (Reels, karuszel, story) | [pl. arcos, személyes tartalom] | |
| Facebook | [pl. a Reels másolata] | |
| TikTok | [pl. + arc nélküli sorozat, virális-másolatok] | CTA: DM-kulcsszó |
| YouTube Shorts | [pl. ugyanaz, mint TikTok] | |

## Napi ütem
| Idő | Szerep | Formátum |
|---|---|---|
| [reggel] | **tanít** | [pl. karuszel az előző esti videóból] |
| [dél] | **bizonyít** | [pl. ügyfélsiker, eredmény, nagy szám] |
| [este] | **megállít** | [pl. arcos sorozatrész] |
| naponta | story | [3–5] |

Az időpontokat teszteld: a célközönség görgetési idejéhez igazodj, és a mért elérés alapján dönts.

## Heti rendszer
- **Szombat:** `/heti-terv` (a jövő hét 21 helye + felvételi lista + hiánylista), utána felvétel csoportosan, teleprompterről
- **Szombat–vasárnap:** gyártás párhuzamos videó-munkamenetekben
- **Vasárnap este:** átnézés (kapu #2) és ütemezés (pl. Metricool-connector)
- **Hétfő:** ~20 perc mérés (`docs/meresi-keretrendszer.md`)

## Tölcsér
Videó → „Kommenteld, hogy KULCSSZÓ” (TikTokon DM) → automatikus DM a gyakorlati útmutatóval (`/ebook-pdf`, UTM-linkkel) → regisztráció / érdeklődő → ügyfél.
- A DM-automatizálás eszköze: [TODO, pl. ManyChat]
- Hová visz a link: [TODO, pl. tudástár / landing oldal]

## Hiánylista (tipikus szűk keresztmetszetek és megoldásuk)
| Hiány | Megoldás | Ki | Meddig |
|---|---|---|---|
| Render (gyenge gép) | felhős render: `npx hyperframes cloud render` | | |
| Borító | borító-sablon (`tools/social/borito.mjs`) | | |
| DM-útmutatók minden kulcsszóhoz | `/ebook-pdf` | | |
| Komment → DM automatizálás | DM-eszköz bekötése | | |
| Ütemező | Metricool (vagy más) connector | | |
| Ügyfél-engedélyek | írásos engedély arcra, hangra, névre | | |
