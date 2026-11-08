# Warsztat badań Rybnika

Prywatny zbiór JSON i plików, ignorowany przez Git, synchronizowany 1:1 ze Storage. Rybnik, domyślnie 1918–1939 (elastycznie), plan 1932. Badanie nie publikuje danych. Kontrakt: [schema.mjs](../../scripts/research/model/schema.mjs), schemat 3.

## Struktura

| Folder | Znaczenie |
| --- | --- |
| sources | Archiwa, kolekcje i serwisy, zakres, dostęp, instrukcje, sieć discoveredFrom. |
| documents | Konkretne źródła: strony, artykuły, numery gazet, PDF-y; daty publikacji i opisywanego faktu, odczyt, pliki kopii i prawa. parentDocumentId łączy fragment z dokumentem. |
| mentions | Datowane informacje o jednym miejscu: documentedDate, verified/draft/conflicting, verifiedAt, uzasadnienie, evidence(documentId, locator, note), materialIds. |
| materials | Obrazy z własnym datowaniem oryginału i przedstawianego stanu, uzasadnieniem, sourceDocumentIds, klasyfikacją, plikami i prawami. |
| places | Miejsca confirmed/probable: opis redakcyjny, nazwy, adresy, lokalizacja, płaskie tagi, mentionIds i proste relatedPlaces z documentId. |
| out-of-period | Miejsca outside/unverified; zachowane do innych okresów i dalszego rozpoznania. |
| candidates | Uboczne nowe tropy z dowodem documentId i decyzją właściciela; nie rozpoczynamy ich pełnych badań automatycznie. |
| research | Przebieg badań, źródła, brak wyników, zmiany, leads i ograniczenia. |
| files | Oryginały, obrazy stron, wycinki i miniatury; wspólne ścieżki oraz SHA-256 bez powielania identycznych bajtów. |

`config.json` określa miasto i zakres, `tags.json` zawiera płaski słownik. Każde miejsce ma minimum jeden tag. Nazwy rekordów: `<id>.json`. ID nie zmienia się z nazwą ani URL. Walidacja sprawdza także powiązania, zgodność datowania, prawa i sumy plików.

## Daty i weryfikacja

Opis miejsca nie jest dowodem. Zweryfikowana wzmianka wymaga daty/roku lub uzasadnionego zakresu, dokładnego dowodu i czasu weryfikacji. Bez daty lub sprawdzenia pozostaje draft; konflikty są jawne. Daty miejsca wyliczamy z verified wzmianek: **1920, 1928, 1945** pozostają osobnymi punktami, także poza domyślnym okresem. Nie zakładamy ciągłości między nimi. Zachowujemy precyzję źródła, bez wymyślania dni i miesięcy.

Data publikacji i data faktu są osobne. Artykuł 2008 o roku 1935 może być źródłem wzmianki 1935. Współczesna reklama z 1938 stanowi dowód 1938 po ustaleniu charakteru treści. Sama data późniejszej publikacji nie wystarcza. Confirmed wymaga verified wzmianki z okresu; probable wymaga jawnego uzasadnienia. Brak dowodu nie oznacza nieistnienia.

## Materiały historyczne i kopie źródeł

Szukamy starych reklam, wpisów prasowych/archiwalnych, pocztówek, dawnych zdjęć i map. Współczesny skan gazety 1935 jest materiałem 1935. Skany późniejszych opracowań są kopiami źródeł, a współczesne zdjęcia i obrazy bez datowania nie są ilustracjami międzywojennej wzmianki.

Klasyfikacja: historical, source-copy, unidentified, outside-period. Do wzmianki dopuszczamy tylko historical z datowaniem mieszczącym się w okresie verified wzmianki, powiązany z jej dokumentem dowodowym. Szeroko datowany obraz nie potwierdza wąskiego roku/dnia. Galeria historyczna pokazuje wyłącznie takie materiały. Dokumenty źródłowe, kopie późniejszych opracowań i obrazy do rozpoznania mają osobne widoki. Karta miejsca pokazuje chronologię i wzmianki z właściwymi materiałami.

## Archiwizacja i prawa

Zapisujemy wszystkie dostępne materiały prywatnie, również przy unknown/restricted. Nie obchodzimy kontroli dostępu. Oryginał zapisujemy raz po SHA-256; kopie stron i wycinki mają derivedFrom i transformations. Nieudane pobrania odnotowujemy. Prawa do publikacji nie blokują archiwizacji i nie są przez nią nadawane.

Publikacja obrazu wymaga odrębnego zatwierdzenia konkretnego wariantu, potwierdzonej domeny publicznej, podstawy, dowodu (evidenceUrl/evidenceDocumentId), daty sprawdzenia i podpisu. Nie przenosimy zgody z wycinka na całą stronę. Eksport pobiera tylko publicationImages historycznych materiałów właściwych dla zweryfikowanej wzmianki; nie kopiuje prywatnego archiwum.

```sh
npm run research -- init
npm run research -- validate
npm run research:view
npm run research -- capture --collection=documents --material=ID --input=/sciezka/oryginal.pdf --apply
npm run research -- capture --collection=documents --material=ID --input=/sciezka/strona.png --role=scan --derived-from=files/archive/suma.pdf --transformations="Render PDF, strona 8" --apply
```

Capture bez --apply pokazuje plan. Kopię dokumentu przypisujemy następnie do odrębnego rekordu materiału historycznego dopiero po ocenie datowania. `capture --collection=materials` obsługuje istniejący rekord materiału. `hydrate` pobiera lokalnie już opublikowane warianty, bez zmiany praw.

## Synchronizacja i odzyskanie

```sh
npm run research -- pull --firebase-cli
npm run research -- pull --firebase-cli --apply
npm run research -- push --firebase-cli
npm run research -- push --firebase-cli --apply
```

Cel: prywatny prefix `research-workspace/` bucketa dev `historyczny-rybnik-dev-files`. Istniejące ADC/Firebase CLI, bez kluczy, publicznych tokenów i wyłączania TLS. Narzędzie sprawdza prywatność IAM. Reguły odmawiają klientom dostępu do prefixu.

Każda rewizja zawiera identyczne ścieżki i bajty, manifest SHA-256 i rozmiary. Head zmienia się dopiero po kompletnym wysłaniu, z warunkiem generacji; konflikt nie nadpisuje cudzej pracy. Stare rewizje pozostają. `.sync-state.json` jest lokalną podstawą, nie danymi archiwum. Pull odmawia nadpisania lokalnych zmian; sprawdza staging i zachowuje backup w `.local/research-backups`. Usunięcia wymagają obejrzenia planu i --approve-deletions. Pusty zbiór nie może wyczyścić archiwum.

`research restore --revision=SHA --firebase-cli [--apply --approve-deletions]` przywraca lokalną kopię zgodną z bieżącym schematem, następnie push zatwierdza ją zdalnie. Starsze schematy wymagają jawnej migracji. Po przerwanym push ponów operację; identyczne obiekty są rozpoznawane. Blokadę `<root>.sync-lock` usuwaj tylko po sprawdzeniu, że proces nie działa. Nie modyfikuj ręcznie head.

## Migracja i publikacja

`migrations/workspace-v2-v3.mjs` jawnie przekształca schemat 2 w 3: wcześniejsze materiały stają się dokumentami, ustalenia wzmiankami, obrazy otrzymują odrębne rekordy i kwalifikację. Nie przyznaje automatycznie weryfikacji niepewnym faktom. `migrate` tworzy warsztat z katalogu tylko w pustym zbiorze. Stare ID dokumentów zachowujemy; nowe wzmianki i materiały mają trwałe ID. Pliki i decyzje praw pozostają zachowane; kopie wejścia i stare rewizje umożliwiają odtworzenie migracji.

Publiczny kontrakt miejsca używa mentions z documentedDate, verification, źródłem i materials z własnym datowaniem. `upgradePlace` jawnie migruje dawne references — zwykły odczyt pozostaje ścisły. Nowe badania nie włączają publicationApproved. Eksport wymaga zatwierdzonego miejsca i datowanych verified wzmianek, zachowuje resztę wskazanego katalogu, nie usuwa istniejących rekordów. Import chroni live location/version/timestamps transakcyjnie.

```sh
npm run research -- export
npm run research -- export --apply
npm run research -- assets
npm run research -- assets --apply --firebase-cli
GCLOUD_PROJECT=historyczny-rybnik npm run places:import -- .local/research.catalog.json --firebase-cli
```

Dopiero osobne places:import --apply zapisuje bazę dev. Lokalna przeglądarka działa tylko na 127.0.0.1:4319, jest tylko do odczytu, bez Google i internetu przy przeglądaniu, poza Hosting/SSG. Plan, moduły i obrazy są lokalne. `--root=/absolutna/sciezka` wybiera warsztat; `RESEARCH_PORT` ustawia port.
