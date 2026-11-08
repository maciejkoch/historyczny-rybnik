# tools

Lokalne narzędzia właściciela, poza aplikacją i Hosting. `research-viewer/` zawiera przeglądarkę warsztatu HTML/CSS/JS. Uruchomienie: `npm run research:view`, wyłącznie http://127.0.0.1:4319. CSS Tailwind/daisyUI i moduły MapLibre pochodzą z lokalnych zależności. Czyta ignorowane dane `data/places/`, nie zapisuje do nich ani do usług. Model i procedury: [warsztat](../data/places/README.md). Serwer i kontrola dostępu: `scripts/research/viewer.mjs`.

Widok Materiały to galeria lokalnych obrazów, z powiązanymi miejscami, źródłami i ostrzeżeniami o prawach. Te same obrazy są dostępne na karcie miejsca.
