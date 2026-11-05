# Odbiór fazy 2 — mapa współczesna i plan historyczny

Data: 5 listopada 2026. Status: **wdrożona i odebrana na dev**.

Gałąź: `codex/mvp-phase-2`, oparta o `codex/mvp-phase-1` (PR #1). PR fazy 2 ma tę gałąź jako bazę, zgodnie z prośbą właściciela. Produkcja pozostaje osobnym wydaniem.

Środowisko docelowe: https://historyczny-rybnik-dev.web.app/ — witryna `historyczny-rybnik-dev`, `firebase.dev.json`, bez usług danych.

## Zakres

- Bezpośredni MapLibre 6.16.0, dynamiczny import i inicjalizacja w `afterNextRender`; SSG nie uruchamia WebGL. Worker 6.x serwowany lokalnie z artefaktu npm.
- Własny styl w palecie atlasu, OpenFreeMap jako źródło danych i glifów; widoczna atrybucja. Początkowy kadr centrum Rybnika, przybliżanie, przesuwanie klawiaturą i myszą/dotykiem, powrót do centrum.
- Plan 1932 z publicznego skanu MBC, własne dopasowanie i lokalne kafelki WebP. Przełącznik, suwak 0–100%, opis dokładności, obrys granic arkusza, przycisk pokazania całości i komunikat przy środku widoku poza zasięgiem.
- Trzy jawnie przykładowe punkty w lokalnym pliku TypeScript. Wybór przyciskiem listy lub znacznikiem, wyróżnienie oraz karta w jednym panelu; zamknięcie zachowuje kadr i przywraca fokus. Nie zaimportowano katalogu i nie ma backendu.
- Stany ładowania, błędu oraz ponowienia; lista i karty niezależne od dostępności podkładu. Komunikat bez JavaScript poza obszarem hydratacji.

[Źródła, prawa, koszty, georeferencja i odtwarzanie kafelków](mapy-zrodla.md). W szczególności: status domeny publicznej pochodzi z konkretnego rekordu biblioteki; aplikacja nie pobiera obrazów z serwera Stare Plany Miast. Ich georeferencję wykorzystano do późniejszej korekty współrzędnych (opis poniżej).

## Sprawdzenie lokalne

- Build: dwie statyczne trasy, dynamiczny osobny bundle MapLibre. Pierwsze załadowanie HTML nie inicjalizuje WebGL podczas builda.
- Walidacja stylu MapLibre: brak błędów. Wszystkie 943 kafelki istnieją i odpowiadają SHA-256 manifestu; gotowy zestaw ma około 7 MB.
- Kontrola wizualna prawdziwego podkładu i planu na desktopie oraz w widoku 390 × 844. Dodatkowy pomiar szerokości 320 px: brak poziomego przepełnienia.
- Suwak sprawdzony klawiaturą: Home → 0%, End → 100%, strzałka → zmiana o 1%. Screenshoty potwierdziły rzeczywiste odsłanianie mapy współczesnej i pełne krycie historyczne. Zmiana krycia nie zmieniła pozycji znaczników.
- Znacznik otwiera właściwą kartę, tylko jeden canvas pozostaje na stronie; wybrany znacznik ma `aria-pressed=true`. Fokus trafia do nagłówka karty. Powrót odtwarza fokus przycisku listy. Przełączenie warstwy nie tworzy mapy od nowa.
- Pokazanie całego planu ujawnia obrys zasięgu; wyjazd klawiaturą i przeciągnięciem poza arkusz pokazuje ostrzeżenie. Przycisk powrotu do zasięgu działa; mapa współczesna pozostaje dostępna poza nim.
- Kontrolowana niedostępność lokalnego stylu podkładu: komunikat błędu, działająca karta z listy, powrót mapy po przywróceniu źródła i ponowieniu. Nie wymuszano osobno wyłączenia GPU/WebGL w ustawieniach urządzenia.
- Wykryte i poprawione przed publikacją: różnica parsowania `noscript` przy hydratacji oraz kodowanie nawiasów klamrowych w adresach kafelków.

Dokładność pierwszej wersji (zastąpiona korektą opisaną niżej): pięć rozpoznawalnych budynków użyto jako kontroli dopasowania. RMS reszt 18,6 m nie jest niezależną oceną dokładności całego arkusza. Dopasowanie jest orientacyjne, szczególnie poza centrum; nie identyfikuje pewnych granic posesji. Pełny audyt czytnikiem ekranu i fizyczne urządzenia mobilne nie były częścią tej kontroli.

## Publikacja

Wdrożony kod aplikacji: `4e48143`; konfiguracja rewalidacji cache dev: `03e6611`. Publikacja przez `npm run deploy:dev`, następnie aktualizacja samych nagłówków Hosting na tym samym artefakcie. Witryna: `historyczny-rybnik-dev`, 974 pliki w wydaniu. Produkcji nie publikowano.

Wynik kontroli wdrożenia:

- HTTPS `/` zwraca HTTP 200, HTML zawiera tekst fazy 2 i jawne oznaczenie przykładowych danych.
- Nieznany adres zwraca HTTP 404. Noindex pozostaje w HTML i nagłówkach.
- Styl JSON, lokalny worker i przykładowy kafelek WebP zwracają HTTP 200; pobrany kafelek `14/9034/5549.webp` jest zgodny z SHA-256 manifestu.
- Obie warstwy działają w przeglądarce na dev; sprawdzono pełne krycie planu, 0%, wybór punktu oraz mobilny widok 390 × 844. Konsola kontrolowanej sesji dev bez błędów i ostrzeżeń.
- Poprawiono wykryty podczas odbioru cache starego HTML: odpowiedzi dev rewalidują się (`Cache-Control: no-cache`), co potwierdzono przez HTTPS. Dotychczasowe zasady cache fontów i SVG pozostają osobną regułą. Starsza karta otwarta przed tą zmianą może wymagać jednorazowego odświeżenia.
- CI dla kodu aplikacji w PR #2: npm ci i build przeszły; sam build sprawdza też styl oraz wszystkie kafelki. Końcowe commity dokumentacji nie zmieniają bundle aplikacji.

PR: https://github.com/maciejkoch/historyczny-rybnik/pull/2 — baza `codex/mvp-phase-1` z PR #1.

Otwarte usterki blokujące odbiór: brak. Ograniczenia dokładności historycznego planu i zakres kontroli urządzeń opisano wyżej.

## Korekta georeferencji po uwagach właściciela

Pierwotny odbiór nie wykrył błędu skali i przekoszenia poza centrum. Zastąpiono centralne dopasowanie transformacją projekcyjną skanu MBC do georeferencji odniesienia Starych Planów Miast. Nie publikujemy ich obrazów. 189 przestrzennie rozłożonych kontroli dopasowania oraz 68 kontroli w odłożonych komórkach. Mediana rozbieżności względem odniesienia spadła z 86,96 m do 1,67 m; percentyl 90 wynosi 3,17 m, maksimum 4,51 m. Nie jest to pomiar dokładności terenowej. [Metoda i ograniczenia](mapy-zrodla.md).

Weryfikacja korekty:

- Trzy testy offline georeferencji przeszły; dodano je również do CI.
- Build statyczny i kontrola stylu przeszły. Nowy zestaw zawiera 1045 kafelków (7 176 472 bajty); manifest obejmuje dokładnie pliki publikowane, bez starych kafelków.
- Porównano rzeczywiste wyrenderowane kafelki z odniesieniem i osiami OSM: Gliwicka, Raciborska i Mikołowska. Poprawiona nakładka jest wizualnie zgodna z odniesieniem; przebudowy ulic nadal pozostają widoczne.
- `npm run deploy:dev` opublikował poprawkę na `historyczny-rybnik-dev` (1076 plików wydania). Manifest pobrany przez HTTPS jest identyczny z lokalnym; trzy kafelki z centrum, zachodu i wschodu mają zgodne SHA-256. Nagłówek `Cache-Control: no-cache` jest obecny.
- Przeglądarka na dev: nakładka widoczna, przybliżanie działa, krycie 0%, 35% i 100% działa; brak błędów i ostrzeżeń konsoli w kontrolowanej sesji.
