# Warsztat badań Rybnika

Trwały zbiór badawczy, domyślnie Rybnik 1918–1939 (elastycznie), z lokalnym planem 1932. Badania nie publikują danych automatycznie. Pojedynczy rekord to JSON o nazwie `<id>.json`; ID nie zmienia się z nazwą miejsca ani URL. Dane i pliki są prywatne, ignorowane przez Git. Ten README, schematy, narzędzia i fikcyjne testy pozostają w repo.

## Zawartość

| Ścieżka | Zawartość |
| --- | --- |
| `config.json` | Wersja schematu, miasto, domyślny zakres 1918–1939 i elastyczność. |
| `sources/` | Źródła/kolekcje: zakres, języki, zasoby, wyszukiwanie, OCR, dostęp, ogólne zasady praw, `discoveredFrom` (ID źródła + przypis/odnośnik). URL może być null dla źródła offline. |
| `materials/` | Konkretne publikacje/zdjęcia/skany/fragmenty, źródło, daty publikacji i treści, autor, sygnatura/strona, odczyt i jego rodzaj, miejsca, prawa i ich dowód, rodzic i pliki. |
| `files/` | Oryginały, skany, wycinki i miniatury; powiązania i SHA-256 w materiale. Także wejściowe kopie migracji dla odtwarzalności. |
| `places/` | Potwierdzone lub uzasadnione prawdopodobne miejsca: nazwy/adresy, lokalizacja, tagi, kwalifikacja okresu, ustalenia z dowodami, proste powiązania miejsc, pytania i zatwierdzenie publikacji. |
| `out-of-period/` | Rozpoznane miejsca spoza okresu lub z nieustalonym związkiem; zachowane do dalszych badań. |
| `candidates/` | Nowe tropy do przeglądu właściciela: dowód, powód, kontekst, duplikaty i decyzja. Akceptacja/połączenie wskazuje docelowe miejsce. |
| `tags.json` | Płaskie definicje ID/nazwa/opis/synonimy. Minimum jeden tag na miejsce, bez dziedziczenia. |
| `research/` | Kontekst kolejnych badań, zapytania, odwiedzone zakresy, także brak wyników/niedostępność, zmienione rekordy, dalsze tropy, ograniczenia i krótki raport. |

Dokładne pola i limity: [model.mjs](../../scripts/research/model.mjs). Fikcyjny kompletny przykład: [fixtures.mjs](../../scripts/research/test/fixtures.mjs). `npm run research -- validate` sprawdza schematy, unikalność, relacje, foldery, decyzje praw i sumy lokalnych plików.

Miejsce to obiekt lub punkt działalności, bez oddzielnego modelowania instytucji/budynku. `relatedPlaces` to `placeId`, opcjonalne `note` i `materialId`. Firma X i sąsiedzi Y/Z mogą zostać połączeni dla następnego badania. Kandydat wymaga decyzji właściciela przed pełnym badaniem.

## Okres, dowody i prawa

`period.status`: `confirmed` (konkretny dowód z `evidence`), `probable` (uzasadnienie, ale brak potwierdzenia), `unverified` (brak podstaw kwalifikacji), `outside` (poza okresem). Dwa pierwsze stany są w places, dwa ostatnie w out-of-period. Przeniesienie zachowuje ID. Późniejsza publikacja może opisywać 1932. Wzmianka 1890 wymaga poszukiwań późniejszych, a 1950 wcześniejszych. Nie zakładaj ciągłości ani tożsamości na podstawie samej nazwy/adresu. Daty są nullable: `{from,to,approximate}`, dokładność rok/miesiąc/dzień, bez wymyślania brakujących dat.

`findings`: ID, nasze streszczenie ustalenia, `confirmed|uncertain|conflicting`, dowody `materialId + locator + note`. Niepewność i sprzeczności pozostają widoczne. W treści materiału rozdzielamy cytat/transkrypcję/OCR/streszczenie. A cytujące B nie stanowi drugiego niezależnego potwierdzenia; zapisuj łańcuch źródeł i szukaj oryginału.

Materiały o nieustalonych prawach rejestrujemy z `unknown`, bez automatycznego pobrania/publikacji. `downloadAllowed` i `publicationApproved` to odrębne decyzje. Kopie publikujemy obecnie tylko przy potwierdzonej domenie publicznej konkretnego materiału, z basis/evidenceUrl/checkedAt/credit. Dostęp publiczny do biblioteki nie jest licencją całości. `publicationImages` przechowuje zatwierdzone publiczne warianty z pełnym kontraktem pochodzenia; nowe ścieżki `public/materials/<materialId>/<niezmienna-nazwa>.jpg|png|webp`. Lokalne pliki oryginałów i wariantów mają SHA-256, role oraz `derivedFrom`/opis przekształceń.

## Użycie

Wymagane zależności root i functions (`npm ci`, `npm ci --prefix functions`), Node z `.nvmrc`. Skill projektowy: `$rybnik-research-places`, np. „szukaj kościołów” lub „kontynuuj firmę A; skup się na zdjęciach”. Po zakończeniu zwraca krótki raport miejsc, źródeł, materiałów, kandydatów, niepewności i dalszych tropów.

```sh
npm run research -- init
npm run research -- pull --firebase-cli
npm run research -- pull --firebase-cli --apply
npm run research -- validate
npm run research:view
npm run research -- push --firebase-cli
npm run research -- push --firebase-cli --apply
```

Przeglądarka: http://127.0.0.1:4319 — tylko lokalnie, tylko odczyt. Jedno polecenie buduje lokalnie CSS i uruchamia serwer. Nie wymaga Google ani internetu do przeglądania, mapy i grafu. Port można ustawić przez `RESEARCH_PORT`. `--root=/absolutna/sciezka` wybiera inną kopię warsztatu dla narzędzi i przeglądarki. Samo `init` nie nadpisuje istniejących rekordów.

## Synchronizacja 1:1 i odzyskiwanie

Cel: prywatny prefix `research-workspace/` istniejącego bucketa dev `historyczny-rybnik-dev-files`. ADC operatora lub istniejące logowanie `--firebase-cli`; bez tworzenia kluczy. Weryfikacja TLS pozostaje włączona. Przed synchronizacją narzędzie sprawdza brak publicznych powiązań IAM bucketa. Reguły Firebase odmawiają klientom każdego dostępu do prefixu; pliki nie otrzymują publicznych tokenów pobierania.

Każda rewizja przechowuje **te same względne ścieżki i identyczne bajty** co lokalny zbiór w `revisions/<sha>/`. `head.json` wskazuje zatwierdzony kompletny stan, a manifest opisuje SHA-256 i rozmiary. To pliki w Storage, nie dodatkowa baza. Wysłanie niekompletnej rewizji nie zmienia head. Zmiana head używa warunku generacji (CAS); równoległy zapis wywołuje konflikt, zamiast nadpisywać inne badanie. Poprzednie rewizje pozostają do odzyskania. Fizyczne czyszczenie historii nie jest częścią synchronizacji.

`pull`/`push` bez `--apply` pokazują plan. Usunięcia wymagają obejrzenia listy i osobnego `--approve-deletions`; pusty zbiór nie może wyczyścić archiwum. Pobranie odmawia nadpisania lokalnych zmian. `.sync-state.json` to lokalna podstawa porównania, nie część synchronizowanego zbioru. README również pozostaje lokalną dokumentacją repo.

Pobranie odbywa się do katalogu tymczasowego, sprawdza cały zbiór, potem podmienia go, zachowując poprzednią lokalną kopię w `.local/research-backups/`. Przy przerwaniu wysyłania ponów tę samą operację: niezmienne obiekty z poprawną sumą zostaną rozpoznane. Przy awarii procesu lokalna blokada `<root>.sync-lock` pozostaje; usuń ją ręcznie dopiero po sprawdzeniu, że poprzedni proces nie działa. Po awarii między podmianami przywróć zachowaną kopię lokalną z raportowanej lokalizacji backupu.

```sh
npm run research -- restore --revision=<sha-poprzedniej-rewizji> --firebase-cli
npm run research -- restore --revision=<sha-poprzedniej-rewizji> --firebase-cli --apply --approve-deletions
```

Restore przywraca lokalną kopię; zwykły push zatwierdza ją jako bieżącą zdalnie. Nie zmieniaj head ręcznie. Prywatne dane nie trafiają do Git, public, SSG ani Hosting.

## Migracja i publikacja

`npm run research -- migrate [--input=plik.json]` pokazuje migrację wcześniejszego katalogu; `--apply` zapisuje wyłącznie do pustego warsztatu. Zachowuje ID, referencje w materiałach/ustaleniach, publiczne metadane obrazów i kopie wejścia w files. Wykorzystuje dotychczasowy `data/source-rights.json` w jego dokładnym zakresie; nigdy nie rozszerza praw. Szerokie wcześniejsze category mapuje jawnie na szerokie tagi, bez zgadywania branży. Brak historycznego datowania nie staje się potwierdzeniem międzywojnia; takie miejsca trafiają do out-of-period, z wyłączoną zgodą publikacji.

Nowe badania utrzymują prawa w materials; source-rights jest zachowanym wejściem migracji, nie drugim aktualizowanym rejestrem warsztatu. Zatwierdzenie treści do publikacji jest osobną decyzją redakcyjną. Eksport łączy zatwierdzone zmiany ze wskazanym istniejącym katalogiem, zachowując pozostałe opublikowane rekordy; nie usuwa ich wskutek braku nowego opracowania.

```sh
npm run research -- export
npm run research -- export --apply
npm run research -- assets
npm run research -- assets --apply --firebase-cli
GCLOUD_PROJECT=historyczny-rybnik npm run places:import -- .local/research.catalog.json --firebase-cli
```

Dopiero osobne `places:import ... --apply` zapisuje bazę dev. Zachowuje aktualną lokalizację, wersję i daty z Firestore transakcyjnie. Eksport nie zawiera prywatnego warsztatu; publikuje nasze streszczenia ustaleń i referencje. Niepotwierdzenie okresu jest jawne na publicznej karcie. Materiały o nieustalonych prawach mogą być wskazane linkiem, ich kopie nie są eksportowane. Nowe zatwierdzone publiczne warianty muszą mieć lokalne pliki o zgodnych sumach; `assets` przesyła niezmienne nazwy i odmawia nadpisania innej zawartości.

Migracja kontraktu istniejącej bazy: operator pobiera kopię `places:snapshot -- --firebase-cli --migrate-legacy`, przegląda różnicę, a następnie importuje ją nowym importerem. `--migrate-legacy` jest jawnym narzędziem jednorazowej migracji, normalny odczyt/build pozostaje ścisły. Build i deployment portalu to oddzielny proces dev-N; lokalna przeglądarka nigdy nie jest wdrażana.

`npm run research -- hydrate --firebase-cli` pokazuje brakujące lokalne kopie już opublikowanych, zatwierdzonych obrazów. `--apply` pobiera je ze Storage dev, weryfikuje SHA-256 i zapisuje w files/imported oraz materiale. Nie pobiera nowych materiałów z nieustalonymi prawami; umożliwia podgląd wcześniejszych wycinków bez internetu. Po pobraniu wykonaj push warsztatu.
