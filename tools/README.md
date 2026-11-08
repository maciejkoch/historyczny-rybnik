# tools

Lokalne narzędzia właściciela, poza aplikacją i Hosting. `research-viewer/` zawiera przeglądarkę warsztatu HTML/CSS/JS. Uruchomienie: `npm run research:view`, wyłącznie http://127.0.0.1:4319. CSS Tailwind/daisyUI i moduły MapLibre pochodzą z lokalnych zależności. Czyta ignorowane dane `data/places/`, nie zapisuje do nich ani do usług. Model i procedury: [warsztat](../data/places/README.md). Serwer i kontrola dostępu: `scripts/research/viewer.mjs`.

Galerie lokalnych obrazów pokazują powiązane miejsca, źródła i ostrzeżenia o prawach. Karta miejsca prezentuje materiały przypisane do jego wzmianek.

Galeria Materiały historyczne pokazuje tylko obrazy właściwe dla datowanych verified wzmianek. Dokumenty źródłowe, kopie późniejszych opracowań i materiały nierozpoznane/innych okresów mają osobne widoki. Karta miejsca zawiera wyliczoną chronologię i oddziela wzmianki robocze.
