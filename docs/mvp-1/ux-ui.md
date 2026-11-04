# MVP.1 — propozycje kolorystyki i UX/UI

Data: 4 listopada 2026. Status: **zatwierdzony kierunek — jasna mapa wektorowa, ciemnozielone akcenty i jeden panel treści**. Wcześniejsze propozycje poniżej stanowią zapis prac projektowych.

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

1. Kierunek wybrany: jasna mapa wektorowa i jeden panel. Pozostałe warianty są materiałem porównawczym.
2. Dopracować widok startowy, wyniki wyszukiwania, miejsce bez pozycji, logowanie i wskazywanie lokalizacji.
3. Przygotować właściwe logo oraz finalne tokeny kolorów i typografii.


## Rewizja — oddzielenie treści od mapy i nakładka historyczna

Po uwadze właściciela o zlewaniu się treści z rastrem przygotowano nowy podgląd:

- Desktop: osobny, nieprzezroczysty panel treści po lewej, oddzielony od obszaru mapy.
- Mobile: obszar mapy i panel treści są osobnymi sekcjami, bez przenikania podkładu przez tekst.
- Podstawa to rzeczywiste kafelki współczesnej mapy OpenStreetMap centrum Rybnika.
- Nad nimi leży plan z 1932 r., z regulacją krycia 0–100%, domyślnie 35%, i możliwością wyłączenia. Obie warstwy korzystają z identycznego zakresu kafelków Web Mercator.
- Podgląd pokazuje trzy warianty przetworzenia kolorów rastra OSM: oryginalny, stonowany i czarno-biały. To filtry całego obrazu; nie jest to finalny styl wektorowy.
- Docelowy podkład wektorowy pozwoli osobno dobrać kolory i widoczność dróg, budynków, wody, zieleni oraz etykiet. Dostawca danych, styl i biblioteka pozostają decyzją etapu technicznego.
- Zachowano atrybucję OSM oraz źródła historyczne. Zgodność współrzędnych nie usuwa błędów oryginalnej georeferencji planu.

Ten podgląd zastąpił wcześniejsze ograniczenie do samego rastra historycznego. Ostateczny wybór kierunku zapisano na końcu dokumentu.

Dokumentacja możliwości stylowania: https://maplibre.org/maplibre-style-spec/layers/ oraz przezroczystości kafelków: https://leafletjs.com/reference#tilelayer-opacity.


## Rewizja — paleta mapy wektorowej i miejsce na wyniki

Przygotowano podgląd rzeczywistej geometrii OpenStreetMap (lokalny wycinek XML z MVP.0, pochodzący z API OSM), renderowanej wektorowo, bez nakładki z 1932 r. Poszczególne rodzaje obiektów mają własne kolory; nie jest to filtr rastra. Render w podglądzie wykorzystuje SVG i D3, nie przesądza o docelowym silniku mapy.

Proponowane tokeny: tło `#F0F1EC`, budynki `#DADFD7`, zieleń `#DDE8D8`, woda `#B5CDD0`, drogi `#FFFFFF` z obrysem `#CDD3C9`, podpisy `#65736A`, punkty `#245947`. Ciemne punkty katalogu mają wyróżniać się na spokojnym podkładzie; warstwy nie konkurują kolorem z treścią.

Porównano dwa układy na tej samej mapie i trzech przykładowych miejscach:

1. **Jeden panel**: wyszukiwarka stale u góry lewego panelu. Wybór wyniku zastępuje listę kartą. Powrót odtwarza listę z zachowanym zapytaniem; docelowo również z pozycją przewinięcia. Kliknięcie znacznika otwiera tę samą kartę.
2. **Lista i szczegóły**: lista z wyszukiwarką po lewej, karta po prawej, mapa pomiędzy. Ułatwia przełączanie między wynikami, ale odbiera mapie szerokość. Na telefonie lista i szczegóły nadal muszą być kolejnymi stanami jednej sekcji.

Rekomendacja dla minimalistycznego MVP.1: **jeden panel**, z jednym miejscem na treść i większą mapą. Dwóch jednoczesnych paneli nie dodajemy jako zatwierdzonego wymagania. Wybrany wynik ma własny adres URL; przejście wstecz przywraca kontekst wyszukiwania. Na telefonie wyszukiwarka pozostaje nad mapą, a lista i szczegóły korzystają z jednego obszaru poniżej mapy albo panelu od dołu — szczegóły zachowania wymagają dopracowania.

W podglądzie sprawdzono wektorowy podkład, wybór miejsca z listy, zastąpienie listy szczegółami, powrót oraz drugi wariant z dwoma panelami. Właściciel zaakceptował kierunek; decyzję zapisano poniżej.


## Zatwierdzony kierunek — 4 listopada 2026

Po obejrzeniu mapy wektorowej i porównania paneli właściciel zaakceptował propozycję. Przyjmujemy:

- Jasny, spokojny podkład wektorowy w palecie opisanej wyżej: szarozielone budynki, delikatna zieleń, przygaszona woda, białe drogi i ciemnozielone punkty.
- Nieprzezroczyste powierzchnie treści, wyraźnie oddzielone od mapy.
- Jeden panel po lewej na desktopie: wyszukiwarka pozostaje na górze; lista i karta miejsca są kolejnymi stanami tego samego obszaru. Powrót do wyników zachowuje zapytanie i pozycję listy.
- Na telefonie jeden obszar na listę lub kartę, z łatwo dostępną wyszukiwarką. Szczegóły wysokości i zwijania panelu dopracujemy w kolejnych ekranach.
- Plan z 1932 r. pozostaje opcjonalną nakładką z regulacją krycia; 35% to punkt wyjścia z podglądu, nie ostateczna decyzja o ustawieniu startowym aplikacji.

Zatwierdzenie dotyczy kierunku kolorystycznego oraz układu jednego panelu. Finalne logo, typografia, pozostałe stany ekranów i technologia mapy pozostają do dopracowania.


## Propozycje — typografia, znak i edycja lokalizacji

Przygotowano dwa kierunki do wyboru, zachowujące zatwierdzoną paletę:

- **Spokojny atlas** (rekomendacja): Lora dla nazwy i tytułów, Source Sans 3 dla opisów oraz interfejsu. Znak: jasny monogram HR w ciemnozielonym kole; pełna nazwa obok.
- **Archiwum miejskie**: Newsreader dla nazwy i tytułów, Inter dla opisów oraz interfejsu. Znak: monogram HR w cienkiej kwadratowej ramce.

To propozycje, nie zatwierdzone finalne logo. Podglądy pokazują znak w większym rozmiarze i w nagłówku aplikacji, wraz z tytułem miejsca i tekstem z polskimi znakami. Ostateczne pliki logo, favicon oraz kontrolę czytelności w małych rozmiarach przygotujemy po wyborze kierunku.

### Ekran ustawiania lokalizacji

Prototyp przedstawia stan zalogowanego użytkownika i wykorzystuje ten sam lewy panel co karta miejsca. Sekwencja: „Zmień lokalizację” → wskazanie punktu na mapie → podgląd nowej pozycji i dokładności → „Zapisz publicznie” albo „Anuluj”. Przed wskazaniem pozycji zapis jest nieaktywny. Dotychczasowa i nowa pozycja są rozróżnione.

Propozycje pól: dokładność „Miejsce przybliżone” (domyślnie) lub „Wskazany budynek” oraz opcjonalne uzasadnienie/źródło. „Wskazany budynek” nie oznacza automatycznego potwierdzenia historycznej funkcji. Szczegółową semantykę statusów ustalimy przed schematem bazy.

Przycisk zapisu informuje o natychmiastowej publikacji. Docelowo powstaje wpis historii autora, czasu, starej i nowej pozycji. Prototyp zmienia tylko stan makiety i jawnie informuje, że nie zapisuje do bazy. Sprawdzono wskazanie na mapie, aktywację zapisu oraz powrót do karty ze zmienioną pozycją i statusem.

Do dopracowania: mobilne wskazywanie z podglądem, obsługa błędu zapisu i konfliktów oraz dostępne klawiaturą alternatywy dla kliknięcia na mapie.


## Akceptacja marki i ekranu lokalizacji — 4 listopada 2026

Właściciel zaakceptował proponowany kierunek **Spokojny atlas**: monogram HR w ciemnozielonym kole, Lora dla nazwy i tytułów oraz Source Sans 3 dla interfejsu i opisów. Druga propozycja pozostaje materiałem porównawczym.

Przyjęto kierunek ekranu edycji w jednym panelu: dotychczasowa i nowa pozycja, wskazanie na mapie, określenie dokładności, opcjonalne uzasadnienie oraz jawny zapis publiczny lub anulowanie. Przed wskazaniem pozycji zapis jest nieaktywny.

Finalizacja plików logo i favicon, kontrola małych rozmiarów, mobilne zachowanie edycji oraz szczegółowa semantyka statusów pozostają zadaniami do wykonania. Akceptacja kierunku nie oznacza, że te elementy są już zaimplementowane.
