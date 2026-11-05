# Wspólna walidacja Zod

Schematy w `functions/src/contracts/places.mjs` są współdzielone przez klienta,
Functions i skrypty importu/snapshotu/generowania katalogu. Moduł nie importuje
SDK Firebase ani kodu Node. Jest częścią katalogu wdrażanego backendu, dlatego
nie wymaga kopiowania plików ani dodatkowego kroku kompilacji Functions.
Obie paczki przypinają tę samą wersję Zod 4.6.6.

## Kontrakty i granice danych

- `placeSchema` i `catalogSchema`: pełny rekord wejściowy i katalog; adaptery
  Firestore odpowiadają za zamianę GeoPoint/Timestamp na zwykłe dane.
- `publicPlaceSchema` i `publicCatalogSchema`: publiczna projekcja bez pól
  `published` i `createdAt`, sprawdzana podczas generowania artefaktów.
- `readRequestSchema` i `writeRequestSchema`: żądania callable. Aktualizacja
  wymaga znanej pozycji i wersji mniejszej niż maksymalna bezpieczna liczba.
- `locationDtoSchema`, `readResponseSchema` i `parseReadResponse`: odpowiedzi
  API. Klient odrzuca również duplikaty oraz identyfikatory spoza żądania;
  nieistniejące i nieopublikowane miejsca mogą być pominięte.

Wszystkie obiekty są strict. Nie ma automatycznej konwersji pustych wartości,
liczb ani booleanów. Zachowano dotychczasowe ograniczenia tekstów, dat,
współrzędnych, ścieżek ilustracji, pochodzenia, unikalności i 700000 bajtów
dokumentu. Do liczenia UTF-8 służy TextEncoder, dostępny także w przeglądarce.

`validation.mjs` zachowuje małe funkcje wejściowe dla istniejących narzędzi;
delegują one do schematów. `place.ts` wyprowadza typy przez `z.infer` i nakłada
rekurencyjne readonly na dane używane przez widok. `allowJs` pozwala Angularowi
odczytać typy ze wspólnego modułu ESM; `npm run check:contracts` sprawdza sam
moduł w trybie strict/checkJs i jest częścią `npm test`.

Klient pobiera schematy razem z leniwie ładowanym SDK Firebase, waliduje żądanie
oraz całą odpowiedź przed ustawieniem sygnału `current`. Błąd trafia do istniejącego
stanu `error`. Brak bieżącej pozycji po udanym odczycie oznacza lokalizację
`unknown`, zgodną z typem domenowym. Nie powstał nowy formularz edycji; przyszły
formularz ma używać `writeRequestSchema` i osobnego adaptera pól formularza.

Functions mapują błędy żądań na `invalid-argument` z listą kodów i ścieżek pól,
bez wartości wejściowych i wewnętrznych komunikatów Zod. Niepoprawne dane
odpowiedzi dają kontrolowane `internal`. App Check, Google Auth, projekcja pól
publicznych, transakcje i konflikt `aborted` pozostają sprawdzane niezależnie.

## Weryfikacja — 5 listopada 2026

- `npm test`: kontrola typów schematów i 15 testów — PASS.
- `npm run test:emulator`: 7 testów API/reguł, w tym równoczesny zapis — PASS.
- Build: cztery trasy prerenderowane, weryfikacja noindex/404/stylu mapy i 1045
  kafli — PASS. Początkowa paczka 463,08 kB, bez ostrzeżenia budżetu.
- `PLACES_USE_FIREBASE_CLI=1 npm run deploy:dev`: świeży snapshot bazy dev,
  build i publikacja Hosting — PASS. Snapshot zachowuje wersję lokalizacji 1.
- Przeglądarka na dev: mapa, lista i karta bazyliki pokazują wersję pozycji 1,
  źródła i ilustrację; brak błędów i ostrzeżeń konsoli.

Gałąź bazuje na `codex/resizable-sidebar` (PR #4). Niezapisane zmiany mapy
z głównego katalogu roboczego nie są częścią tej pracy. Produkcji nie publikowano.
