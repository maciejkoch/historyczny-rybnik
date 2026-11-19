# infra

Wersjonowana konfiguracja infrastruktury projektu. Uzupełnia pliki Firebase w root. Przed użyciem sprawdź docelowe środowisko i opis fazy 3 w `agent-context/reference/mvp-1/faza-3-infrastruktura.md`.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.

Warsztat wykorzystuje prywatny prefix research-workspace/ w istniejącym bucketcie dev; nie dodaje kluczy ani nowego publicznego dostępu. Dostęp operatora przez ADC lub istniejące logowanie Firebase CLI, przed synchronizacją sprawdzany jest IAM bucketa. Procedura: data/places/README.md.

Utworzono bazę `places-prod` i bucket `historyczny-rybnik-prod-files`. Wdrożono reguły odmawiające bezpośredniego dostępu do obu zasobów; docelowe publiczne reguły Storage z `firebase.backend.prod.json` nie zostały wdrożone. Manifest `iam.prod.json` opisuje konta i uprawnienia ograniczone do bazy produkcyjnej. Konta, role i warunkowe przypisania utworzono; operator ma uzgodnione uprawnienia do impersonacji kont build i import. Kontrola wykazała odczyt bazy produkcyjnej przez te konta i odmowę bazy dev, a konto build dev otrzymało odmowę bazy produkcyjnej. Rola importu plików jest przypisana tylko do bucketa produkcyjnego; odczyt listy prod i odmowę dev potwierdzono. Backend i końcowa kontrola aktualności kopii pozostają do wykonania.

Początkowa kopia z dev z 19 listopada 2026 obejmuje 42 dokumenty i 171 powiązanych plików; po zapisie porównano dokumenty oraz sumy SHA-256 plików. Reguły blokują bezpośredni dostęp do czasu wydania. Kopia jest jednorazowa i nie synchronizuje późniejszych zmian dev.
