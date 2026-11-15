# functions

Backend Firebase Functions. `src/` zawiera API, obsługę usług i walidację; `test/` testy kontraktów, publicznych projekcji danych, walidacji, API i reguł. Własne zależności instalujemy przez `npm ci --prefix functions`. Konfigurację dev opisuje `agent-context/reference/mvp-1/faza-3-infrastruktura.md`.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.

Callable `placesDevCreate` i `placesDevSave` tworzą oraz aktualizują pełne karty. Wymagają App Check, Google Auth i custom claim `admin: true`, walidują wspólny kontrakt miejsca, kontrolują wersję aktualizacji i kolizje slugów. Klient nie może podawać pól technicznych; ID, `published`, daty i wersje nadawane są przez backend.

Publiczny kontrakt miejsca używa tags i period; nowa wspólna ścieżka obrazów to public/materials. Prywatny warsztat nie jest przechowywany w dokumentach places. Szczegóły w data/places/README.md.

Publiczny kontrakt miejsca używa mentions z documentedDate i verification oraz materiałami o własnych datach; odrzuca materiały poza okresem wzmianki. Backend wymaga bieżącego kontraktu.

Osobne `materials` miejsca przechowuje dane galerii i najwyżej jedno zdjęcie główne; pole jest wymagane. Brak tego pola oznacza nieprawidłowy dokument.

Administrator przesyła obrazy galerii i zweryfikowanych wzmianek bezpośrednio do `public/materials/`. Reguły Storage wymagają konta Google z claimem `admin`, nowej ścieżki, dozwolonego rozszerzenia i deklarowanego MIME, rozmiaru do 10 MB; blokują nadpisanie oraz usunięcie. Formularz sprawdza sygnaturę i dekodowanie obrazu, konwertuje go do WebP i zapisuje SHA-256, prawa oraz pochodzenie w karcie. Reguły Storage nie analizują bajtów pliku, więc nie należy traktować deklarowanego MIME jako walidacji zawartości. Pliki są publicznie czytelne, a odłączenie z karty nie usuwa obiektu.

API szczegółów i renderery SSR otrzymują pełną projekcję miejsca wraz z galerią.

`public-places.mjs` odczytuje z Firestore wyłącznie opublikowane miejsca i ogranicza listę do pól potrzebnych mapie. `public-web.mjs` obsługuje publiczne API, sitemapę i SSR; `placesDevWeb` używa konta build ograniczonego do bazy dev, odpowiedzi no-store i noindex. Zapis nadal wymaga Auth i App Check.
