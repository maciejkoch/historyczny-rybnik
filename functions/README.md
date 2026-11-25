# functions

Backend Firebase Functions. `src/` zawiera API, obsługę usług i walidację; `test/` testy kontraktów, publicznych projekcji danych, walidacji, API i reguł. Własne zależności instalujemy przez `npm ci --prefix functions`. Konfigurację dev opisuje `agent-context/reference/mvp-1/faza-3-infrastruktura.md`.

`src/creator.mjs` obsługuje prywatne szkice przez callable API; `src/creator-local.mjs` jest osobnym serwerem wyłącznie lokalnym na loopback, z wyjątkiem Auth/App Check opisanym w SECURITY. Łączy się z rzeczywistą bazą dev. Uruchomienie: `npm run creator:local -- --firebase-cli`.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.

Publiczny kontrakt miejsca używa udokumentowanego zakresu, wzmianek oraz odrębnej galerii materiałów. Wzmianki wskazują materiały przez ID. Zapis pozycji nie ma wersji; ostatni zapis wygrywa. Szczegóły: `agent-context/reference/place-schema.md`.
