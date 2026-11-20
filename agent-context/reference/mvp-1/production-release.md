# Przygotowanie wydania produkcyjnego

Stan: 20 listopada 2026. Dokument opisuje przygotowanie fazy 5; **nie potwierdza gotowości ani wdrożenia aplikacji produkcyjnej**. Publikacja wymaga osobnego, wyraźnego zlecenia właściciela. Obowiązujące zasady pozostają w `AGENTS.md` i `SECURITY.md`.

## Zasoby i kopia

Projekt `historyczny-rybnik` ma osobne Firestore `places-prod`, bucket `historyczny-rybnik-prod-files`, aplikację web Firebase, App Check oraz konta usług produkcji. Auth i billing są współdzielone z dev. Reguły Firestore i tymczasowe reguły Storage odmawiają bezpośredniego dostępu klientom. Docelowe reguły Storage w repozytorium dopuszczają publiczny odczyt materiałów i nie zostały jeszcze wdrożone.

Jednorazowy snapshot dev z 19 listopada, 17:34:32 UTC, zawierał 42 rekordy i 171 powiązanych plików. Kopię zweryfikowano przez porównanie pól i SHA-256 plików. Nie ma automatycznej synchronizacji z dev; przed wydaniem porównaj ponownie aktualność wszystkich danych i materiałów oraz uzgodnij ewentualne różnice. Prywatny warsztat i niepowiązane obiekty nie są częścią kopii.

Dzienny backup Firestore ma retencję 7 dni; kopia z 19 listopada 20:27 UTC ma stan READY. Storage ma 7 dni soft delete oraz niezależny prywatny bucket `historyczny-rybnik-prod-backups`. Codzienny transfer (02:00 UTC) kopiuje materiały bez nadpisywania i bez usuwania; pierwszy transfer 171 plików porównano po rozmiarze i CRC32C. Wycofane materiały nie są automatycznie usuwane z kopii, więc zużycie może rosnąć. **Odtwarzania nie testowano**. Przed wydaniem sprawdź sposób odtworzenia plików i wykonaj próbę odtworzenia Firestore na danych testowych. Nie używaj produkcyjnych danych w testach bez osobnego uzgodnienia.

## Lokalne sprawdzenia

- `npm test`, `npm run test:emulator` — testy aplikacji, API i reguł.
- `npm run test:prod:emulator` — build i pakiet produkcyjny, potem fikcyjny projekt i dane w emulatorach Functions/Firestore; sprawdza API, HTML SSR, sitemapę i 404. Wymaga Node zgodnego z repo, Javy i zależności.
- `npm run prepare:prod` — sprawdza produkcyjne HTML/SSR i generuje wyłącznie lokalne artefakty w `.local/`, bez publikacji. Polecenie `deploy:prod` pozostaje blokadą.
- Odbiór zadania na zarezerwowanym dev wymaga potwierdzenia przypisania i blokady oraz sprawdzenia rewizji, HTTPS, noindex, 404 i zmienionego zachowania. Sloty nadal korzystają ze wspólnego backendu dev.

Przed wydaniem sprawdź zgodność aktualnego main i PR, testy CI, konfigurację Auth, App Check, CORS, IAM, zasoby, dane, indeksy i oba zestawy reguł. Domena produkcji jest dodana do współdzielonego Auth; do integracji tej zmiany starsze wdrożenie konfiguracji Auth może ją usunąć. Test odmów IAM dla kont build/import potwierdzono przez impersonację; rzeczywistego przepływu produkcyjnego Auth/App Check i zapisu nie odebrano.

## Odtwarzanie i rollback

Firestore zaplanowany backup odtwarza się do **nowej** bazy w tym samym regionie, nie bezpośrednio do `places-prod`. [Instrukcja Google](https://firebase.google.com/docs/firestore/backups). Najpierw ustal odpowiedni backup, utwórz odizolowaną bazę docelową, zweryfikuj jej reguły i IAM oraz porównaj dane. Przełączenie aplikacji lub selektywne przeniesienie danych wymaga osobnego planu i ostrożności: przywracanie może nadpisać nowsze poprawki. Nie usuwaj istniejącej bazy dla odzyskania jej nazwy.

Poprzednie wydanie **Hosting live** można przywrócić w historii wydań właściwej witryny w konsoli Firebase. [Instrukcja Google](https://firebase.google.com/docs/hosting/manage-hosting-resources). Rewizje przypięte przez `pinTag` wracają z wydaniem Hosting; to nie cofa danych w Firestore, zmian IAM, reguł Storage ani niezależnych callable Functions. Dopasuj wersję API i dane do przywracanego frontendu, sprawdź publiczne odpowiedzi, App Check i uprawnienia. Nie wykonano jeszcze produkcyjnego testu rollbacku.

## Koszty i dalsze warunki

Budżet projektu wynosi 10 PLN miesięcznie, z alertami przy 50%, 90% i 100%; jest wspólny dla dev i produkcji i nie jest limitem wydatków. Stan 19 listopada: stawka katalogowa dla Warszawy 0,039 USD/GiB-mies. backupu Firestore, 0,26 USD/GiB odtworzenia i 0,023 USD/GiB-mies. Standard Storage. Stawki i rozliczenie konta należy sprawdzić ponownie. Pierwsza kopia nie zwróciła jeszcze statystyk rozmiaru, więc kosztu bazy nie potwierdzono.

Przed osobnym zleceniem publikacji pozostają: przegląd zmian i CI, weryfikacja polityk i kont, monitoring/alerty, przetestowane odtwarzanie, pełny odbiór desktop/mobile oraz logowania i uprawnień, przygotowanie i weryfikacja właściwej procedury backendu i Hostingu oraz decyzja o dokładnej zawartości wydania. Nie uznawaj samego `prepare:prod` ani stanu READY backupu za zgodę na publikację lub dowód testu odzyskiwania.
