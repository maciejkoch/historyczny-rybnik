# functions

Backend Firebase Functions. `src/` zawiera API, obsługę usług i walidację; `test/` testy kontraktów, katalogu, walidacji, API i reguł. Własne zależności instalujemy przez `npm ci --prefix functions`. Konfigurację dev opisuje `agent-context/reference/mvp-1/faza-3-infrastruktura.md`.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.

Publiczny kontrakt miejsca używa tags i period; nowa wspólna ścieżka obrazów to public/materials. Prywatny warsztat nie jest przechowywany w dokumentach places. Szczegóły w data/places/README.md.

Publiczny kontrakt miejsca używa mentions z documentedDate i verification oraz materiałami o własnych datach; odrzuca materiały poza okresem wzmianki. Migracja dawnych references jest jawna; zwykły odczyt nie toleruje starego kontraktu.
