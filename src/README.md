# src

Kod Angulara, konfiguracja i style. `app/atlas/` zawiera panele, `app/atlas-map/` mapę, `app/places/` katalog i pozycje, `app/privacy/` zgody i politykę prywatności. Współdzielone kontrakty danych są w `functions/src/contracts/`. Punkty wejścia obsługują przeglądarkę i SSG.

`places/account.ts` obsługuje Google Auth; Atlas formularz zmiany lokalizacji i roboczy znacznik mapy.

`npm run auth:admin -- show|grant|revoke UID [--apply] [--firebase-cli]` uruchamia `infra/admin-role.mjs`. Bez `--apply` grant/revoke to podgląd. Wymaga ADC lub lokalnego logowania Firebase CLI z uprawnieniem zarządzania Auth; zachowuje pozostałe custom claims. Auth i role są wspólne dla projektu. Zmiany ról wykonuje jeden operator naraz.
