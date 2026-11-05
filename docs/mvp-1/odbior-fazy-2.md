# Odbiór fazy 2 — mapa współczesna i plan historyczny

Data: 5 listopada 2026. Status: kontrola przed publikacją dev.

Gałąź: `codex/mvp-phase-2`, oparta o `codex/mvp-phase-1` (PR #1). PR fazy 2 ma tę gałąź jako bazę, zgodnie z prośbą właściciela. Produkcja pozostaje osobnym wydaniem.

Środowisko docelowe: https://historyczny-rybnik-dev.web.app/ — witryna `historyczny-rybnik-dev`, `firebase.dev.json`, bez usług danych.

## Zakres

- Bezpośredni MapLibre 6.16.0, dynamiczny import i inicjalizacja w `afterNextRender`; SSG nie uruchamia WebGL. Worker 6.x serwowany lokalnie z artefaktu npm.
- Własny styl w palecie atlasu, OpenFreeMap jako źródło danych i glifów; widoczna atrybucja. Początkowy kadr centrum Rybnika, przybliżanie, przesuwanie klawiaturą i myszą/dotykiem, powrót do centrum.
- Plan 1932 z publicznego skanu MBC, własne dopasowanie i lokalne kafelki WebP. Przełącznik, suwak 0–100%, opis dokładności, obrys granic arkusza, przycisk pokazania całości i komunikat przy środku widoku poza zasięgiem.
- Trzy jawnie przykładowe punkty w lokalnym pliku TypeScript. Wybór przyciskiem listy lub znacznikiem, wyróżnienie oraz karta w jednym panelu; zamknięcie zachowuje kadr i przywraca fokus. Nie zaimportowano katalogu i nie ma backendu.
- Stany ładowania, błędu oraz ponowienia; lista i karty niezależne od dostępności podkładu. Komunikat bez JavaScript poza obszarem hydratacji.

[Źródła, prawa, koszty, georeferencja i odtwarzanie kafelków](mapy-zrodla.md). W szczególności: status domeny publicznej pochodzi z konkretnego rekordu biblioteki; nie wykorzystujemy serwera kafelków Stare Plany Miast.

## Sprawdzenie lokalne

- Build: dwie statyczne trasy, dynamiczny osobny bundle MapLibre. Pierwsze załadowanie HTML nie inicjalizuje WebGL podczas builda.
- Walidacja stylu MapLibre: brak błędów. Wszystkie 943 kafelki istnieją i odpowiadają SHA-256 manifestu; gotowy zestaw ma około 7 MB.
- Kontrola wizualna prawdziwego podkładu i planu na desktopie oraz w widoku 390 × 844. Dodatkowy pomiar szerokości 320 px: brak poziomego przepełnienia.
- Suwak sprawdzony klawiaturą: Home → 0%, End → 100%, strzałka → zmiana o 1%. Screenshoty potwierdziły rzeczywiste odsłanianie mapy współczesnej i pełne krycie historyczne. Zmiana krycia nie zmieniła pozycji znaczników.
- Znacznik otwiera właściwą kartę, tylko jeden canvas pozostaje na stronie; wybrany znacznik ma `aria-pressed=true`. Fokus trafia do nagłówka karty. Powrót odtwarza fokus przycisku listy. Przełączenie warstwy nie tworzy mapy od nowa.
- Pokazanie całego planu ujawnia obrys zasięgu; wyjazd klawiaturą i przeciągnięciem poza arkusz pokazuje ostrzeżenie. Przycisk powrotu do zasięgu działa; mapa współczesna pozostaje dostępna poza nim.
- Kontrolowana niedostępność lokalnego stylu podkładu: komunikat błędu, działająca karta z listy, powrót mapy po przywróceniu źródła i ponowieniu. Nie wymuszano osobno wyłączenia GPU/WebGL w ustawieniach urządzenia.
- Wykryte i poprawione przed publikacją: różnica parsowania `noscript` przy hydratacji oraz kodowanie nawiasów klamrowych w adresach kafelków.

Dokładność: pięć rozpoznawalnych budynków użyto jako kontroli dopasowania. RMS reszt 18,6 m nie jest niezależną oceną dokładności całego arkusza. Dopasowanie jest orientacyjne, szczególnie poza centrum; nie identyfikuje pewnych granic posesji. Pełny audyt czytnikiem ekranu i fizyczne urządzenia mobilne nie były częścią tej kontroli.

## Publikacja

Commit, wersja Hosting i wynik kontroli wdrożenia: do uzupełnienia po publikacji.
