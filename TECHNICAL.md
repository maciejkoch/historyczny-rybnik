# Opis techniczny

Aktualny stan kodu i konfiguracji. [CONTRIBUTING.md](CONTRIBUTING.md) określa praktyki implementacji i review. [SECURITY.md](SECURITY.md) określa obowiązujące wymagania bezpieczeństwa przy pracy i review; opis mechanizmów poniżej nie zastępuje ich weryfikacji. Materiały szczegółowe i plany są w [agent-context/reference/](agent-context/reference/README.md).

## Stos

- Angular 22.2 (core 22.2.4, CLI/build/SSR 22.2.5), TypeScript 6.0, RxJS 7.8.
- Tailwind CSS 4.3.4 i daisyUI 5.7.50; fonty Lora i Source Sans 3 z lokalnych pakietów Fontsource.
- MapLibre GL JS 6.16.0.
- Statyczne generowanie HTML (SSG), hydratacja w przeglądarce i klasyczny Firebase Hosting.
- Node 22.23.2 z `.nvmrc`, npm 12.0.2. Dokładne zależności: `package.json` i `package-lock.json`.
- Firebase JS 12.19.0 i Zod 4.6.6; backend Firebase Functions, Firestore, Storage, Google Auth i App Check.

## Mechanizmy i struktura

- Angular generuje publiczny HTML i hydratację; mapa jest uruchamiana wyłącznie w przeglądarce.
- Trasy: `/` (mapa), `/szukaj`, `/miejsca/:slug` dla opublikowanych miejsc, `/o-nas`, `/prywatnosc` i 404. Hosting nie stosuje globalnego fallbacku SPA.
- Katalog do statycznego builda jest walidowany i przygotowywany przez `places:prepare`. Bieżące pozycje mogą pochodzić z API; bez zgody na usługi Google aplikacja korzysta ze snapshotu.
- Komponenty panelu i mapy są w `src/app/atlas/` i `src/app/atlas-map/`; `src/app/places/` obsługuje katalog i pozycje, `src/app/privacy/` zgody i politykę prywatności. Stan interfejsu korzysta z Signals.
- `functions/` zawiera backend i jego testy; `functions/src/contracts/` współdzielone kontrakty. `data/` przechowuje dane do publikacji, a `infra/` konfigurację infrastruktury.
- `public/` zawiera zasoby, `scripts/` narzędzia budowania i danych, `.github/` CI. `agent-context/` zawiera materiały robocze oraz zachowane plany, źródła i opisy szczegółowe w `reference/`.
- Backend dev działa w projekcie `historyczny-rybnik`: baza `places-dev`, bucket `historyczny-rybnik-dev-files`, codebase Functions `places-dev` i osobne konta usług dev; Auth jest wspólne. [Konfiguracja](agent-context/reference/mvp-1/faza-3-infrastruktura.md).

## Architektura frontendu

| Obszar | Odpowiedzialność |
| --- | --- |
| `src/main.ts`, `main.server.ts`, `app.config*.ts` | Start przeglądarki i SSG, konfiguracja Angulara, routera i hydratacji. |
| `app.routes.ts`, `app.routes.server.ts` | Publiczne adresy oraz wybór stron generowanych podczas builda. Lista kart wynika z katalogu. Atlas i jego katalog są ładowane przez osobny pakiet tras atlas/atlas.routes.ts; SSG nadal generuje wszystkie karty. Reuse rozpoznaje te trasy po data.atlas, bez wciągania komponentu atlasu do pakietu startowego. |
| `app/atlas/atlas.ts` | Łączy stan trasy, wyszukiwania, wybranego miejsca i lokalizacji. Ustawia metadane, zarządza nawigacją, przewijaniem i powiększaniem skanów. |
| `app/atlas/place-*-panel.*` | Osobne widoki wyników wyszukiwania i szczegółów miejsca. |
| `app/atlas/panel-layout.ts` | Układ i rozmiar paneli oraz ustawienia zapamiętywane zgodnie ze zgodą użytkownika. |
| `app/atlas-map/` | Mapa i jej znaczniki. |
| `app/places/` | Typy, normalizacja wyszukiwania, wygenerowany katalog, konfiguracja Firebase i odczyt pozycji. `AtlasReuse` zachowuje instancję atlasu między jego trasami. |
| `app/about/` | Publiczna strona „O nas”, prerenderowana pod `/o-nas`, z metadanymi i wspólnym układem portalu. Desktop udostępnia przycisk Mapa, telefon również Znajdź miejsce. App ustawia przewinięcie okna na górę po wyrenderowaniu każdej zmiany ścieżki, także Wstecz/Dalej; zmiana samego zapytania nie przesuwa widoku. Atlas zeruje właściwy panel przy przejściu do wyszukiwarki lub karty na desktopie. |
| `app/privacy/` | Serwis zgód, baner i polityka prywatności. Wycofanie zgody Google przeładowuje stronę, aby zatrzymać SDK i odświeżanie tokenów. |
| `app/layout/` | Wspólny nagłówek, stopka, nawigacja mobilna i menu globalne. `PortalMenu` otacza wspólny układ aplikacji standardową strukturą Drawer daisyUI (`drawer-toggle`, `drawer-content`, `drawer-side`, `drawer-overlay`) i współdzieli listę odnośników z Dropdown daisyUI na Popover API oraz CSS Anchor Positioning. Stan nagłówka i menu łączy `PortalMenuState`. Wspólny nagłówek jest przyklejony do góry; na desktopie zajmuje pełną szerokość nad mapą i panelami. Dropdown otwiera się pod hamburgerem i pomija odnośnik Szukaj, ponieważ wyszukiwarka jest dostępna w panelu. Na telefonie menu zachowuje Mapa/Szukaj; tło jest nieaktywne dzięki `inert`, przewijanie strony jest blokowane, a fokus wraca do hamburgera. Przejścia otwierania i zamykania pochodzą z daisyUI. |

Przepływ danych: plik katalogu → walidacja i `places:prepare` → `catalog.generated.ts`, indeks wyszukiwania, sitemap i przekierowania → prerender HTML → hydratacja. W przeglądarce `Atlas` łączy katalog z bieżącymi pozycjami z `Locations`; wyszukiwanie filtruje nazwy, aliasy, adresy i dzielnice lokalnie.

`Locations` ładuje Firebase i App Check dopiero po zgodzie Google. Wywołuje `placesDevRead` i waliduje odpowiedź wspólnym kontraktem Zod. Bez zgody lub przy błędzie odczytu punktem odniesienia pozostaje opublikowany snapshot. `catalog.generated.ts` jest wynikiem generatora, nie miejscem ręcznej edycji treści.

## Architektura backendu

| Obszar | Odpowiedzialność |
| --- | --- |
| `functions/src/index.mjs` | Inicjalizuje Admin SDK i bazę `places-dev`, eksportuje callable API `placesDevRead` i `placesDevUpdate` w regionie `europe-central2`. Konfiguruje App Check, CORS, konto usługi i limity zasobów. |
| `functions/src/service.mjs` | Realizuje odczyt publicznych pozycji i transakcyjny zapis lokalizacji, autoryzację, konflikty wersji oraz mapowanie danych Firestore na odpowiedź API. |
| `functions/src/validation.mjs` | Udostępnia walidację wejścia i katalogu oraz wspólny format błędów walidacji. |
| `functions/src/contracts/places.mjs` | Schematy Zod współdzielone przez backend, frontend i skrypty publikacji; obejmują katalog, żądania i odpowiedzi. |
| `functions/test/` | Testy logiki, kontraktów i walidacji oraz testy API i reguł w emulatorach. |
| `firestore.rules`, `storage.rules`, `firestore.indexes.json` | Kontrola bezpośredniego dostępu klientów i konfiguracja indeksów. Operacje serwerowe działają przez Admin SDK i uprawnienia IAM. |
| `firebase.backend.dev.json`, `infra/iam.dev.json` | Docelowe zasoby backendu dev i uprawnienia kont usług. |

`placesDevRead`: App Check → walidacja listy identyfikatorów → odczyt opublikowanych dokumentów `places` → odpowiedź z lokalizacją, wersją i czasem aktualizacji. Nie wymaga zalogowanego użytkownika.

`placesDevUpdate`: App Check i Google Auth → walidacja → transakcja porównująca `expectedLocationVersion` → zapis współrzędnych, zwiększenie wersji i czas serwera. Konflikt zwraca `aborted`; po zapisie API odczytuje bieżący stan dokumentu. Nie zapisuje historii pozycji. Account inicjalizuje Google Auth wyłącznie w przeglądarce po zgodzie na Google. Na desktopie nagłówek pokazuje nazwę użytkownika i rolę obok hamburgera. PortalMenu udostępnia na obu urządzeniach sekcje: konto i logowanie/wylogowanie, nawigacja, prywatność. Nagłówek pokazuje komunikaty błędów, Atlas podgląd punktu, dokładność, opcjonalny komentarz i zapis przez Locations.update. Zapis porównuje wersję z początku edycji; błąd wymaga sprawdzenia bieżącej pozycji i ponownego rozpoczęcia edycji. Bez dodatkowych kolekcji i blokad.

## Schemat miejsca

Źródłem obowiązującego kontraktu jest [functions/src/contracts/places.mjs](functions/src/contracts/places.mjs). `placeSchema` opisuje rekord katalogowy używany przy imporcie i snapshotach kolekcji Firestore `places`; `publicPlaceSchema` opisuje projekcję do frontendu/SSG, bez `published` i `createdAt`. Schematy są ścisłe: wszystkie wymienione pola są wymagane, także tablice puste i pola dopuszczające `null`; dodatkowe pola są odrzucane. Poniższe limity dotyczą kontraktu publicznego/katalogowego, nie prywatnego warsztatu.

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

[Kontrakt warsztatu](scripts/research/model/schema.mjs) (schemat 3) jest odrębny. Rekord miejsca ma `id`, `name`, `slug`, `previousSlugs`, `description`, `aliases`, `addresses`, `district`, `location`, `locationVersion`, `createdAt`, `updatedAt` oraz:

- `tags`: tablicę ID tagów ze słownika, zamiast obiektów `{ id, name }`;
- `period`: status `confirmed`, `probable`, `unverified` lub `outside` i uzasadnienie; `places/` zawiera confirmed/probable, a `out-of-period/` unverified/outside;
- `mentionIds`: odwołania do oddzielnych rekordów wzmianek, zamiast zagnieżdżonych `mentions`;
- `relatedPlaces`: obiekty `{ placeId, note, documentId }`, z uwagą i dokumentem dopuszczającymi `null`;
- `questions`: tablicę otwartych pytań badawczych;
- `publicationApproved`: boolean oznaczający zgodę na eksport; nie jest polem `published` w bazie.

Wszystkie te pola są wymagane. Warsztat dopuszcza pusty opis redakcyjny; własne limity i kontrolę powiązań określa jego kontrakt. `confirmed` wymaga zweryfikowanej wzmianki z badanego okresu. Wzmianka warsztatowa przechowuje m.in. `placeId`, `text`, `documentedDate`, `verification`, `verificationNote`, `verifiedAt`, dowody `evidence: [{ documentId, locator, note }]` i `materialIds`. Źródła, dokumenty oraz materiały pozostają osobnymi rekordami.

[Eksport](scripts/research/publication/catalog.mjs) rozwija tagi i zweryfikowane wzmianki wraz z dowodami do kontraktu katalogowego; jedna wzmianka z wieloma dowodami daje osobne wpisy publiczne. Eksport wymaga zgody miejsca i co najmniej jednej datowanej, zweryfikowanej wzmianki; prywatne pytania, relacje i pliki nie są kopiowane do publicznego rekordu. Szczegóły pracy: [data/places/README.md](data/places/README.md).

## Katalog lokalny `.local/`

To generowany, ignorowany przez Git katalog danych roboczych. Nadal jest używany: `places:snapshot` zapisuje `.local/places.snapshot.json`, a `deploy:dev` buduje z tego pliku. Nie usuwamy go jako zbędnego elementu procesu. Sam snapshot można odtworzyć; inne zastane pliki lokalne wymagają osobnej oceny przed usunięciem. Nowe notatki i skrypty agenta trafiają do `agent-context/`.

## Uruchomienie, publikacja i weryfikacja

Wymagany Node zgodny z `.nvmrc` (22.23.2) oraz npm 12.0.2.

```sh
npm ci
npm ci --prefix functions
npm start
npm run build
npm run emulate
```

Build przygotowuje katalog miejsc i generuje statyczne pliki w `dist/historyczny-rybnik/browser`. Offline build nie wymaga połączenia z usługami danych; runtime może pobierać bieżące pozycje z API. `npm run build` sprawdza też prerender strony głównej, 404 i blokadę indeksowania preview. Fonty Lora i Source Sans 3 (również latin-ext z polskimi znakami) są bundlowane lokalnie z pakietów Fontsource; ich licencje znajdują się w `public/fonts`.

## Środowiska i publikacja

| Środowisko | Adres | Witryna Hosting | Polecenie |
| --- | --- | --- | --- |
| Dev — integracja | https://historyczny-rybnik-dev.web.app/ | `historyczny-rybnik-dev` | `npm run deploy:dev` |
| Produkcja — wydania | https://historyczny.rybnik.pl/ | `historyczny-rybnik` | `npm run deploy:prod` (obecnie blokowane) |

Dev jest osobną witryną Hosting ze swoim kanałem live, dlatego nie wygasa i ma stały adres. Konfiguracja `firebase.dev.json` wskazuje dev, a `firebase.json` produkcję. `deploy:dev` pobiera snapshot przez serwerowe ADC i buduje z niego aplikację; lokalny operator używa `PLACES_USE_FIREBASE_CLI=1 npm run deploy:dev`. Backend dev: `npm run deploy:backend:dev`. Nie konfigurujemy automatycznych deploymentów CI ani poświadczeń w repo.

Ustalenie z 5 listopada 2026: bieżące prace publikujemy na dev. Skrypt `deploy:prod` obecnie przerywa pracę bez publikacji, dopóki faza 5 nie przygotuje backendu, domeny i indeksowania produkcji. Produkcję publikujemy na wyraźne zlecenie wydania; dodanie polecenia nie oznacza publikacji obecnego szkieletu. Indeksowanie produkcji włączamy w fazie 5; obecny build ma noindex. Logowanie CLI: `npx firebase login`.

Obie witryny należą do `historyczny-rybnik`. Właściciel wybrał wspólne Auth i billing oraz oddzielną bazę, bucket, funkcje i konta usług dev. Szczegóły izolacji i poleceń: [faza 3](agent-context/reference/mvp-1/faza-3-infrastruktura.md).

### Tymczasowe preview

```sh
npx firebase login
npm run preview
```

Polecenie buduje aplikację i publikuje wyłącznie kanał `faza-1` w projekcie `historyczny-rybnik`, ważny 30 dni. Używa lokalnego logowania Firebase CLI; poświadczenia nie trafiają do repozytorium. Nie publikuje kanału live. Konfiguracje nie zawierają fallbacku SPA: nieznane URL-e zwracają HTTP 404 z własnym `404.html`. Preview blokuje indeksowanie przez meta robots, robots.txt i nagłówek X-Robots-Tag. Przed produkcją w fazie 5 potrzebna będzie osobna konfiguracja indeksowania.

CI wykonuje `npm ci`, build i zapisuje artefakt Hosting. Nie ma uprawnień do deploymentu. CI uruchamia także walidację oraz testy API/reguł w emulatorach. Offline build korzysta wyłącznie z fikcyjnego data/places.fixture.json, bez poświadczeń chmurowych.

[Zapis odbioru fazy 1](agent-context/reference/mvp-1/odbior-fazy-1.md).

Szczegóły: [środowiska dev i produkcja](agent-context/reference/mvp-1/srodowiska.md).

## Testy i utrzymanie

`npm test` sprawdza mapę, kontrakty, prywatność, backend i warsztat. `npm run test:emulator` weryfikuje API i reguły w emulatorach Firestore/Storage. Przy zmianach georeferencji uruchamiamy testy opisane w [scripts/maps/README.md](scripts/maps/README.md).

Szczegóły zgód i ich odbioru: [cookie-consent.md](agent-context/reference/mvp-1/cookie-consent.md). Aktualizujemy ten dokument razem ze zmianami technologii, mechanizmów, struktury i procedur. Sama dokumentacja nie wymaga deploymentu.

### Środowiska równoległych zadań

Trzy witryny `historyczny-rybnik-dev-1`, `-2`, `-3` mają osobne konfiguracje `firebase.dev-N.json` i polecenia `deploy:dev-N`. Współdzielą istniejący backend dev; domeny dopuszczono w CORS, Auth i App Check. Atomowe blokady `env-lock/dev-N` oraz pole Środowisko w Projects określają rezerwacje. Pełny proces: [środowiska](agent-context/reference/mvp-1/srodowiska.md). Stały dev służy integracji.

Rola administratora: custom claim `admin: true` w Firebase Auth. Rejestracja i przeglądanie są publiczne; zapis lokalizacji wymaga Google Auth, App Check i roli admina. Rola dociera do klienta przy wydaniu nowego tokenu, np. po ponownym logowaniu. Odebranie roli nie unieważnia już wydanego tokenu (ważnego do około godziny).

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.

## Pełny katalog na dev

Ignorowany snapshot `.local/places.snapshot.json` jest wejściem builda dev. Baza dev zawiera 200 miejsc (196 przeniesionych z MVP.0 i cztery punkty sprzedaży benzyny), ze stabilnymi ID i zachowanym rekordem `place_sw_antoni`. Build przyjmuje pełny walidowany snapshot, a odczyt lokalizacji dzieli katalog na żądania po maksymalnie 100 ID. Import dev obsługuje do 400 miejsc w jednej transakcji, zachowuje istniejące lokalizacje, wersje i daty; odrzuca pominięcie istniejących dokumentów. Produkcja pozostaje oddzielnym zadaniem.

Filtr „Bez lokalizacji” używa aktualnych danych Locations (lub snapshotu przy niedostępnym odczycie) i wybiera miejsca z `location.coordinates === null`. Łączy się z wyszukiwaniem tekstowym; zmienia listę wyników, a stan pozostaje w pamięci atlasu.

Indeks .local/source-rights.json zapisuje decyzje praw na poziomie konkretnego wydania i odwołania materiałów. Publiczne dokumenty places zachowują pochodzenie, datę sprawdzenia oraz sumy wycinka i miniatury. originalSha256 nowych obrazów opisuje odziedziczony wycinek MVP.0 (jawnie w transformations), nie pełny PDF. Indeks nie jest dodatkową kolekcją ani manifestem plików.

## Warsztat badań historycznych

Skill `rybnik-research-places` zleca zbieranie źródeł i robocze wpisy jednemu subagentowi `gpt-6-luna` z reasoning `high`, bez dziedziczenia historii rozmowy. Model główny wykonuje pull, po zakończeniu badacza sprawdza dowody, datowanie, tożsamość i prawa, a następnie waliduje i synchronizuje wynik. Zapisy do warsztatu są sekwencyjne. Brak dostępnej Luny/delegacji jest zgłaszany bez automatycznego użycia droższego modelu. To instrukcja delegowania w skillu, bez globalnej zmiany konfiguracji Codex; [użycie](.agents/README.md).

Prywatny `data/places/`, schemat 3: sources (kolekcje), documents (konkretne źródła i ich kopie), mentions (datowane fakty o jednym miejscu), materials (odrębne obrazy), places/out-of-period, candidates i research. Miejsce wskazuje mentionIds. Wzmianka ma documentedDate, verified/draft/conflicting, verifiedAt, evidence z documentId/locator oraz materialIds. Zweryfikowana wzmianka wymaga daty i czasu sprawdzenia. Daty miejsca są wyliczane ze zweryfikowanych wzmianek, bez interpolowania ciągłości pomiędzy latami.

Obraz ma własne originalDate/depictedDate, źródłowe dokumenty, uzasadnienie datowania i klasyfikację historical/source-copy/unidentified/outside-period. Powiązanie z verified wzmianką wymaga historycznej klasyfikacji, zgodnego dokumentu i datowania mieszczącego się w jej okresie. Skany późniejszych opracowań pozostają kopiami źródeł; współczesne/nieustalone zdjęcia są poza galerią historyczną. Pliki współdzielimy po SHA-256. Archiwizacja prywatna nie zależy od praw publikacyjnych; eksport nadal wymaga potwierdzonej domeny publicznej i zgody na konkretny wariant.

Publiczna projekcja Firestore/SSG używa mentions zamiast references: documentedDate, verification, dane źródła i materials z własnym datowaniem. Kontrakt odrzuca materiał spoza dat wzmianki. Nowy eksport zawiera tylko verified wzmianki; jawna migracja dawnych rekordów zachowuje robocze wpisy oddzielnie. Import nadal chroni lokalizację, wersję i daty transakcyjnie. Nie ma automatycznego importu ani publikacji wyników badania.

`migrations/workspace-v2-v3.mjs` wykonuje jawną migrację warsztatu 2 → 3, `migrations/legacy-catalog.mjs` migruje publiczny kontrakt references → mentions. Zwykłe odczyty pozostają ścisłe. Stare rewizje zachowują bajty wejścia; odzyskanie starszego schematu wymaga jawnej migracji.

Sync zachowuje identyczne ścieżki/bajty, niezmienne rewizje, SHA-256, kontrolę konfliktów i atomowy head z warunkiem generacji. Prywatny prefix research-workspace/ w bucketcie dev nie ma publicznego dostępu. ADC/Firebase CLI bez nowych kluczy i tokenów pobierania.

Lokalna przeglądarka HTML/CSS/JS działa tylko na 127.0.0.1:4319, tylko do odczytu, z kontrolą Host/Origin, bez symlinków i zewnętrznych zależności przy przeglądaniu. Pokazuje chronologię miejsca, wzmianki, galerię historyczną, dokumenty/kopie źródeł i obrazy do rozpoznania. Pozostaje poza Hosting i SSG. Instrukcje: data/places/README.md; testy: scripts/research/test.

Narzędzia `scripts/research/` są pogrupowane w model, workspace, sync, migrations, publication, viewer i test. `cli.mjs` pozostaje wspólnym wejściem operatora; polecenia npm zachowują nazwy. Spis modułów: scripts/research/README.md.

Rzeczywiste katalogi i indeks dawnych praw są poza Git. Wersjonowany jest tylko fikcyjny data/places.fixture.json. Generator tworzy ignorowane src/app/places/catalog.generated.ts, public/search-index.json i public/sitemap.xml. Szablony firebase.dev*.json pozostają stałe; przekierowania z katalogu są zapisywane do ignorowanych .local/firebase.dev*.json z bezwzględną ścieżką Hosting. Deploy dev i preview używają tych wygenerowanych konfiguracji. Start/watch najpierw przygotowują katalog, więc świeży checkout nie wymaga śledzonego modułu generated.

## Mapa

Aplikacja używa MapLibre GL JS 6.16.0: źródeł i warstw wektorowych, rastrowych oraz GeoJSON, znaczników HTML, kamery, kontrolek i zdarzeń mapy. Grupowanie wykorzystuje klastrowanie GeoJSON MapLibre; własna obsługa znaczników i animacji grup znajduje się w `src/app/atlas-map/group-markers.ts`, a rozstrzyganie nakładających się grup w `src/app/atlas-map/cluster-visibility.ts`.
