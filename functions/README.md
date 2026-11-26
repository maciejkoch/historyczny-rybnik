# functions

Backend Firebase Functions. `src/` zawiera API, obsługę usług i walidację; `test/` testy kontraktów, publicznych projekcji danych, walidacji, API i reguł. Własne zależności instalujemy przez `npm ci --prefix functions`. Konfigurację dev opisuje `agent-context/reference/mvp-1/faza-3-infrastruktura.md`.

`src/creator.mjs` obsługuje prywatne szkice przez callable API; `src/creator-local.mjs` jest osobnym serwerem wyłącznie lokalnym na loopback, z wyjątkiem od App Check opisanym w SECURITY; token Firebase Auth i rola administratora są weryfikowane. Łączy się z rzeczywistą bazą dev. Uruchomienie: `npm run creator:local -- --firebase-cli`.

API zapisuje cały szkic po walidacji, zachowując czas utworzenia i nadając czas aktualizacji; zapis nie zmienia opublikowanego miejsca. Kontrakt szkicu dopuszcza pominięcie wszystkich pól merytorycznych, także zagnieżdżonych, a ogranicza ich typy, rozmiar i dozwolone pola. Pełny kontrakt miejsca pozostaje wymaganiem publikacji. Szczegóły limitów: `agent-context/reference/place-schema.md`.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.

Publiczny kontrakt miejsca używa udokumentowanego zakresu, wzmianek oraz odrębnej galerii materiałów. Wzmianki wskazują materiały przez ID. Zapis pozycji nie ma wersji; ostatni zapis wygrywa. Szczegóły: `agent-context/reference/place-schema.md`.

Upload materiału wymaga administratora oraz App Check we wdrożonej funkcji; lokalny backend zachowuje wyjątek SECURITY. Backend przyjmuje JPEG, PNG lub WebP do 8 MiB, dekoduje obraz, tworzy WebP i miniaturę, oblicza sumy i zapisuje obie wersje do publicznej ścieżki Storage. Pliki nie są usuwane przy odłączaniu od szkicu; sprzątanie pozostałości jest osobnym zadaniem. Lokalna tożsamość operatora wymaga zapisu do bucketa dev.
