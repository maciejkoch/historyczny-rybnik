---
name: rybnik-finish-task
description: Zakończ zadanie Historycznego Rybnika — sprawdź i scal powiązany PR, opublikuj main na integracyjny dev, zweryfikuj wdrożenie, zwolnij środowisko i ustaw Done w GitHub Projects. Używaj na polecenie zakończenia lub scalenia zadania; sama ocena gotowości jest tylko odczytem.
---

# Zakończenie zadania

Zakres: repozytorium `maciejkoch/historyczny-rybnik`, tablica
<https://github.com/users/maciejkoch/projects/1>. Nie przeszukuj innych kont.
Wywołanie z poleceniem zakończenia obejmuje merge PR, wdrożenie main na główny
dev, aktualizację zadania i zwolnienie jego rezerwacji. Nie proś ponownie o zgodę
na te kroki. Nie obejmuje produkcji, komentarzy ani wystawiania review.
Prośba wyłącznie o sprawdzenie gotowości niczego nie zmienia.

## Ustal zadanie i stan

Przeczytaj aktualne `AGENTS.md`, `README.md`, `TECHNICAL.md`, `CONTRIBUTING.md`,
README folderów objętych zmianą oraz wskazane tam dokumenty środowisk i skilli.
Używaj aktualnych zasad, nie dawnych migawek ani planowanych zasobów.

Ustal pozycję Projects po linku lub trwałym ID oraz powiązany PR w tym repozytorium.
Przy wielu dopasowaniach wyjaśnij wybór przed mutacją. Preferuj konektor GitHub;
dla Projects użyj istniejącego `gh`, jeśli konektor nie obsługuje tablicy.
Odczytaj cały opis zadania, PR, uwagi review, statusy, aktualne ID pól i opcji,
komplet rezerwacji (wszystkie strony) oraz zdalne blokady `env-lock/*`.
Brak dostępu nie oznacza braku uwag lub rezerwacji.

Sprawdź faktyczny stan merge, aktualny head SHA i bazę PR. PR musi prowadzić do
aktualnego domyślnego brancha (`main`); innej bazy nie zmieniaj automatycznie.
Porównaj zakres z kryteriami zadania, wyniki wymaganych kontroli oraz aktualność
dokumentacji. Nie zastępuj niedziałających testów samym poleceniem zakończenia.
Nierozwiązane uwagi i niespełnione kryteria zgłoś; właściciel może wyraźnie
zaakceptować znane ograniczenie lub odłożyć zakres. Zapisz tę decyzję i ograniczenie
bez przedstawiania niewykonanego testu jako zaliczonego.

## Scal i opublikuj

1. Zapisz link PR w jednym bloku „Praca agenta” i ustaw `In review`, jeśli status
   jeszcze tego nie odzwierciedla. Nie cofaj istniejącego `Done` przy ponowieniu.
   Zachowaj pozostały opis i potwierdź każdy zapis świeżym odczytem po node ID.
2. Poczekaj na wymagane kontrole dokładnie bieżącego head SHA. Przy błędzie
   lub konflikcie napraw tylko uzgodniony zakres i ponów właściwe kontrole.
   Nie obchodź ochrony brancha ani nie używaj wymuszonego merge. Draft oznacz jako
   gotowy dopiero po potwierdzeniu gotowości. Scal z kontrolą oczekiwanego head SHA;
   jeśli head się zmienił, sprawdź nowe zmiany przed kolejną próbą.
3. Potwierdź na GitHub stan `MERGED` i merge SHA. Jeżeli PR był już scalony,
   pomiń merge i kontynuuj brakujące kroki. Zamknięty PR bez merge wymaga wyjaśnienia.
4. Pobierz aktualny `origin/main` po merge i przygotuj czysty checkout dokładnie
   tej rewizji, zawierający merge commit. Wdrażaj aktualny main, również gdy zawiera
   późniejsze scalone zmiany. Nie wdrażaj head brancha zadania ani brudnego katalogu.
   Nie resetuj, nie stashuj i nie nadpisuj cudzych zmian; użyj osobnego worktree.
   Sprawdź wymagania Node i zależności. Nie uruchamiaj równoległych buildów lub
   deploymentów korzystających z tego samego katalogu wynikowego.
5. Ustal koordynację publikacji na wspólny integracyjny dev z innymi aktywnymi
   wykonawcami; rezerwacja dev-1/2/3 nie rezerwuje głównego dev. Sprawdź zdalny main
   tuż przed publikacją. Uruchom wyłącznie udokumentowane `npm run deploy:dev`
   (lokalny operator zgodnie z dokumentacją może użyć `PLACES_USE_FIREBASE_CLI=1`).
   Nigdy `deploy:prod`, ogólny `firebase deploy` ani publikacja backendu jako
   domyślny krok kończenia. Potrzebną publikację backendu wykonuj tylko w zakresie
   zadania i zgodnie z jego dokumentacją oraz koordynacją wspólnych usług.
6. Sprawdź https://historyczny-rybnik-dev.web.app/: HTTPS, noindex, prawdziwe 404,
   zmienione zachowanie i zależne usługi. Odczytaj `/deployment.json` i potwierdź
   `environment: dev` oraz SHA checkoutu. Nie uznawaj samego sukcesu polecenia za
   odbiór. Jeżeli zdalny main zmienił się w trakcie publikacji, pobierz go i ponów
   build oraz wdrożenie najnowszej rewizji. Po dwóch kolejnych zmianach main
   przerwij ponawianie i uzgodnij kolejność z wykonawcami; nie publikuj w pętli.

## Zamknij i zwolnij

Dopiero po potwierdzonym merge i działającym wdrożeniu zapisz w zadaniu merge SHA,
**rzeczywiście wdrożone** SHA main, adres głównego dev, wyniki kontroli i ewentualne
zaakceptowane ograniczenia. Nie zastępuj historii slotu nieprawdziwym wdrożeniem.

Zwolnij wyłącznie rezerwację tego zadania według aktualnej dokumentacji:
`npm run environment -- release <dev-N> <ID pozycji Projects>`, wyczyść pole
`Środowisko` i oznacz rezerwację w opisie jako zwolnioną. Sprawdź właściciela
przed operacją i potwierdź brak blokady oraz pola po niej. Brak rezerwacji przy
ponowieniu jest poprawny, jeżeli oba źródła potwierdzają zwolnienie; cudzej blokady
nie usuwaj. Nie usuwaj witryny ani wdrożonego podglądu przy zwalnianiu slotu.

Ustaw `Done` używając aktualnego ID pozycji, pola Status i opcji Done. Potwierdź
zapis świeżym odczytem po node ID. Przy częściowym błędzie zachowaj prawdziwy
stan i kontynuuj wyłącznie brakujące kroki; nie scalaj i nie wdrażaj ponownie
bez potrzeby. Nie oznaczaj `Done`, gdy publikacja, odbiór lub zwolnienie rezerwacji
pozostają niepotwierdzone. Nie cofaj cudzych aktualizacji.

Raportuj krótko: link PR i wynik merge, link zadania i rzeczywisty status,
wdrożone SHA i adres dev, wynik weryfikacji oraz zwolnienie środowiska. Sprawdź
wpływ na README, TECHNICAL, CONTRIBUTING i README folderów; wykonaj potrzebne
aktualizacje w ramach zadania.
