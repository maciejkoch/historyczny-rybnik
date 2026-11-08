# Skrypty i polecenia

Pełny spis utrzymywanych skryptów repozytorium. Polecenia uruchamiamy z root, o ile nie podano inaczej. Przy dodaniu, usunięciu lub zmianie działania skryptu albo polecenia npm aktualizujemy ten plik w tym samym zadaniu.

## Pliki w scripts/

| Plik | Rola |
| --- | --- |
| [maps/prepare_history.py](maps/prepare_history.py) | Dopasowuje skan planu, generuje kafelki WebP, manifest i granice nakładki. |
| [maps/register_scans.py](maps/register_scans.py) | Wyznacza kandydatów punktów dopasowania na podstawie lokalnych obrazów odniesienia; narzędzie opcjonalne. |
| [maps/test_georeference.py](maps/test_georeference.py) | Testuje georeferencję, transformację odwrotną i walidację punktów. |
| [places/catalog.mjs](places/catalog.mjs) | Moduł generatora publicznego katalogu, indeksu wyszukiwania, sitemapy i przekierowań; usuwa pola niepubliczne. |
| [places/check-live.mjs](places/check-live.mjs) | Sprawdza działające API dev, App Check, Google Auth i konflikt wersji. Wykonuje rzeczywisty zapis lokalizacji testowego kościoła; wymaga tokenów w środowisku. |
| [places/deploy-dev.mjs](places/deploy-dev.mjs) | Pobiera snapshot, buduje frontend i publikuje Hosting dev; wymaga uprawnień operatora. |
| [places/deploy-prod.mjs](places/deploy-prod.mjs) | Blokuje publikację produkcji do przygotowania konfiguracji fazy 5; obecnie nie wdraża niczego. |
| [places/firestore.mjs](places/firestore.mjs) | Moduł połączenia do jawnie wybranej bazy dev lub emulatora; obsługuje ADC i impersonację przez logowanie Firebase CLI. |
| [places/import.mjs](places/import.mjs) | Waliduje i importuje katalog do dev, zachowując bieżącą pozycję; domyślnie podgląd, zapis przez `--apply`. |
| [places/prepare.mjs](places/prepare.mjs) | Waliduje wejście builda i generuje pliki katalogu; wymaga jednego zatwierdzonego kościoła. |
| [places/snapshot.mjs](places/snapshot.mjs) | Pobiera opublikowane miejsca z Firestore do ignorowanego `.local/places.snapshot.json`. |
| [places/upload-assets.mjs](places/upload-assets.mjs) | Sprawdza SHA-256 i rozmiary obrazów; z `--apply` publikuje nowe, niezmienne pliki w bucket dev. |
| [privacy/consent.test.mjs](privacy/consent.test.mjs) | Testuje zgody, przechowywanie ustawień i warunki ładowania usług Google. |
| [verify-build.mjs](verify-build.mjs) | Sprawdza artefakty SSG, treść i metadane stron, 404, noindex oraz konfigurację Hosting. |

Przygotowanie mapy i wymagania Pythona: [maps/README.md](maps/README.md). Moduły `catalog.mjs` i `firestore.mjs` są używane przez pozostałe skrypty; nie są osobnymi poleceniami operatora.

## Polecenia npm w root

| Polecenie | Co uruchamia |
| --- | --- |
| `npm run ng` | Angular CLI. |
| `npm start` | Lokalny serwer Angular. |
| `npm run build` | Przygotowanie katalogu, build Angular i weryfikacja artefaktów. |
| `npm run watch` | Build deweloperski w trybie obserwacji. |
| `npm run preview` | Build i publikacja 30-dniowego kanału Hosting `faza-1`. |
| `npm run emulate` | Lokalny emulator Hosting z konfiguracją dev. |
| `npm run deploy:dev` | Snapshot, build i publikacja Hosting dev. |
| `npm run deploy:prod` | Obecnie blokada publikacji produkcji. |
| `npm run places:prepare` | Generowanie katalogu z pliku wejściowego. |
| `npm run places:import` | Walidacja i opcjonalny import katalogu do bazy dev. |
| `npm run places:snapshot` | Pobranie snapshotu opublikowanych miejsc. |
| `npm test` | Sprawdzenie kontraktów, prywatności i testów backendu. |
| `npm run test:emulator` | Testy API i reguł w emulatorach Firestore/Storage. |
| `npm run deploy:backend:dev` | Publikacja Functions, reguł Firestore/Storage i konfiguracji Auth dev. |
| `npm run places:upload-assets` | Kontrola i opcjonalna publikacja obrazów. |
| `npm run check:contracts` | Ścisłe sprawdzenie typów wspólnych kontraktów bez generowania plików. |
| `npm run test:privacy` | Testy zgód i prywatności. |

## Backend i testy poza scripts/

| Plik / polecenie | Rola |
| --- | --- |
| [functions/test/contracts.test.mjs](../functions/test/contracts.test.mjs) | Zgodność i współdzielenie kontraktów danych. |
| [functions/test/catalog.test.mjs](../functions/test/catalog.test.mjs) | Walidacja i generowanie publicznego katalogu. |
| [functions/test/validation.test.mjs](../functions/test/validation.test.mjs) | Walidacja danych wejściowych. |
| [functions/test/api.emulator.mjs](../functions/test/api.emulator.mjs) | Odczyt, zapis i konflikty API w emulatorze. |
| [functions/test/rules.emulator.mjs](../functions/test/rules.emulator.mjs) | Reguły dostępu Firestore i Storage w emulatorach. |
| `npm --prefix functions test` | `node --test test/*.test.mjs` |
| `npm --prefix functions run test:emulator` | `node --test test/*.emulator.mjs` |

`functions/src/` to kod uruchamianego backendu, opisany w [TECHNICAL.md](../TECHNICAL.md). Jednorazowe materiały agenta należą do `agent-context/`; wygenerowane zależności i pliki robocze nie należą do tego spisu.

## Równoległe środowiska

- `npm run deploy:dev-1`, `deploy:dev-2`, `deploy:dev-3`: snapshot wspólnego backendu dev, build i publikacja wyłącznie wskazanej witryny. Konfiguracja przejmuje aktualne przekierowania wygenerowane przez build; `/deployment.json` zapisuje slot, branch, SHA i czas.
- `npm run environment -- reserve|release dev-1|dev-2|dev-3 <ID pozycji Projects>`: `scripts/places/environment.mjs` tworzy atomową blokadę w zdalnej gałęzi `env-lock/<slot>` lub zwalnia wyłącznie blokadę tego zadania. Pole Projects aktualizuje operator osobno.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.

Aktualizacja katalogu: `places:prepare` przyjmuje pełny snapshot przez `PLACES_SNAPSHOT`; `places:import` przyjmuje 1–400 miejsc z zachowaniem bazyliki i bieżących lokalizacji. `verify-build.mjs` sprawdza karty wejściowego snapshotu, także pełnego katalogu.

## Warsztat badań

- `npm run research -- init|validate|migrate|export|assets|pull|push|restore|report`: `research/cli.mjs`; pełna procedura, flagi i odzyskiwanie w [warsztacie](../data/places/README.md). Operacje chmurowe i eksport domyślnie mają podgląd; zapis przez --apply.
- `npm run research:view`: `research/viewer.mjs`, lokalny serwer tylko do odczytu 127.0.0.1:4319.
- `npm run test:research`: testy modelu, publikacji, synchronizacji, odzyskania i serwera z `research/test/`; włączone do npm test.
- Moduły `research/model.mjs`, `workspace.mjs`, `storage.mjs`, `sync.mjs`, `legacy.mjs`, `migrate.mjs`, `publish.mjs`, `assets.mjs` oraz fikcyjne `test/fixtures.mjs`: role opisane w [README narzędzi](research/README.md).
- `places/import-policy.mjs`: wspólna, testowana ochrona live location/version/timestamps przy imporcie. `places:snapshot -- --migrate-legacy` wykonuje jawne mapowanie wcześniejszego category na tags i period dla jednorazowej migracji; zwykły snapshot wymaga nowego kontraktu.

`research hydrate [--apply] [--firebase-cli]` (`research/hydrate.mjs`): podgląd/pobranie już opublikowanych zatwierdzonych obrazów dev do lokalnego warsztatu, z kontrolą SHA-256.
