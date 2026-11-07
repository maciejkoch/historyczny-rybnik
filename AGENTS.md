# Obowiązujące dokumenty i sposób pracy

- Przed przygotowaniem każdej zmiany oraz przed każdym code review przeczytaj [TECHNICAL.md](TECHNICAL.md) i [CONTRIBUTING.md](CONTRIBUTING.md), a także README folderów objętych zakresem. Stosuj opisane tam mechanizmy i uzgodnione praktyki.
- [README.md](README.md) jest centralnym, zwięzłym opisem aktualnie dostępnych funkcji. TECHNICAL opisuje aktualny stan techniczny, CONTRIBUTING uzgodnione zasady kodu i review. Plany w `docs/` nie oznaczają wdrożonych funkcji.
- Przy każdym zadaniu, przed jego zakończeniem, sprawdź wpływ zmian na te trzy dokumenty i README folderów. Potrzebne aktualizacje wykonaj w tym samym zadaniu. W podsumowaniu wskaż zaktualizowane dokumenty lub potwierdź, że sprawdzono je i aktualizacja nie była potrzebna.
- Każdy utrzymywany folder bezpośrednio pod rootem, także ukryty, ma krótki README. Wyjątek: katalogi generowane, zależności, cache i metadane narzędzi (np. `node_modules`, `dist`, `.angular`, `.firebase`, `.git`).
- Odstępstwa od architektury i uzgodnionych praktyk omów z właścicielem przed implementacją. Zmiany zasad w CONTRIBUTING wymagają uzgodnienia; nie dostosowuj zasad samodzielnie do kodu.
- Notatki, pamięć roboczą i skrypty służące wyłącznie agentowi trzymaj w [agent-context/](agent-context/README.md). Nie zapisuj tam sekretów. Wymagane lokalizacje narzędzi pozostają na miejscu. Skrypty potrzebne do budowania i utrzymania aplikacji należą do `scripts/`.
- Dokumentację szczegółową wybieraj przez [docs/README.md](docs/README.md): przy mapach przeczytaj źródła i `scripts/maps/README.md`; przy wdrożeniach opis środowisk; przy planowaniu funkcji plan produktu; przy backendzie także plan techniczny i model danych.
- Podczas review sprawdź zgodność kodu z oboma obowiązującymi dokumentami i aktualność opisów. Sam brak edycji dokumentu nie jest błędem, jeśli zmiana nie wpływa na jego treść.

# Środowiska wdrożeniowe

- Bieżące ukończone zmiany aplikacji publikuj na stały dev poleceniem `npm run deploy:dev` i sprawdź działający adres https://historyczny-rybnik-dev.web.app/.
- Produkcja to https://historyczny.rybnik.pl/, witryna Hosting `historyczny-rybnik`. Publikuj ją tylko na osobne, wyraźne zlecenie wydania produkcyjnego, poleceniem `npm run deploy:prod`.
- Dev używa `firebase.dev.json`, produkcja `firebase.json`. Nie zamieniaj identyfikatorów witryn i nie używaj ogólnego `firebase deploy` do bieżących prac.
- Dev pozostaje noindex. Konfiguracja indeksowania produkcji jest zadaniem fazy 5.
- Decyzja właściciela z fazy 3: jeden projekt `historyczny-rybnik`, wspólne Google Auth, ale osobna baza `places-dev`, bucket `historyczny-rybnik-dev-files`, codebase Functions `places-dev` i konta usług dev. Backend wdrażaj przez `npm run deploy:backend:dev`; nie kieruj danych dev do przyszłych zasobów produkcyjnych. Szczegóły w `docs/mvp-1/faza-3-infrastruktura.md`.

Szczegóły: [środowiska](docs/mvp-1/srodowiska.md).
