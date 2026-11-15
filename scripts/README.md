# Skrypty i polecenia

Pełny spis utrzymywanych skryptów repozytorium. Polecenia uruchamiamy z root, o ile nie podano inaczej. Przy dodaniu, usunięciu lub zmianie działania skryptu albo polecenia npm aktualizujemy ten plik w tym samym zadaniu.

## Pliki w scripts/

| Plik | Rola |
| --- | --- |
| [maps/prepare_history.py](maps/prepare_history.py) | Dopasowuje skan planu, generuje kafelki WebP, manifest i granice nakładki. |
| [maps/register_scans.py](maps/register_scans.py) | Wyznacza kandydatów punktów dopasowania na podstawie lokalnych obrazów odniesienia; narzędzie opcjonalne. |
| [maps/cluster-visibility.test.mjs](maps/cluster-visibility.test.mjs) | Sprawdza usuwanie nakładających się grup kafelków różnych poziomów. |
| [maps/test_georeference.py](maps/test_georeference.py) | Testuje georeferencję, transformację odwrotną i walidację punktów. |
| [places/check-live.mjs](places/check-live.mjs) | Sprawdza działające API dev, App Check, Google Auth i konflikt wersji. Wykonuje rzeczywisty zapis lokalizacji testowego kościoła; wymaga tokenów w środowisku. |
| [places/backfill-place-materials.mjs](places/backfill-place-materials.mjs) | Jednorazowo uzupełnia brakujące `materials: []` w dokumentach Firestore dev; domyślnie podgląd, zapis przez `--apply`. |
| [places/deploy-dev.mjs](places/deploy-dev.mjs) | Buduje frontend i publikuje Hosting dev bez lokalnej kopii danych miejsc; wymaga uprawnień operatora. |
| [places/deploy-backend-dev.mjs](places/deploy-backend-dev.mjs) | Wdraża backend dev; opcjonalnie samą funkcję API ze sprawdzonym dotychczasowym rendererem SSR. |
| [places/deploy-prod.mjs](places/deploy-prod.mjs) | Blokuje publikację produkcji do przygotowania konfiguracji fazy 5; obecnie nie wdraża niczego. |
| [places/firestore.mjs](places/firestore.mjs) | Moduł połączenia do jawnie wybranej bazy dev lub emulatora; obsługuje ADC i impersonację przez logowanie Firebase CLI. |
| [places/import.mjs](places/import.mjs) | Waliduje i importuje katalog do dev, zachowując bieżącą pozycję; domyślnie podgląd, zapis przez `--apply`. |
| [places/package-ssr.mjs](places/package-ssr.mjs) | Pakuje wygenerowany serwer Angulara do funkcji. |
| [places/prepare-hosting.mjs](places/prepare-hosting.mjs) | Tworzy ignorowaną konfigurację Firebase Hosting z bezwzględną ścieżką artefaktów builda. |
| [places/slot-ssr.mjs](places/slot-ssr.mjs) | Wybiera funkcję SSR slotu i przypina jej rewizję do Hostingu. |
| [places/slot-ssr.test.mjs](places/slot-ssr.test.mjs) | Sprawdza izolację przekierowań SSR slotów. |
| [places/snapshot.mjs](places/snapshot.mjs) | Pobiera opublikowane miejsca z Firestore do ignorowanego `.local/places.snapshot.json` jako punkt odniesienia warsztatu/operatora; build i wdrożenie aplikacji go nie używają. |
| [places/upload-assets.mjs](places/upload-assets.mjs) | Sprawdza SHA-256 i rozmiary obrazów; z `--apply` publikuje nowe, niezmienne pliki w bucket dev. |
| [privacy/consent.test.mjs](privacy/consent.test.mjs) | Testuje zgody, przechowywanie ustawień i warunki ładowania usług Google. |
| [test.mjs](test.mjs) | Uruchamia kolejno testy mapy, kontraktów, prywatności, backendu i warsztatu; zatrzymuje się po pierwszym błędzie. |
| [verify-build.mjs](verify-build.mjs) | Sprawdza statyczne strony, obecność serwera SSR, 404, noindex i zasoby; nie wczytuje danych miejsc. |

Przygotowanie mapy i wymagania Pythona: [maps/README.md](maps/README.md). `firestore.mjs` jest używany przez pozostałe skrypty i nie jest osobnym poleceniem operatora.

## Polecenia npm w root

| Polecenie | Co uruchamia |
| --- | --- |
| `npm run ng` | Angular CLI. |
| `npm start` | Lokalny serwer Angular. |
| `npm run build` | Build Angulara i SSR, konfiguracja Hosting oraz weryfikacja artefaktów; bez połączenia z bazą. |
| `npm run watch` | Build deweloperski w trybie obserwacji. |
| `npm run preview` | Build i publikacja 30-dniowego kanału Hosting `faza-1`. |
| `npm run emulate` | Lokalny emulator Hosting z konfiguracją dev. |
| `npm run deploy:dev` | Build i publikacja Hosting dev; dane miejsc są pobierane przez API z bazy podczas działania aplikacji. |
| `npm run deploy:prod` | Obecnie blokada publikacji produkcji. |
| `npm run places:import` | Walidacja i opcjonalny import katalogu do bazy dev. |
| `npm run places:snapshot` | Pobranie punktu odniesienia do pracy warsztatu/operatora; nie jest wejściem builda ani wdrożenia. |
| `npm test` | Testy mapy, kontraktów, prywatności, backendu i warsztatu. |
| `npm run test:maps` | Testy grupowania i widoczności znaczników mapy. |
| `npm run test:emulator` | Testy API i reguł w emulatorach Firestore/Storage. |
| `npm run deploy:backend:dev` | Build i publikacja wspólnych Functions, reguł Firestore/Storage i konfiguracji Auth dev; nie aktualizuje funkcji SSR slotów. |
| `npm run places:upload-assets` | Kontrola i opcjonalna publikacja obrazów. |
| `npm run check:contracts` | Ścisłe sprawdzenie typów wspólnych kontraktów bez generowania plików. |
| `npm run test:privacy` | Testy zgód i prywatności. |

## Backend i testy poza scripts/

| Plik / polecenie | Rola |
| --- | --- |
| [functions/test/contracts.test.mjs](../functions/test/contracts.test.mjs) | Zgodność i współdzielenie kontraktów danych. |
| [functions/test/public-places.test.mjs](../functions/test/public-places.test.mjs) | Projekcja opublikowanych rekordów, publiczne API, SSR i galerie. |
| [functions/test/validation.test.mjs](../functions/test/validation.test.mjs) | Walidacja danych wejściowych. |
| [functions/test/api.emulator.mjs](../functions/test/api.emulator.mjs) | Odczyt, zapis i konflikty API w emulatorze. |
| [functions/test/rules.emulator.mjs](../functions/test/rules.emulator.mjs) | Reguły dostępu Firestore i Storage w emulatorach. |
| `npm --prefix functions test` | `node --test test/*.test.mjs` |
| `npm --prefix functions run test:emulator` | `node --test test/*.emulator.mjs` |

`functions/src/` to kod uruchamianego backendu, opisany w [TECHNICAL.md](../TECHNICAL.md). Jednorazowe materiały agenta należą do `agent-context/`; wygenerowane zależności i pliki robocze nie należą do tego spisu.

## Równoległe środowiska

- `npm run deploy:dev-1`, `deploy:dev-2`, `deploy:dev-3`: build i publikacja wskazanej witryny z jej funkcją SSR przypiętą przez pinTag. Publiczne API i sitemapę obsługuje funkcja, która pobiera aktualne dane z bazy. `/deployment.json` zapisuje slot, branch, SHA i czas.
- `npm run environment -- reserve|release dev-1|dev-2|dev-3 <ID pozycji Projects>`: `scripts/places/environment.mjs` tworzy atomową blokadę w zdalnej gałęzi `env-lock/<slot>` lub zwalnia wyłącznie blokadę tego zadania. Pole Projects aktualizuje operator osobno.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.

`places:import` przyjmuje 1–400 miejsc z zachowaniem bazyliki i bieżących lokalizacji. Build nie używa fikcyjnych rekordów; fixture pozostaje wejściem testów kontraktów i emulatora.

## Warsztat badań

- `npm run research -- init|validate|export|assets|pull|push|restore|report`: `research/cli.mjs`; pełna procedura, flagi i odzyskiwanie w [warsztacie](../data/places/README.md). Operacje chmurowe i eksport domyślnie mają podgląd; zapis przez --apply.
- `research export` zachowuje niezależne materiały galerii z katalogu bazowego.
- `npm run research:view`: `research/viewer/server.mjs`, lokalny serwer tylko do odczytu 127.0.0.1:4319.
- `npm run test:research`: testy modelu, publikacji, synchronizacji, odzyskania i serwera z `research/test/`; włączone do npm test.
- `npm run test:slot-ssr`: sprawdza przypisanie funkcji SSR i zachowanie wspólnych przekierowań API dla każdego slotu; włączone do npm test.
- Foldery `research/model/`, `workspace/`, `sync/`, `publication/`, `viewer/` i `test/`: pełny spis modułów oraz ich role opisuje [README narzędzi](research/README.md). `research/cli.mjs` pozostaje wspólnym wejściem.
- `places/import-policy.mjs`: wspólna, testowana ochrona live location/version/timestamps przy imporcie. Snapshot i import akceptują wyłącznie bieżący kontrakt.

`research hydrate [--apply] [--firebase-cli]` (`research/workspace/hydrate.mjs`): podgląd/pobranie już opublikowanych zatwierdzonych obrazów dev do lokalnego warsztatu, z kontrolą SHA-256.

`research capture --material=ID --input=plik [--role=original|scan|crop|thumbnail] [--derived-from=files/...] [--transformations=opis] [--apply]` (`research/workspace/capture.mjs`): podgląd/zapis wewnętrznej kopii z deduplikacją SHA-256 i pochodzeniem, bez zmiany praw publikacyjnych.

`research/model/chronology.mjs` wylicza udokumentowane daty bez interpolacji lat oraz sprawdza zgodność źródła/datowania obrazu ze wzmianką. `capture --collection=documents|materials` wybiera rekord docelowy.

Rzeczywiste dane miejsc są w Firestore. `places:snapshot` zapisuje `.local/places.snapshot.json` wyłącznie jako punkt odniesienia dla eksportu warsztatu i narzędzi operatora; build, SSR i deploy go nie odczytują. Eksport warsztatu zapisuje `.local/research.catalog.json`. Import i uploader domyślnie używają tego eksportu; `check-live.mjs` wymaga snapshotu z lokalizacją sprawdzanego miejsca. `research export --baseline=plik.json` nadpisuje domyślną bazę warsztatu.

`start`, `watch` i build nie wymagają danych miejsc ani przygotowania katalogu. `data/places.fixture.json` jest używany wyłącznie w testach i nie trafia do aplikacji. `prepare-hosting.mjs` tworzy `.local/firebase.dev.json` z bezwzględną ścieżką artefaktów i nie modyfikuje szablonów Firebase. `preview` używa tej konfiguracji; `deploy:dev-N` tworzy `.local/firebase.dev-N.json` dla właściwej witryny.

- `npm run test:places-filter` — testuje filtrowanie miejsc po nazwie, głównym tagu i lokalizacji; jest częścią `npm test`.
