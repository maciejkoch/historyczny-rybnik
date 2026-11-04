# MVP.1 — propozycje kolorystyki i UX/UI

Data: 4 listopada 2026. Status: trzy propozycje do wyboru; brak zatwierdzonego kierunku.

## Materiał do porównania

Przygotowano trzy warianty desktopowe i trzy mobilne, prezentowane w rozmowie. Wszystkie używają rzeczywistego planu Rybnika z 1932 r. z MVP.0, bez zmiany jego kolorów i usuwania oznaczeń. Kafelki: Stare Plany Miast / MAPSTER. To materiał do oceny interfejsu; warunki docelowego wykorzystania podkładu pozostają do sprawdzenia w etapie technicznym.

Wspólny przykład to Dom Towarowy Czesław Beyga, Sobieskiego 18. Opis jest streszczeniem danych MVP.0. Pokazano rzeczywisty wycinek ogłoszenia i dwie referencje z 1938 r. Współrzędne punktu pochodzą z istniejącego katalogu; pozycję na rastrze przeliczono w projekcji kafelkowej Web Mercator. Georeferencja planu ma ograniczoną dokładność.

## Warianty

| Kierunek | Akcent | Powierzchnia | Tekst | Układ desktopowy |
| --- | --- | --- | --- | --- |
| Papier i zieleń | `#245947` | `#FAF8F2` | `#203B32` | Pływająca wyszukiwarka i karta po lewej; większość ekranu zajmuje mapa |
| Jasny atlas | `#234A76` | `#FFFFFF` | `#172C48` | Pełna górna belka, wyszukiwarka i karta po prawej; prostsza typografia bezszeryfowa |
| Grafit i miedź | `#D5A273` | `#242C2D` | `#F6F1E8` | Ciemna, szeroka karta na dole; osobne kolumny opisu i źródeł |

Rekomendacja robocza: **Papier i zieleń**. Delikatnie ocieplona powierzchnia współgra z historycznym rastrem, a ciemna zieleń odróżnia elementy aplikacji od żółtego papieru i czerwonych budynków. Nie zatwierdzono jeszcze palety ani typografii. Monogram HR jest jedynie roboczym znakiem w makietach, nie gotowym logo.

## Mobile first

- Mapa stanowi tło i główny obszar pracy.
- Na górze: nazwa, logowanie i dostępna od razu wyszukiwarka.
- Przełącznik podkładu i przybliżanie pozostają nad mapą.
- Szczegóły miejsca pojawiają się w panelu od dołu; po zamknięciu ponownie dostępna jest mapa.
- Karta pokazuje nazwę, adres, status lokalizacji, opis, wycinek i linki do referencji.
- Docelowa karta musi przewijać dłuższe treści i dostosowywać się do wysokości ekranu oraz klawiatury. Wysokość podglądów służy pokazaniu całego przykładu.
- Status ma tekstową etykietę, nie jest przekazywany wyłącznie kolorem.

## Granice prototypów

Działają lokalne podglądy zamykania i otwierania karty, wyszukania przykładowej pozycji oraz przybliżania rastra. Przyciski logowania i edycji pokazują objaśnienie przyszłego zachowania; nie zapisują danych. W porównaniu wszystkie warianty używają planu historycznego. Przycisk mapy współczesnej nie przełącza podkładu w prototypie; oba podkłady pozostają wymaganiem aplikacji.

Sprawdzono wyświetlenie rastra i skanu w przeglądarce, wszystkie trzy warianty desktopowe, podgląd mobilny oraz zamykanie karty i przełączanie wariantów. Pełna kontrola dostępności i responsywności będzie częścią implementacji wybranego kierunku.

## Następne decyzje

1. Wybrać kierunek lub połączenie palety i układu z różnych propozycji.
2. Dopracować widok startowy, wyniki wyszukiwania, miejsce bez pozycji, logowanie i wskazywanie lokalizacji.
3. Przygotować właściwe logo oraz finalne tokeny kolorów i typografii.
