# Aktualny schemat miejsca

Opis bieżących kontraktów; źródłem prawdy są wskazane schematy kodu. Czytaj przy zmianach modelu miejsc, walidacji lub publikacji danych.

## Schemat miejsca

Źródłem obowiązującego kontraktu jest [functions/src/contracts/places.mjs](../../functions/src/contracts/places.mjs). `placeSchema` opisuje rekord katalogowy używany przy imporcie i snapshotach kolekcji Firestore `places`; `publicPlaceSchema` opisuje projekcję do frontendu/SSG, bez `published` i `createdAt`. Schematy są ścisłe: wszystkie wymienione pola są wymagane, także tablice puste i pola dopuszczające `null`; dodatkowe pola są odrzucane. Poniższe limity dotyczą kontraktu publicznego/katalogowego, nie prywatnego warsztatu.

### Pola rekordu katalogowego

| Pole | Typ i ograniczenia | Znaczenie |
| --- | --- | --- |
| `id` | Tekst 1–100 znaków: litery ASCII, cyfry, `_`, `-`. | Trwały identyfikator, niezależny od nazwy i adresu URL. |
| `name` | Niepusty tekst, maks. 200 znaków. | Nazwa wyświetlana. |
| `slug` | Maks. 100 znaków; małe litery ASCII i cyfry, człony rozdzielone pojedynczym `-`. | Adres `/miejsca/:slug`. |
| `previousSlugs` | Tablica maks. 30 slugów. | Dawne adresy do przekierowań. Bieżące i dawne slugi nie mogą kolidować w całym katalogu. |
| `description` | Niepusty tekst, maks. 20 000 znaków. | Opis redakcyjny; dowody są we wzmiankach. |
| `tags` | 1–100 obiektów `{ id, name }`; ID jak wyżej, nazwa do 200 znaków, bez powtórzeń ID. | Płaskie tagi miejsca. |
| `period` | `{ status, explanation }`; status: `confirmed`, `probable`, `unverified`; niepuste uzasadnienie do 2000 znaków. | Ocena potwierdzenia miejsca w badanym okresie. |
| `aliases` | Maks. 30 niepustych tekstów po maks. 200 znaków. | Alternatywne nazwy, również do wyszukiwania. |
| `addresses` | Maks. 30 obiektów `{ type, text }`; type: `historical` lub `current`, tekst do 500 znaków. | Adresy historyczne i współczesne. |
| `district` | Niepusty tekst do 200 znaków lub `null`. | Dzielnica, jeśli ustalona. |
| `location` | Wariant znany albo nieustalony, opisany niżej. | Bieżąca lokalizacja miejsca. |
| `mentions` | Maks. 100 wzmianek, bez powtórzeń `id` w obrębie miejsca. | Datowane informacje wraz ze źródłami i materiałami. |
| `locationVersion` | Liczba całkowita od 0 do `Number.MAX_SAFE_INTEGER`. | Wersja do kontroli konfliktów zapisu lokalizacji. |
| `updatedAt` | Znacznik czasu UTC. | Czas aktualizacji. |
| `published` | Boolean; tylko rekord katalogowy. | Czy miejsce jest opublikowane. |
| `createdAt` | Znacznik czasu UTC; tylko rekord katalogowy. | Czas utworzenia. |

Cały rekord po serializacji JSON może mieć maks. 700 000 bajtów UTF-8. Katalog zawiera maks. 1000 rekordów o unikalnych ID; operacyjny limit importu dev jest niższy i opisany w sekcji „Pełny katalog na dev”.

**Lokalizacja:** znana ma postać `{ coordinates: { lat, lng }, precision, explanation }`, gdzie `lat` jest w zakresie −90…90, `lng` −180…180, `precision` to `building` albo `approximate`, a `explanation` jest tekstem do 2000 znaków (może być pusty). Nieustalona lokalizacja ma `{ coordinates: null, precision: "unknown", explanation: null }` lub niepuste wyjaśnienie do 2000 znaków. API edycji przyjmuje wyłącznie znaną lokalizację i wymaga `expectedLocationVersion`; zapis zwiększa wersję i ustawia czas serwera.

**Daty:** znacznik czasu ma postać `YYYY-MM-DDTHH:mm:ssZ` lub `YYYY-MM-DDTHH:mm:ss.sssZ`. Data historyczna to `null` albo `{ from, to, approximate }`: `from` jest datą `YYYY`, `YYYY-MM` lub `YYYY-MM-DD` (lata 1000–2999), `to` jest datą w tych samych formatach lub `null`, a `approximate` jest booleanem. `to: null` oznacza pojedynczą datę z precyzją źródła; zakres musi być chronologicznie poprawny. Udokumentowane daty miejsca wynikają ze zweryfikowanych wzmianek; nie ma osobnego pola zakresu istnienia ani założenia ciągłości między wzmiankami.

### Wzmianki i materiały w publicznym rekordzie

| Pole wzmianki | Typ i znaczenie |
| --- | --- |
| `id` | Identyfikator w tym samym formacie co ID miejsca. |
| `title` | Niepusty tytuł źródła do 500 znaków. |
| `url` | Adres HTTP(S) bez danych logowania, do 2000 znaków, albo `null`. |
| `page` | Niepusty lokalizator w źródle do 2000 znaków albo `null`. |
| `publicationDate` | Data publikacji źródła lub `null`. |
| `documentedDate` | Data opisywanego faktu; wymagana jako niepusta data dla `verified`. |
| `verification` | `verified`, `draft` albo `conflicting`. |
| `accessedAt` | Znacznik czasu UTC; przy eksporcie warsztatu pochodzi z `verifiedAt`. |
| `excerpt` | Niepusty tekst do 10 000 znaków. |
| `excerptType` | `quote`, `transcription` albo `summary`. |
| `note` | Niepusta uwaga do 2000 znaków albo `null`. |
| `materials` | Maks. 10 obrazów; dla `draft` i `conflicting` tablica musi być pusta. |

Każdy element `materials` zawiera wszystkie pola `imageSchema` oraz `materialId` (ID materiału) i niepuste `documentedDate` (datowanie obrazu). Cały okres obrazu musi mieścić się w okresie wzmianki.

| Pole materiału | Typ i ograniczenia |
| --- | --- |
| `storagePath`, `thumbnailPath` | Ścieżki do obrazu i miniatury, do 500 znaków; `public/materials/<id>/<plik>` lub starsze `public/places/<placeId>/<mentionId>/<plik>`. Plik: litery ASCII, cyfry, `_`, `-` i rozszerzenie `webp`, `png` lub `jpg`. Starsza ścieżka musi odpowiadać miejscu i wzmiance. |
| `alt`, `credit` | Niepuste teksty do 500 znaków: opis alternatywny i podpis/atrybucja. |
| `rights` | Niepusty opis praw do 2000 znaków. |
| `sha256`, `thumbnailSha256` | Sumy obrazu i miniatury: 64 małe znaki szesnastkowe. |
| `provenance` | Obiekt pochodzenia opisany poniżej. |
| `materialId` | Trwały identyfikator materiału. |
| `documentedDate` | Niepusta data historyczna obrazu. |

`provenance` zawiera wymagane pola: `title` (do 500 znaków), `sourcePageUrl`, `originalCollectionUrl`, `originalImageUrl` (HTTPS bez danych logowania, do 2000 znaków, albo `null`), `originalSha256` (suma SHA-256), `author` (do 500 znaków albo `null`), `dateNote` i `license` (do 500 znaków), `licenseUrl` (HTTPS albo `null`), `copyrighted` (boolean), `rightsCheckedAt` (pełna data `YYYY-MM-DD`) i `transformations` (do 2000 znaków). Wartości tekstowe inne niż `null` są niepuste. Sama zgodność z kontraktem nie zatwierdza praw: publikacja kopii wymaga potwierdzonej domeny publicznej i zgody na konkretny wariant według zasad warsztatu.

### Przykład rekordu katalogowego

Fikcyjne miejsce z jednym materiałem. Ścieżki, sumy i metadane praw są demonstracyjne i nie odnoszą się do rzeczywistych plików ani decyzji prawnych. Projekcja publiczna ma tę samą treść po usunięciu `published` i `createdAt`.

```json
{
  "id": "place_przyklad",
  "name": "Przykładowa pracownia",
  "slug": "przykladowa-pracownia",
  "previousSlugs": [],
  "description": "Fikcyjny opis służący wyłącznie dokumentacji schematu.",
  "tags": [{ "id": "tag_rzemioslo", "name": "Rzemiosło" }],
  "period": {
    "status": "confirmed",
    "explanation": "Fikcyjna wzmianka dokumentuje działalność w 1932 roku."
  },
  "aliases": [],
  "addresses": [],
  "district": null,
  "location": { "coordinates": null, "precision": "unknown", "explanation": null },
  "mentions": [
    {
      "id": "mention_przyklad_1932",
      "title": "Fikcyjne źródło demonstracyjne",
      "url": null,
      "page": "s. 1",
      "publicationDate": { "from": "1932", "to": null, "approximate": false },
      "documentedDate": { "from": "1932", "to": null, "approximate": false },
      "verification": "verified",
      "accessedAt": "2026-11-09T12:00:00Z",
      "excerpt": "Fikcyjna informacja o działalności pracowni w 1932 roku.",
      "excerptType": "summary",
      "note": null,
      "materials": [
        {
          "materialId": "material_przyklad_1932",
          "documentedDate": { "from": "1932", "to": null, "approximate": false },
          "storagePath": "public/materials/material_przyklad_1932/wycinek.webp",
          "thumbnailPath": "public/materials/material_przyklad_1932/miniatura.webp",
          "alt": "Fikcyjna reklama przykładowej pracowni z 1932 roku.",
          "credit": "Fikcyjne źródło demonstracyjne, 1932, s. 1.",
          "rights": "Domena publiczna — fikcyjna deklaracja wyłącznie na potrzeby przykładu.",
          "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "thumbnailSha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          "provenance": {
            "title": "Fikcyjna reklama pracowni, 1932",
            "sourcePageUrl": "https://example.org/zrodla/przyklad-1932/strona-1",
            "originalCollectionUrl": "https://example.org/kolekcje/przyklad",
            "originalImageUrl": "https://example.org/obrazy/przyklad-1932.png",
            "originalSha256": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            "author": null,
            "dateNote": "Fikcyjne datowanie na podstawie roku wydania źródła: 1932.",
            "license": "Domena publiczna — przykład fikcyjny.",
            "licenseUrl": "https://example.org/prawa/przyklad-1932",
            "copyrighted": false,
            "rightsCheckedAt": "2026-11-09",
            "transformations": "Wycięcie reklamy ze skanu strony, konwersja do WebP i utworzenie miniatury."
          }
        }
      ]
    }
  ],
  "locationVersion": 0,
  "updatedAt": "2026-11-09T12:00:00Z",
  "published": true,
  "createdAt": "2026-11-09T12:00:00Z"
}
```

### Miejsce w prywatnym warsztacie

[Kontrakt warsztatu](../../scripts/research/model/schema.mjs) (schemat 3) jest odrębny. Rekord miejsca ma `id`, `name`, `slug`, `previousSlugs`, `description`, `aliases`, `addresses`, `district`, `location`, `locationVersion`, `createdAt`, `updatedAt` oraz:

- `tags`: tablicę ID tagów ze słownika, zamiast obiektów `{ id, name }`;
- `period`: status `confirmed`, `probable`, `unverified` lub `outside` i uzasadnienie; `places/` zawiera confirmed/probable, a `out-of-period/` unverified/outside;
- `mentionIds`: odwołania do oddzielnych rekordów wzmianek, zamiast zagnieżdżonych `mentions`;
- `relatedPlaces`: obiekty `{ placeId, note, documentId }`, z uwagą i dokumentem dopuszczającymi `null`;
- `questions`: tablicę otwartych pytań badawczych;
- `publicationApproved`: boolean oznaczający zgodę na eksport; nie jest polem `published` w bazie.

Wszystkie te pola są wymagane. Warsztat dopuszcza pusty opis redakcyjny; własne limity i kontrolę powiązań określa jego kontrakt. `confirmed` wymaga zweryfikowanej wzmianki z badanego okresu. Wzmianka warsztatowa przechowuje m.in. `placeId`, `text`, `documentedDate`, `verification`, `verificationNote`, `verifiedAt`, dowody `evidence: [{ documentId, locator, note }]` i `materialIds`. Źródła, dokumenty oraz materiały pozostają osobnymi rekordami.

[Eksport](../../scripts/research/publication/catalog.mjs) rozwija tagi i zweryfikowane wzmianki wraz z dowodami do kontraktu katalogowego; jedna wzmianka z wieloma dowodami daje osobne wpisy publiczne. Eksport wymaga zgody miejsca i co najmniej jednej datowanej, zweryfikowanej wzmianki; prywatne pytania, relacje i pliki nie są kopiowane do publicznego rekordu. Szczegóły pracy: [data/places/README.md](../../data/places/README.md).
