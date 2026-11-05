# Środowiska wdrożeniowe

- Bieżące ukończone zmiany aplikacji publikuj na stały dev poleceniem `npm run deploy:dev` i sprawdź działający adres https://historyczny-rybnik-dev.web.app/.
- Produkcja to https://historyczny.rybnik.pl/, witryna Hosting `historyczny-rybnik`. Publikuj ją tylko na osobne, wyraźne zlecenie wydania produkcyjnego, poleceniem `npm run deploy:prod`.
- Dev używa `firebase.dev.json`, produkcja `firebase.json`. Nie zamieniaj identyfikatorów witryn i nie używaj ogólnego `firebase deploy` do bieżących prac.
- Dev pozostaje noindex. Konfiguracja indeksowania produkcji jest zadaniem fazy 5.
- Obecnie rozdzielono frontend. Przed dodaniem backendu w fazie 3 rozdziel projekty i konfiguracje usług testowych oraz produkcyjnych; oddzielne witryny Hosting nie izolują bazy ani Auth.

Szczegóły: [środowiska](docs/mvp-1/srodowiska.md).
