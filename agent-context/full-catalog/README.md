# Pełny katalog dev

Źródło: Project-1, public/data/history/advertisers.json, 196 rekordów. Mapowanie każdego ID: mapping.json. Kopia wejścia: mvp0-catalog.json. prepare.py jest roboczym narzędziem migracji, nie poleceniem utrzymania aplikacji.

Przeniesiono wszystkie rekordy; bez duplikowania bazyliki. Lokalizacje wielu siedzib i kandydackie pozostają nieustalone. Datowanie historyczne nie jest wyprowadzane z daty publikacji; opis okresu zachowano w notatkach.

Obrazy MVP.0 nie mają kompletnych metadanych praw wymaganych przez obecny model. Nie publikujemy ich kopii; zachowujemy odnośniki do źródeł. Zdjęcie bazyliki zachowuje wcześniej zatwierdzone pochodzenie. Weryfikacja praw do pozostałych obrazów pozostaje otwarta.

Statusy lokalizacji nowych rekordów: {'unknown': 159, 'building': 21, 'existing': 1, 'approximate': 15}.

Sprawdzenia: walidacja 196 rekordów, npm test (5 testów prywatności, 17 backendu/kontraktów), build 200 tras SSG — PASS. Ostrzeżenie początkowego pakietu 766,82 kB (próg 500 kB). Kopia przed importem: ignorowany .local/places.before-full-catalog.json. SECURITY i CONTRIBUTING sprawdzone, bez zmian zasad. Odbiór wdrożenia jeszcze otwarty.
