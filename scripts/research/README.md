# Narzędzia warsztatu

`cli.mjs` jest wspólnym wejściem `npm run research -- …`. Polecenia, format danych i procedury operatora opisuje [warsztat](../../data/places/README.md).

| Folder | Odpowiedzialność i moduły |
| --- | --- |
| `model/` | `schema.mjs`: kontrakty i integralność; `chronology.mjs`: udokumentowane daty i zgodność źródła oraz epoki obrazu ze wzmianką. |
| `workspace/` | `files.mjs`: pliki, bezpieczne ścieżki i sumy; `capture.mjs`: archiwizacja prywatnych kopii; `hydrate.mjs`: pobranie wcześniej opublikowanych wariantów z kontrolą SHA-256. |
| `sync/` | `storage.mjs`: ADC/Firebase CLI i operacje bucketa dev; `sync.mjs`: porównania, rewizje, konflikty, ponawianie i odzyskiwanie. |
| `migrations/` | `legacy-catalog.mjs` i `legacy-period.mjs`: wcześniejszy katalog i kwalifikacja okresu; `import-catalog.mjs`: utworzenie warsztatu z katalogu; `workspace-v2-v3.mjs`: jawna migracja schematu 2 → 3. |
| `publication/` | `catalog.mjs`: eksport zatwierdzonych miejsc i zweryfikowanych wzmianek; `assets.mjs`: przygotowanie właściwych historycznych obrazów dopuszczonych do publikacji. |
| `viewer/` | `server.mjs`: lokalny serwer podglądu tylko do odczytu, uruchamiany przez `npm run research:view`. |
| `test/` | Fikcyjne dane i testy zachowania. `npm run test:research` wymaga nasłuchu na 127.0.0.1, bez chmury i prawdziwych poświadczeń. |

Capture zachowuje kopie niezależnie od praw publikacyjnych, współdzieli pliki po SHA-256 i rejestruje pochodzenie. Hydrate zachowuje wcześniej opublikowane obrazy jako kopie dokumentów źródłowych. Nadanie im roli materiału historycznego i powiązanie ze wzmianką wymaga osobnej oceny datowania. Żadna z tych operacji nie przyznaje zgody na publikację.
