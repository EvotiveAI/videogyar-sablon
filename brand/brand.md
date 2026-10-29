# Brand

> Élő dokumentum. Minden agent ezt olvassa először. A `[TODO]` részeket a gyártás előtt töltsd ki: minél pontosabb, annál jobb az első szöveg.

## Ki vagy
- Név / handle: [TODO]
- Mit adsz el: [TODO] (termék / szolgáltatás egy mondatban)
- Weboldal: [TODO] · Instagram: [TODO] · TikTok: [TODO] · YouTube: [TODO]
- Csomagok / árak (csak a hivatalos árlapról; ami nincs benne, azt soha nem mutatjuk): [TODO]
- **Amit nem tanítunk ingyen** (mert ezt adod el): [TODO]
- Miért hallgassanak rád (bizonyíték, számok, referenciák): [TODO]

## Bizonyítékok (csak innen jöhet szám a posztokba)
- [TODO] (pl. „X ügyfél”, „Y% konverzió”, forrással és dátummal)

## Cél
- Követőszám-cél és határidő: [TODO]
- Követő → bizalom → érdeklődő (DM / weboldal) → ügyfél
- Bevételi cél a tartalomból: [TODO]

## Célközönség
- Kik ők (kor, szerep, iparág): [TODO]
- Fájdalmaik (a saját szavaikkal, ügyfélmondatokból): [TODO]
- Amit NEM akarnak: [TODO] (pl. szakzsargon, hype, üres ígéret)

## Hangnem
- Nyelv: magyar, tegező, közvetlen (vagy: [TODO])
- „Megmutatom, nem magyarázom”: konkrét példák, képernyő, eredmény
- Szakszó csak akkor, ha egy mondatban el is magyarázod
- Kerülendő: „forradalmi”, „ez mindent megváltoztat”, clickbait, amit a videó nem vált be
- Aláírás / visszatérő mondat (ha van; soha nem a videó első mondata, az első szótól a hook szól): [TODO]

## Pozicionálás
- A fő üzenet egy mondatban: [TODO]
- Social szöveg = történet, nem tétellista: szereplő, konfliktus, fordulat, bizonyíték, meghívás.
- A fizetett hirdetések és az organikus tartalom ugyanazt az üzenetet viszi.

## Videótípusok (hossz)
- **ELÉRÉS ~25–30 mp:** hír, provokatív állítás, egy gondolat. Több nézést hoz.
- **TUTORIAL ~40–50 mp:** lista, lépések, kommentkulcsszavas CTA. Több kommentet hoz.
- Egy mintán (293 nagyot ment rövid videó) a medián ~28 mp volt; a saját számaid felülírják.

## Arany minta
- A legjobb saját videód szövege (a szövegíró ehhez méri a hangnemet, ritmust, szerkezetet): [TODO: `content/<id>/script.md`]

## CTA-k (videó végén / poszt szövegben)
- **Mindig:** „Kommenteld, hogy [KULCSSZÓ], és elküldöm [a konkrét anyagot].” Egy szó, témához kötött.
- TikTok: „Írj DM-ben annyit, hogy [KULCSSZÓ].”
- **Soha nem ígérünk** kurzust, ingyenes képzést vagy olyat, ami nincs. Csak azt, amit ténylegesen elküldünk (`/ebook-pdf`).
- A beígért anyag DM-ben megy: eleinte kézzel, később komment-kulcsszavas DM-automatizációval.
- Bio link: [TODO]

## Hang (TTS)
- Szolgáltató: ElevenLabs (connectoron át)
- Modell: [TODO] (a legjobb elérhető; ami torzítja a hangod, azt írd ide tiltottként)
- Hangklón neve / ID: `<HANG_NEVE>` / `<HANG_ID>`
- Hook-hangulatjelző: `[warmly]` (vagy: [TODO]) · tempó-szorzó: [TODO, pl. 1.0–1.2]

## Weboldal-design (a PDF-útmutatókhoz)
- Színek, betűk, gombok, logó: [TODO] (a `/ebook-pdf` ehhez igazodik)

## Gyártási beállítások
```yaml
language: hu
default_format: faceless        # faceless | face
platforms: [instagram, tiktok, youtube_shorts]
target_length_sec: [25, 50]
hook_variants: 2                # A + B
daily_target: 4                 # ennyi koncepciót ír a /nightly naponta
auto_approve: false             # true = a koncepció-kapu kikapcsolva (csak ha már megbízol a rendszerben)
voice: elevenlabs               # elevenlabs | heygen | own_clone
```
