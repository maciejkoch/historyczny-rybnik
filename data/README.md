# data

Repozytorium przechowuje wyłącznie `places.fixture.json`: w pełni fikcyjny rekord miejsca, wzmianek, praw i metadanych ilustracji do testów oraz offline builda CI. Nie opisuje rzeczywistego miejsca i nie służy do importu ani wdrażania danych dev. Fikcyjne ścieżki obrazów służą walidacji kontraktu; nie wskazują opublikowanych plików.

Rzeczywisty katalog i obrazy pozostają poza Git:

- `places/` — prywatny warsztat synchronizowany ze Storage; wersjonowany jest tylko jego [README](places/README.md).
- `.local/places.snapshot.json` w root repo — aktualny odczyt Firestore do builda dev i baza eksportu.
- `.local/research.catalog.json` — zatwierdzony eksport warsztatu do importu.
- `.local/places.catalog.json` — zachowana lokalna kopia wcześniejszego pełnego katalogu; nie jest domyślnym wejściem builda.
- `.local/source-rights.json` — zachowany indeks dawnych decyzji praw do jawnej migracji; jego kopia jest w prywatnym warsztacie jako files/legacy-source-rights.json. Nowe decyzje należą do warsztatu.

Wygenerowany moduł katalogu, indeks wyszukiwania, sitemap i konfiguracje Hosting z przekierowaniami również są ignorowane przez Git. Build dev pobiera świeży snapshot; CI nie potrzebuje dostępu do danych ani chmury. Historia Git nie jest przepisywana.
