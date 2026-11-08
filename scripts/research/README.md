# Narzędzia warsztatu

`model.mjs` — ścisłe kontrakty i integralność; `workspace.mjs` — pliki, bezpieczne ścieżki, sumy; `storage.mjs` — istniejące ADC/Firebase CLI i warunkowe operacje tylko w bucketcie dev; `sync.mjs` — rewizje, porównania, odzyskiwanie i kontrola konfliktów; `legacy.mjs`/`migrate.mjs` — jawna migracja starego katalogu; `publish.mjs` — eksport zatwierdzonych treści; `assets.mjs` — sprawdzenie lokalnych kopii do publicznej publikacji; `viewer.mjs` — lokalny serwer tylko do odczytu; `cli.mjs` — polecenia operatora. `test/` zawiera fikcyjne przykłady i testy zachowania.

Polecenia, format i decyzje: [data/places/README](../../data/places/README.md). Testy `npm run test:research` obejmują nasłuch na 127.0.0.1. Nie wymagają chmury ani prawdziwych poświadczeń.

`hydrate.mjs` pobiera wyłącznie istniejące zatwierdzone warianty publiczne do lokalnego warsztatu, sprawdzając SHA-256 i rejestrując pliki.

`capture.mjs` zapisuje wewnętrzne kopie PDF/obrazów niezależnie od praw publikacyjnych, współdzieli pliki po SHA-256 i rejestruje pochodzenie. Nie przyznaje zgód publikacji.

Schemat 3: documents, mentions i odrębne materiały wizualne. chronology.mjs wylicza daty i sprawdza zgodność epoki oraz źródła; restructure.mjs wykonuje jawną migrację 2 → 3. Eksport czyta tylko verified wzmianki i właściwe historyczne materiały.

`hydrate` zachowuje wcześniej opublikowane pliki jako kopie dokumentów źródłowych. Nadanie im roli materiału historycznego i powiązanie ze wzmianką wymaga osobnej oceny datowania.
