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
