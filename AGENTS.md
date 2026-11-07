# Obowiązujące dokumenty i sposób pracy

- Przed przygotowaniem każdej zmiany oraz przed każdym code review przeczytaj [TECHNICAL.md](TECHNICAL.md), [CONTRIBUTING.md](CONTRIBUTING.md) i [SECURITY.md](SECURITY.md), a także README folderów objętych zakresem. Stosuj opisane tam mechanizmy i uzgodnione praktyki.
- [README.md](README.md) jest centralnym, zwięzłym opisem aktualnie dostępnych funkcji. TECHNICAL opisuje aktualny stan techniczny, CONTRIBUTING uzgodnione zasady kodu i review, a SECURITY bezwzględnie obowiązujące zasady bezpieczeństwa. Plany w `agent-context/reference/` nie oznaczają wdrożonych funkcji.
- Przy każdym zadaniu, przed jego zakończeniem, sprawdź wpływ zmian na README, TECHNICAL, CONTRIBUTING i SECURITY oraz README folderów. Potrzebne aktualizacje wykonaj w tym samym zadaniu. W podsumowaniu wskaż zaktualizowane dokumenty lub potwierdź, że sprawdzono je i aktualizacja nie była potrzebna.
- Każdy utrzymywany folder bezpośrednio pod rootem, także ukryty, ma krótki README. Wyjątek: katalogi generowane, zależności, cache i metadane narzędzi (np. `node_modules`, `dist`, `.angular`, `.firebase`, `.git`, `.local`).
- Odstępstwa od architektury i uzgodnionych praktyk omów z właścicielem przed implementacją. Zmiany zasad w CONTRIBUTING wymagają uzgodnienia; nie dostosowuj zasad samodzielnie do kodu.
- Notatki, pamięć roboczą i skrypty służące wyłącznie agentowi trzymaj w [agent-context/](agent-context/README.md). Nie zapisuj tam sekretów. Wymagane lokalizacje narzędzi pozostają na miejscu. Skrypty potrzebne do budowania i utrzymania aplikacji należą do `scripts/`.
- Dokumentację szczegółową wybieraj przez [agent-context/reference/README.md](agent-context/reference/README.md): przy mapach przeczytaj źródła i `scripts/maps/README.md`; przy wdrożeniach opis środowisk; przy planowaniu funkcji plan produktu; przy backendzie także plan techniczny i model danych.
- Podczas review sprawdź zgodność kodu z TECHNICAL.md, CONTRIBUTING.md i SECURITY.md oraz aktualność opisów. Sam brak edycji dokumentu nie jest błędem, jeśli zmiana nie wpływa na jego treść.
- Naruszenie SECURITY.md blokuje ukończenie zadania i pozytywny wynik review. Zatrzymaj zależną operację i zgłoś problem właścicielowi; nie osłabiaj zasad ani zabezpieczeń.

# Środowiska wdrożeniowe

- Zmiany zadania publikuj na przypisany dev-1, dev-2 lub dev-3 po atomowej rezerwacji; polecenia i proces w dokumentacji środowisk. Stały dev (`npm run deploy:dev`) służy integracji ukończonych zmian. Sprawdź działający adres po wdrożeniu.
- Produkcja to https://historyczny.rybnik.pl/, witryna Hosting `historyczny-rybnik`. Publikuj ją tylko na osobne, wyraźne zlecenie wydania produkcyjnego, poleceniem `npm run deploy:prod`.
- Dev używa `firebase.dev.json`, produkcja `firebase.json`. Nie zamieniaj identyfikatorów witryn i nie używaj ogólnego `firebase deploy` do bieżących prac.
- Dev pozostaje noindex. Konfiguracja indeksowania produkcji jest zadaniem fazy 5.
- Decyzja właściciela z fazy 3: jeden projekt `historyczny-rybnik`, wspólne Google Auth, ale osobna baza `places-dev`, bucket `historyczny-rybnik-dev-files`, codebase Functions `places-dev` i konta usług dev. Backend wdrażaj przez `npm run deploy:backend:dev`; nie kieruj danych dev do przyszłych zasobów produkcyjnych. Szczegóły w `agent-context/reference/mvp-1/faza-3-infrastruktura.md`.

Szczegóły: [środowiska](agent-context/reference/mvp-1/srodowiska.md).

# Spis skryptów

- [scripts/README.md](scripts/README.md) zawiera pełny spis skryptów repozytorium i poleceń npm. Przy dodaniu, usunięciu lub zmianie działania skryptu albo polecenia npm aktualizuj ten spis w tym samym zadaniu; sprawdzaj go również podczas review.

# Zadania GitHub Projects

- Skille w `.agents/skills/`: `rybnik-create-task` przygotowuje i tworzy zadania, `rybnik-start-task` rozpoczyna i wznawia pracę, a `rybnik-finish-task` scala PR, wdraża main na integracyjny dev i zamyka zadanie. [Użycie i ograniczenia](agent-context/github-projects/skille-github-projects.md).
- Odczytuj aktualne zasady i pola tablicy. Planowanych środowisk nie traktuj jako wdrożonych; brak zależności lub rezerwacji zgłoś przed zależną operacją.
