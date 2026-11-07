# Dev i produkcja

Decyzja właściciela: 5 listopada 2026.

- Dev: https://historyczny-rybnik-dev.web.app/ — stała witryna `historyczny-rybnik-dev`, konfiguracja `firebase.dev.json`, `npm run deploy:dev`. Bieżące prace publikujemy tutaj.
- Produkcja: https://historyczny.rybnik.pl/ — witryna `historyczny-rybnik`, konfiguracja `firebase.json`, `npm run deploy:prod`. Publikacja po osobnym zleceniu wydania.
- Dotychczasowy preview fazy 1 jest tymczasowym zapisem odbioru; nie jest stałym dev.

Obie witryny używają oddzielnych wydań kanału live. Wdrożenie dev nie zmienia plików ani konfiguracji Hosting produkcji. Fragment `#mapa` jest kotwicą w dokumencie i nie wybiera środowiska. Dev nie wygasa, w przeciwieństwie do preview channels (maksymalnie 30 dni).

Dev zachowuje blokadę indeksowania. Produkcyjne indeksowanie przygotujemy z wydaniem fazy 5. Poświadczenia pozostają w lokalnym Firebase CLI, CI sprawdza tylko instalację i build. Nie wdrożono automatyzacji publikacji po pushu.

W fazie 3 właściciel wybrał jeden projekt ze wspólnym Google Authentication. Dev ma osobną bazę `places-dev` (Standard, Warszawa), bucket `historyczny-rybnik-dev-files`, codebase Functions `places-dev` i konta usług ograniczone do bazy dev. Konta użytkowników i billing pozostają wspólne. Ta decyzja zastępuje wcześniejszą propozycję osobnego projektu testowego. [Konfiguracja fazy 3](faza-3-infrastruktura.md).

[Dokumentacja Firebase: wiele witryn](https://firebase.google.com/docs/hosting/multisites).

Wynik publikacji dev, 5 listopada 2026: `npm run deploy:dev` zakończone sukcesem (build i Hosting). Potwierdzono HTTPS `/` HTTP 200, prerender treści i noindex, logo SVG HTTP 200 oraz nieznany URL HTTP 404. Publikacja dotyczyła wyłącznie witryny `historyczny-rybnik-dev`.

## Trzy środowiska zadań (7 listopada 2026)

| Slot | Stały adres | Polecenie | Konfiguracja |
| --- | --- | --- | --- |
| dev-1 | https://historyczny-rybnik-dev-1.web.app/ | `npm run deploy:dev-1` | `firebase.dev-1.json` |
| dev-2 | https://historyczny-rybnik-dev-2.web.app/ | `npm run deploy:dev-2` | `firebase.dev-2.json` |
| dev-3 | https://historyczny-rybnik-dev-3.web.app/ | `npm run deploy:dev-3` | `firebase.dev-3.json` |

Stały `dev` jest środowiskiem integracji ukończonych zmian. Zadania publikujemy do przypisanego slotu. Lokalny operator ustawia `PLACES_USE_FIREBASE_CLI=1`. Każdy slot ma osobny kanał live i noindex. Canonical i sitemap pozostają skierowane na integracyjny dev. Wszystkie sloty korzystają ze wspólnej bazy places-dev, bucketa historyczny-rybnik-dev-files, Functions places-dev i Google Auth. Zmiany backendu i danych wpływają na wszystkie podglądy; koordynuj je z wykonawcami aktywnych zadań.

### Rezerwacja i zwolnienie

1. Odczytaj wszystkie pozycje Projects (także rezerwacje zadań Done) i `git ls-remote origin 'refs/heads/env-lock/*'`. Slot jest wolny tylko przy braku pola i blokady. Rozbieżność wymaga wyjaśnienia.
2. Uruchom `npm run environment -- reserve dev-1 <ID pozycji Projects>`. Atomowa operacja z oczekiwaniem pustej referencji dopuszcza jednego zwycięzcę. Przegrany nie ustawia pola i nie wdraża. Nie usuwaj cudzych blokad. Gałęzie env-lock służą wyłącznie blokadom i nie podlegają merge.
3. Ustaw pole Środowisko na dev-1 i zapisz jeden blok Praca agenta: ID, branch/baza, wykonawca/sesja, slot, URL, wdrożona rewizja i PR. Ponownie odczytaj wszystkie rezerwacje i blokadę. Status In progress po sprawdzeniu powiązań. Niepewny zapis blokuje deployment.
4. Przed każdym wdrożeniem sprawdź zgodność blokady, pola, zadania i brancha. Uruchom polecenie konkretnego slotu. Sprawdź HTTPS, noindex, 404, widok i odczyt backendu; uaktualnij SHA i URL w zadaniu. Podgląd pozostaje zarezerwowany na czas review.
5. Po zakończeniu i integracji lub jawnym poleceniu zwolnienia: `npm run environment -- release dev-1 <ID pozycji Projects>`, wyczyść pole Środowisko i oznacz rezerwację w opisie jako zwolnioną. Skrypt kontroluje właściciela i usuwa tylko odczytaną rewizję blokady. Potwierdź oba odczyty. Przy częściowym błędzie slot nadal traktuj jako zajęty.

Zadanie infrastrukturalne inicjalizuje wszystkie trzy witryny; dev-1 pozostaje jego rezerwacją na czas review. Dev-2 i dev-3 są dostępne po odbiorze technicznym. Pełne interaktywne logowanie Google wymaga osobnego odbioru z użytkownikiem; obecny frontend nie zawiera jeszcze interfejsu logowania fazy 4. Konfiguracja autoryzowanych domen jest wspólna i została rozszerzona o trzy adresy.

Każdy deployment publikuje `/deployment.json` z nazwą slotu, branchem, SHA i czasem. To ułatwia weryfikację niezależności wydań; SHA opisuje commit źródłowy, wdrażaj wyłącznie czysty checkout.
