# Środowiska wdrożeniowe

- Bieżące ukończone zmiany aplikacji publikuj na stały dev poleceniem `npm run deploy:dev` i sprawdź działający adres https://historyczny-rybnik-dev.web.app/.
- Produkcja to https://historyczny.rybnik.pl/, witryna Hosting `historyczny-rybnik`. Publikuj ją tylko na osobne, wyraźne zlecenie wydania produkcyjnego, poleceniem `npm run deploy:prod`.
- Dev używa `firebase.dev.json`, produkcja `firebase.json`. Nie zamieniaj identyfikatorów witryn i nie używaj ogólnego `firebase deploy` do bieżących prac.
- Dev pozostaje noindex. Konfiguracja indeksowania produkcji jest zadaniem fazy 5.
- Decyzja właściciela z fazy 3: jeden projekt `historyczny-rybnik`, wspólne Google Auth, ale osobna baza `places-dev`, bucket `historyczny-rybnik-dev-files`, codebase Functions `places-dev` i konta usług dev. Backend wdrażaj przez `npm run deploy:backend:dev`; nie kieruj danych dev do przyszłych zasobów produkcyjnych. Szczegóły w `docs/mvp-1/faza-3-infrastruktura.md`.

Szczegóły: [środowiska](docs/mvp-1/srodowiska.md).
