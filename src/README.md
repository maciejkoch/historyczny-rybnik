# src

Kod Angulara, konfiguracja i style. `app/atlas/` zawiera panele, `app/atlas-map/` mapę, `app/places/` katalog i pozycje, `app/privacy/` zgody i politykę prywatności. `app/layout/` udostępnia wspólny nagłówek, stopkę, mobilny toolbar oraz globalne menu z nawigacją i oddzielną sekcją prywatności. Współdzielone kontrakty danych są w `functions/src/contracts/`. Punkty wejścia obsługują przeglądarkę, strony prerenderowane i SSR kart miejsc.

`places/account.ts` obsługuje Google Auth i rolę admina. Nagłówek pokazuje konto obok hamburgera na desktopie; wspólne menu udostępnia sekcję konta i akcje logowania na obu urządzeniach. Atlas obsługuje edycję lokalizacji.

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.

Mapa grupuje pobliskie miejsca przy oddaleniu, animuje zmianę grup, pokazuje liczbę miejsc i przybliża po wyborze grupy. `app/atlas-map/group-markers.ts` zarządza znacznikami i przejściami grup, a `cluster-visibility.ts` rozstrzyga nakładanie się wyników kafelków. Wybrane miejsce zachowuje osobny znacznik.

Panel miejsc filtruje nazwę, główny tag i brak lokalizacji; wyniki na liście i mapie są spójne.

`app/about/` zawiera publiczną stronę „O nas” pod `/o-nas`, z treścią SSG i odnośnikiem w menu globalnym.

Karta miejsca pokazuje płaskie tagi i adnotację, gdy period nie potwierdza istnienia w okresie międzywojennym. Prywatny warsztat i jego przeglądarka są poza src i publicznym buildem.

`app/atlas/atlas.routes.ts` ładuje atlas jako osobny pakiet tras. Używa parametrycznej trasy kart i SSR ich HTML i współdzieloną instancję atlasu przy przejściach mapa/wyszukiwanie/miejsce; `AtlasReuse` identyfikuje te trasy przez data.atlas.

`app/places/public-places.ts` pobiera katalog przy otwarciu i szczegóły przy nawigacji; SSR przekazuje dane do hydratacji. `atlas-map/place-markers.ts` zawiera mapowanie pierwszego tagu na ikonę; symbole markerów i legendy współdzielą style globalne. Treści „Warstwy”/„Legenda” są współdzielone przez NgTemplateOutlet: desktop ma rozwijany panel z zakładkami, a mobile dwa przyciski — mały panel warstw bez zasłaniania mapy i osobny natywny dialog daisyUI z legendą. Nagłówek modalu pozostaje widoczny, przewija się wyłącznie treść; zamknięcie przywraca fokus na przycisk legendy. Znaczniki 32 px zawierają ikony 22 px i zachowują obszar dotyku 44 × 46 px.
