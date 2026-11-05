# Dev i produkcja

Decyzja właściciela: 5 listopada 2026.

- Dev: https://historyczny-rybnik-dev.web.app/ — stała witryna `historyczny-rybnik-dev`, konfiguracja `firebase.dev.json`, `npm run deploy:dev`. Bieżące prace publikujemy tutaj.
- Produkcja: https://historyczny.rybnik.pl/ — witryna `historyczny-rybnik`, konfiguracja `firebase.json`, `npm run deploy:prod`. Publikacja po osobnym zleceniu wydania.
- Dotychczasowy preview fazy 1 jest tymczasowym zapisem odbioru; nie jest stałym dev.

Obie witryny używają oddzielnych wydań kanału live. Wdrożenie dev nie zmienia plików ani konfiguracji Hosting produkcji. Fragment `#mapa` jest kotwicą w dokumencie i nie wybiera środowiska. Dev nie wygasa, w przeciwieństwie do preview channels (maksymalnie 30 dni).

Dev zachowuje blokadę indeksowania. Produkcyjne indeksowanie przygotujemy z wydaniem fazy 5. Poświadczenia pozostają w lokalnym Firebase CLI, CI sprawdza tylko instalację i build. Nie wdrożono automatyzacji publikacji po pushu.

Na razie to izolacja frontendu. Przed fazą 3 należy utworzyć lub wybrać osobny projekt testowy i rozdzielić konfiguracje usług danych. Sam drugi adres Hosting nie oddziela Firestore, Auth, Functions ani Storage.

[Dokumentacja Firebase: wiele witryn](https://firebase.google.com/docs/hosting/multisites).

Wynik publikacji dev, 5 listopada 2026: `npm run deploy:dev` zakończone sukcesem (build i Hosting). Potwierdzono HTTPS `/` HTTP 200, prerender treści i noindex, logo SVG HTTP 200 oraz nieznany URL HTTP 404. Publikacja dotyczyła wyłącznie witryny `historyczny-rybnik-dev`.
