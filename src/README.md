# src

Kod Angulara, konfiguracja i style. `app/atlas/` zawiera panele, `app/atlas-map/` mapę, `app/places/` katalog i pozycje, `app/privacy/` zgody i politykę prywatności. `app/layout/` udostępnia wspólny nagłówek, stopkę, mobilny toolbar oraz globalne menu z nawigacją i oddzielną sekcją prywatności. Współdzielone kontrakty danych są w `functions/src/contracts/`. Punkty wejścia obsługują przeglądarkę i SSG.

`places/account.ts` obsługuje Google Auth i rolę admina. Nagłówek pokazuje konto obok hamburgera na desktopie; wspólne menu udostępnia sekcję konta i akcje logowania na obu urządzeniach. Atlas obsługuje edycję lokalizacji.

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.

Mapa grupuje pobliskie miejsca przy oddaleniu, z liczbą miejsc i przybliżaniem po wyborze grupy. Wybrane miejsce zachowuje osobny znacznik.
