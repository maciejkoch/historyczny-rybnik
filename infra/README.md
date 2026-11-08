# infra

Wersjonowana konfiguracja infrastruktury projektu. Uzupełnia pliki Firebase w root. Przed użyciem sprawdź docelowe środowisko i opis fazy 3 w `agent-context/reference/mvp-1/faza-3-infrastruktura.md`.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.

Warsztat wykorzystuje prywatny prefix research-workspace/ w istniejącym bucketcie dev; nie dodaje kluczy ani nowego publicznego dostępu. Dostęp operatora przez ADC lub istniejące logowanie Firebase CLI, przed synchronizacją sprawdzany jest IAM bucketa. Procedura: data/places/README.md.
