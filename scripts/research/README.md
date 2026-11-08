# Narzędzia warsztatu

`model.mjs` — ścisłe kontrakty i integralność; `workspace.mjs` — pliki, bezpieczne ścieżki, sumy; `storage.mjs` — istniejące ADC/Firebase CLI i warunkowe operacje tylko w bucketcie dev; `sync.mjs` — rewizje, porównania, odzyskiwanie i kontrola konfliktów; `legacy.mjs`/`migrate.mjs` — jawna migracja starego katalogu; `publish.mjs` — eksport zatwierdzonych treści; `assets.mjs` — sprawdzenie lokalnych kopii do publicznej publikacji; `viewer.mjs` — lokalny serwer tylko do odczytu; `cli.mjs` — polecenia operatora. `test/` zawiera fikcyjne przykłady i testy zachowania.

Polecenia, format i decyzje: [data/places/README](../../data/places/README.md). Testy `npm run test:research` obejmują nasłuch na 127.0.0.1. Nie wymagają chmury ani prawdziwych poświadczeń.

`hydrate.mjs` pobiera wyłącznie istniejące zatwierdzone warianty publiczne do lokalnego warsztatu, sprawdzając SHA-256 i rejestrując pliki.
