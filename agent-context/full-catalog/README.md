# Pełny katalog dev

Źródło: Project-1, public/data/history/advertisers.json, 196 rekordów. Mapowanie każdego ID: mapping.json. Kopia wejścia: mvp0-catalog.json. prepare.py jest roboczym narzędziem migracji, nie poleceniem utrzymania aplikacji.

Przeniesiono wszystkie rekordy; bez duplikowania bazyliki. Lokalizacje wielu siedzib i kandydackie pozostają nieustalone. Datowanie historyczne nie jest wyprowadzane z daty publikacji; opis okresu zachowano w notatkach.

Obrazy MVP.0 nie mają kompletnych metadanych praw wymaganych przez obecny model. Nie publikujemy ich kopii; zachowujemy odnośniki do źródeł. Zdjęcie bazyliki zachowuje wcześniej zatwierdzone pochodzenie. Weryfikacja praw do pozostałych obrazów pozostaje otwarta.

Statusy lokalizacji nowych rekordów: {'unknown': 159, 'building': 21, 'existing': 1, 'approximate': 15}.

Sprawdzenia: walidacja 196 rekordów, npm test (5 testów prywatności, 17 backendu/kontraktów), build 200 tras SSG — PASS. Ostrzeżenie początkowego pakietu 766,82 kB (próg 500 kB). Kopia przed importem: ignorowany .local/places.before-full-catalog.json. SECURITY i CONTRIBUTING sprawdzone, bez zmian zasad. Odbiór wdrożenia jeszcze otwarty.

## Odbiór dev — 7 listopada 2026

Opublikowano dev-1, rewizja 0f75acc3e42e757b04293b3f6599e0e2176aa698. Deployment.json potwierdza slot i SHA. HTTPS 200 dla wyszukiwarki i nowej karty, noindex oraz rzeczywiste 404 — PASS. Przeglądarka IAB: 196 wyników, wyszukiwanie Wilczynski → Jerzy Wilczyński, otwarcie karty, mapa ze znacznikami oraz jawny brak pozycji miejsca kandydackiego — PASS. Snapshot po imporcie potwierdza 196 rekordów i niezmienione location, locationVersion, createdAt, updatedAt istniejącej bazyliki.

Ograniczenia: nie odebrano odczytu bieżącego API po zgodzie Google ani pełnego scenariusza mobilnego; obrazy MVP.0 pozostają bez kopii do czasu potwierdzenia praw. Nie uznawać pełnego odbioru fazy za zakończony. Produkcja bez zmian. Podgląd pozostaje zarezerwowany do review.

## Grupowanie punktów — rozszerzenie zlecone przez właściciela

Wdrożono na dev-1 a1ffdfb6. Build 200 tras i sprawdzenia SSG/map PASS. IAB: widoczne grupy z licznikami, dwukrotne rozwijanie grupy przez przybliżenie, włączenie planu historycznego i wybór pojedynczego Starego Ratusza z otwarciem karty oraz osobnym zaznaczonym markerem — PASS. README, TECHNICAL i src/README zaktualizowane; CONTRIBUTING i SECURITY bez potrzeby zmian. Bez zmian danych/backendu. Ostrzeżenie rozmiaru pakietu pozostaje (~769 kB).
