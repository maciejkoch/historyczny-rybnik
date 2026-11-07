# Zasady zmian i code review

## Przed rozpoczęciem

Przeczytaj [TECHNICAL.md](TECHNICAL.md), ten plik i README folderów objętych pracą. Oba dokumenty obowiązują przy implementacji i code review. Szczegółową dokumentację czytaj według zakresu zadania, zgodnie z [AGENTS.md](AGENTS.md).

## Styl kodu i praktyki

Poniższe punkty utrzymują istniejące konwencje repozytorium; kolejne zasady uzgadniamy z właścicielem projektu.

- Format określają `.editorconfig` i `.prettierrc`: UTF-8, dwie spacje, pojedyncze cudzysłowy w TypeScript i końcowy znak nowej linii.
- Zachowujemy ścisłe sprawdzanie TypeScript i szablonów Angulara ustawione w `tsconfig.json`.
- Kontynuujemy istniejący podział na komponenty standalone, Signals i `OnPush`. Kod mapy wymagający przeglądarki pozostaje poza wykonaniem SSG.
- Zachowujemy wspólne tokeny stylów i istniejące komponenty. Interfejs uwzględnia telefon, klawiaturę, fokus i ograniczenie animacji.
- Nie rozszerzamy zakresu zadania o niezwiązane zmiany i nie nadpisujemy zastanej pracy.
- Odstępstwa od uzgodnionej architektury lub praktyk omawiamy z właścicielem przed wprowadzeniem. Zasad nie przepisujemy samodzielnie w celu uzasadnienia kodu.

## Weryfikacja i dokumentacja

- Dobieramy weryfikację do zmiany. Dla kodu aplikacji wykonujemy `npm run build` oraz sprawdzamy zmienione zachowanie; dla georeferencji także testy mapy. Sama dokumentacja wymaga kontroli treści i odnośników.
- Przy każdym zadaniu sprawdzamy aktualność `README.md`, `TECHNICAL.md`, tego pliku oraz README odpowiednich folderów. Poprawiamy opisy, których dotyczy zmiana, w ramach tego samego zadania.
- Główny README opisuje działające funkcje prostym, zwięzłym językiem. Plany są wyraźnie oddzielone od stanu obecnego.
- Każdy utrzymywany folder bezpośrednio pod rootem ma krótki README opisujący przeznaczenie i zawartość. Wyjątek: foldery generowane, zależności, cache i metadane narzędzi.
- Nie powielamy opisów: README przedstawia funkcje, TECHNICAL stan techniczny, ten plik praktyki, a `agent-context/` materiały pomocnicze.

## Code review i zakończenie

Review sprawdza zgodność z `TECHNICAL.md` i `CONTRIBUTING.md`, poprawność zachowania, adekwatność weryfikacji oraz aktualność dokumentacji. Sprzeczność z dokumentacją wymaga wyjaśnienia; planu nie traktujemy jako wdrożonego rozwiązania.

W podsumowaniu podajemy wynik, wykonaną weryfikację i zaktualizowane dokumenty albo informację, że sprawdzono ich aktualność i zmiana nie była potrzebna. Zasady publikacji pozostają w [AGENTS.md](AGENTS.md).
