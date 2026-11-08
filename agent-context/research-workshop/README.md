# Warsztat badań — odbiór implementacji

8 listopada 2026. Baza gałęzi `codex/research-workshop`: aktualny przy starcie `origin/main` 488301d60a3f5b6c73fca5589c48af1acf1271ef (PR #15 scalony). Osobny worktree `/private/tmp/rybnik-research-workshop`; zastane zmiany pierwotnego checkoutu zachowane. Dev-1 atomowo zarezerwowany dla pozycji PVTI_lAHOAP5vmM4BqYSzzhG6otg, bez publikacji przeglądarki lokalnej.

## Rezultat i sprawdzenia

- Skill projektowy `rybnik-research-places` i kontrakty prywatnego warsztatu. Walidator skilla PASS. Przegląd scenariuszy: wzmianki 1890/1950, późna publikacja opisująca 1932, brak automatycznego założenia ciągłości, A/B/kandydat, łańcuch A → B → C, brak niezależności cytowania, materiały o nieustalonych prawach i krótki raport.
- `npm test`: PASS — kontrakty TypeScript, 5 testów prywatności, 17 backendu i 8 warsztatu. Warsztat obejmuje datowanie, integralność, prawa, jawny eksport, zachowanie live fields, konflikt/retry/restore/usunięcia, utratę potwierdzenia head, symlinki, ścieżki, Host/Origin i tylko odczyt.
- `npm run test:emulator`: 9 PASS, także odmowa odczytu/zapisu prywatnego prefixu dla anonimowego i administratora oraz odczyt wspólnego obrazu public/materials i odmowa zapisu klienta.
- Build pełnego snapshotu: 200 tras, mapy/404/noindex/prywatność PASS. Istnieje ostrzeżenie budżetu początkowego pakietu (~918 kB wobec 500 kB dla pełnego katalogu); nie jest raportowane jako błąd kompilacji ani ukrywane zwiększeniem limitu.
- Migracja dev: 196 rekordów category → tags/period; porównanie zachowania ID/location/locationVersion/createdAt/updatedAt PASS. Backup przed migracją w ignorowanym `.local/places.before-research-*.json`. Ścisły snapshot po migracji działa. Wspólny backend i reguły dev wdrożone przez deploy:backend:dev, produkcja bez zmian.
- Prywatny warsztat: 36 źródeł, 281 materiałów, 196 miejsc unverified w out-of-period, 7 tagów; żadne miejsce nie otrzymało automatycznej zgody publikacji. To przeniesienie istniejących danych, nie wykonanie badań ani rozstrzygnięcie praw. Zachowano wejściowy katalog i rejestr praw jako kopie odtwarzające migrację. Brak historyDate w dotychczasowym katalogu nie został zastąpiony publicationDate.
- 122 już zatwierdzone publiczne warianty pobrane do files/imported; każda suma zgodna z istniejącymi dokumentami. Nie pobierano niepotwierdzonych materiałów.
- Prywatne Storage: sprawdzony IAM i brak publicznych domyślnych ACL, nie dodano kluczy/pobierania tokenowego ani uprawnień. Wysłanie i pobranie do świeżego katalogu: identyczne 615 plików (ścieżki i SHA-256). Rewizje są niezmienne, head warunkowy po generacji. Anonimowy odczyt rzeczywistego head: GCS HTTP 401, Firebase HTTP 403. Testy konfliktu/usunięcia/awarii/odzyskania wykonano na fikcyjnym store, bez destrukcyjnych testów archiwum chmurowego.
- Odbiór IAB lokalnej przeglądarki: lista i wyszukiwanie Wilczyńskiego, szczegóły z dowodami i sprzecznościami, materiały i lokalny skan, mapa 1932 z punktami. Odrębny fikcyjny zbiór pokazuje graf A → B → C i kandydata. `create-demo.mjs` odtwarza tylko fikcyjną próbkę poza warsztatem. Nie przeprowadzono kampanii szukania nowych faktów historycznych.

## Dokumentacja i granice

Zaktualizowano README, TECHNICAL, AGENTS, opis modelu referencyjnego, README data/functions/src/infra/resources/.agents, spis scripts i instrukcje warsztatu. Dodano README tools i scripts/research. CONTRIBUTING i SECURITY sprawdzone, aktualizacja zasad nie była potrzebna. Publiczne place pozostają projekcją do odczytu; normalized źródła i materiały należą do prywatnego warsztatu. Publiczny UX filtrów pozostaje w osobnym zadaniu.

Do review przekazywany jest PR i zarezerwowany dev-1. Nie scalać i nie oznaczać Done bez osobnego polecenia. Lokalna przeglądarka nie jest częścią Hosting, nie ma logowania ani zapisów przez interfejs. Nie wykonano produkcyjnego wydania.

## Odbiór dev-1

Podgląd https://historyczny-rybnik-dev-1.web.app/ udostępniono z rewizji 105e6f222dcc7ce0e8bf36c67be016f9063a2fd5; deployment.json potwierdził slot i SHA. HTTP 200/noindex dla mapy i karty bazyliki; rzeczywiste 404 dla nieznanej trasy, prywatnego prefixu i tools/research-viewer. IAB: karta pokazuje tag i adnotację okresu, mapa i wycinek działają. CI build/test-backend PASS. Następna poprawka kontraktu własnych skanów dopuszcza brak adresów/autorów i lokalny materiał dowodu praw; 8 testów warsztatu i ponowny build PASS. Aktualne wdrożone SHA jest zapisane w Projects i deployment.json.

## Korekta po uwadze właściciela o Sztandarze z 1938

Początkowa migracja zbyt mechanicznie wymagała historicalDate. Poprawiono ją: datowane współczesne ogłoszenia i spisy adresowe dowodzą działalności w czasie wydania, przy zachowaniu niepewności identyfikacji. Nowy test odróżnia reklamę 1938 od retrospektywnego artykułu i ogłoszenia 1950. Skrypt correct-period.mjs sprawdza zgodność oryginalnych referencji z ustaleniami i koryguje kwalifikację bez utraty ID/plików. Wynik: 128 miejsc confirmed, 68 oczekujących na ocenę innych wzmianek. Brak oceny nie jest stwierdzeniem braku dowodów.
