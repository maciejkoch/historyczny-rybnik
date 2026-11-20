# Przygotowanie wydania produkcyjnego

Stan: 20 listopada 2026. Wydanie `5f1f9476fda0674cddb5d3ee8fb0fa7f9e23c9e8` opublikowano 20 listopada 2026 pod `https://historyczny.rybnik.pl/`; ręczny odbiór logowania i próby odtworzenia pozostają otwarte. Publikacja wymaga osobnego, wyraźnego zlecenia właściciela. Obowiązujące zasady pozostają w `AGENTS.md` i `SECURITY.md`.

## Monitoring dostępności

Google Cloud Monitoring sprawdza HTTPS `https://historyczny.rybnik.pl/` co 5 minut, z weryfikacją certyfikatu i kodu 2xx. Kanał e-mail właściciela jest skonfigurowany; reguła `Historyczny Rybnik — niedostępność produkcji` jest włączona. Należy sprawdzić dostarczenie powiadomienia bez zakłócania produkcji. Alert wymaga niepowodzeń z co najmniej dwóch punktów kontroli przez 5 minut. Sama konfiguracja nie potwierdza skutecznego dostarczenia e-maila.

## Zasoby i kopia

Projekt `historyczny-rybnik` ma osobne Firestore `places-prod`, bucket `historyczny-rybnik-prod-files`, aplikację web Firebase, App Check oraz konta usług produkcji. Auth i billing są współdzielone z dev. Reguły Firestore odmawiają bezpośredniego dostępu klientom; wdrożone reguły Storage dopuszczają publiczny odczyt materiałów i blokują zapisy klientów.

Jednorazowy snapshot dev z 19 listopada, 17:34:32 UTC, zawierał 42 rekordy i 171 powiązanych plików. Kopię zweryfikowano przez porównanie pól i SHA-256 plików. Nie ma automatycznej synchronizacji z dev; przed wydaniem porównaj ponownie aktualność wszystkich danych i materiałów oraz uzgodnij ewentualne różnice. Prywatny warsztat i niepowiązane obiekty nie są częścią kopii.

Dzienny backup Firestore ma retencję 7 dni; kopia z 19 listopada 20:27 UTC ma stan READY. Storage ma 7 dni soft delete oraz niezależny prywatny bucket `historyczny-rybnik-prod-backups`. Codzienny transfer (02:00 UTC) kopiuje materiały bez nadpisywania i bez usuwania; pierwszy transfer 171 plików porównano po rozmiarze i CRC32C. Wycofane materiały nie są automatycznie usuwane z kopii, więc zużycie może rosnąć. **Odtwarzania nie testowano**. Właściciel zdecydował o wykonaniu prób odtworzenia po wydaniu; skuteczność odzyskiwania do tego czasu nie jest potwierdzona. Nie używaj produkcyjnych danych w testach bez osobnego uzgodnienia.

## Lokalne sprawdzenia

- `npm test`, `npm run test:emulator` — testy aplikacji, API i reguł.
- `npm run test:prod:emulator` — build i pakiet produkcyjny, potem fikcyjny projekt i dane w emulatorach Functions/Firestore; sprawdza API, HTML SSR, sitemapę i 404. Wymaga Node zgodnego z repo, Javy i zależności.
- `npm run prepare:prod` — sprawdza produkcyjne HTML/SSR i generuje wyłącznie lokalne artefakty w `.local/`, bez publikacji. Osobne `npm run deploy:prod` wymaga czystego checkoutu i publikuje reguły, funkcje oraz Hosting produkcji.
- Odbiór zadania na zarezerwowanym dev wymaga potwierdzenia przypisania i blokady oraz sprawdzenia rewizji, HTTPS, noindex, 404 i zmienionego zachowania. Sloty nadal korzystają ze wspólnego backendu dev.

Przed wydaniem sprawdź zgodność aktualnego main i PR, testy CI, konfigurację Auth, App Check, CORS, IAM, zasoby, dane, indeksy i oba zestawy reguł. Domena produkcji jest dodana do współdzielonego Auth; do integracji tej zmiany starsze wdrożenie konfiguracji Auth może ją usunąć. Test odmów IAM dla kont build/import potwierdzono przez impersonację; rzeczywistego przepływu produkcyjnego Auth/App Check i zapisu nie odebrano.

## Odtwarzanie i rollback

Firestore zaplanowany backup odtwarza się do **nowej** bazy w tym samym regionie, nie bezpośrednio do `places-prod`. [Instrukcja Google](https://firebase.google.com/docs/firestore/backups). Najpierw ustal odpowiedni backup, utwórz odizolowaną bazę docelową, zweryfikuj jej reguły i IAM oraz porównaj dane. Przełączenie aplikacji lub selektywne przeniesienie danych wymaga osobnego planu i ostrożności: przywracanie może nadpisać nowsze poprawki. Nie usuwaj istniejącej bazy dla odzyskania jej nazwy.

Odzyskanie materiału: porównaj ścieżkę i sumę oczekiwaną w zatwierdzonym rekordzie z obiektem w prywatnym bucketcie kopii. W konsoli Cloud Storage skopiuj wyłącznie wskazany obiekt do `historyczny-rybnik-prod-files`, zachowując tę samą ścieżkę i typ zawartości; jeśli obiekt docelowy istnieje, nie nadpisuj go bez osobnego rozstrzygnięcia. Porównaj SHA-256 odzyskanego pliku i sprawdź jego dostępność zgodnie z aktualnymi regułami. Dostęp i zapis operatora do obu bucketów wymagają odpowiednich uprawnień IAM. Zmiany produkcji i próba odzyskiwania wymagają właściwego zlecenia. Nie przełączaj produkcyjnej ścieżki Storage na bucket kopii.

Poprzednie wydanie **Hosting live** można przywrócić w historii wydań właściwej witryny w konsoli Firebase. [Instrukcja Google](https://firebase.google.com/docs/hosting/manage-hosting-resources). Trasa kart miejsc `/miejsca/**` jest przypięta przez `pinTag` i wraca z wydaniem Hosting; API katalogu i sitemap korzystają z bieżącej wersji funkcji. Przywrócenie nie cofa danych w Firestore, zmian IAM, reguł Storage ani niezależnych callable Functions. Dopasuj wersję API i dane do przywracanego frontendu, sprawdź publiczne odpowiedzi, App Check i uprawnienia. Nie wykonano jeszcze produkcyjnego testu rollbacku.

## Koszty i dalsze warunki

Budżet projektu wynosi 10 PLN miesięcznie, z alertami przy 50%, 90% i 100%; jest wspólny dla dev i produkcji i nie jest limitem wydatków. Stan 19 listopada: stawka katalogowa dla Warszawy 0,039 USD/GiB-mies. backupu Firestore, 0,26 USD/GiB odtworzenia i 0,023 USD/GiB-mies. Standard Storage. Stawki i rozliczenie konta należy sprawdzić ponownie. Pierwsza kopia nie zwróciła jeszcze statystyk rozmiaru, więc kosztu bazy nie potwierdzono.

Przed publikacją sprawdź zmiany, konfigurację, uprawnienia oraz aktualność danych. Po wydaniu sprawdź dostarczenie alertu. Właściciel zdecydował o wykonaniu prób odtworzenia i ręcznym odbiorze logowania po wydaniu. Nie uznawaj samego `prepare:prod` ani stanu READY backupu za zgodę na publikację lub dowód testu odzyskiwania.

## Kolejne wydanie — 20 listopada 2026

Wdrożono `5ed2a7c381bf5b2e5ce05118311c2c7d286bf87b`, zawierający zmiany z main dotyczące mapy i filtrów oraz osobną zgodę i podstawowy pomiar Analytics. Search Console zweryfikowało własność plikiem HTML i przetworzyło `/sitemap.xml`, wykrywając 37 stron. Bez zgody na statystyki skrypt Analytics nie jest ładowany. Odbiór zdarzeń w GA4 pozostaje do potwierdzenia.
