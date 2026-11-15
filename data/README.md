# data

Repozytorium przechowuje wyłącznie `places.fixture.json`: w pełni fikcyjny rekord miejsca, wzmianek, praw i metadanych ilustracji do testów kontraktów oraz emulatora. Build aplikacji nie wczytuje fixture. Nie opisuje rzeczywistego miejsca i nie służy do importu ani wdrażania danych dev. Fikcyjne ścieżki obrazów służą walidacji kontraktu; nie wskazują opublikowanych plików.

Rzeczywisty katalog i obrazy pozostają poza Git:

- `places/` — prywatny warsztat synchronizowany ze Storage; wersjonowany jest tylko jego [README](places/README.md).
- `.local/places.snapshot.json` w root repo — aktualny odczyt Firestore jako baza eksportu warsztatu i narzędzi operatora; build i wdrożenie aplikacji nie używają kopii.
- `.local/research.catalog.json` — zatwierdzony eksport warsztatu do importu.
- `.local/places.catalog.json` — zachowana lokalna kopia wcześniejszego pełnego katalogu; nie jest domyślnym wejściem builda.
- `.local/source-rights.json` — zachowany indeks dawnych decyzji praw do jawnej migracji; jego kopia jest w prywatnym warsztacie jako files/legacy-source-rights.json. Nowe decyzje należą do warsztatu.

Build nie generuje modułu z danymi miejsc. Publiczne API, SSR kart, sitemapę i przekierowania obsługuje backend czytający Firestore; build oraz CI nie potrzebują kopii danych ani dostępu do chmury. Lokalna kopia `.local/places.catalog.json` pozostaje nieużywanym materiałem archiwalnym i nie jest wejściem aplikacji. Historia Git nie jest przepisywana.
