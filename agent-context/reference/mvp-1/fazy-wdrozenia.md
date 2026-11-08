# MVP.1 — fazy wdrożenia

Data: 5 listopada 2026. Status: **podział będący podstawą [szczegółowego planu implementacji](plan-implementacji.md)**. Każda faza kończy się działającym deploymentem, sprawdzeniem wdrożonej wersji i zapisaniem adresu do odbioru. Ten dokument nie uruchamia wdrożeń.

Założenia: [zakres produktu](README.md), [technika](technika.md), [model danych](model-danych.md). Budujemy Angular SSG + Firebase Hosting + Functions. Jedna kolekcja `places`, bez historii zmian lokalizacji.

## Aktualna kolejność — decyzja właściciela z 7 listopada 2026

Najpierw przygotowujemy cały katalog na dev, potem uruchamiamy produkcję z zaakceptowanymi danymi. Zachowujemy numery faz jako identyfikatory istniejących zadań; kolejność realizacji to **1 → 2 → 3 → 4 → 6 (dane na dev) → 5 (wydanie produkcyjne)**. Ten zapis zastępuje poniższe wcześniejsze zależności faz 5–6 i ograniczenie katalogu do jednego kościoła do końca fazy 5.

- **Faza 6:** inwentaryzacja, weryfikacja źródeł i praw do plików, uporządkowanie i walidacja całego katalogu, kontrolowany import do `places-dev` i dev Storage oraz build, wdrożenie i odbiór na zarezerwowanym dev-N. Nie wymaga działającej produkcji. Raport obejmuje również rekordy wyłączone i miejsca bez pozycji.
- Źródłem późniejszego importu jest zweryfikowany plik katalogu i zestaw dozwolonych plików. Zachowujemy stabilne ID, slugi i ID kościoła; jawnie rozstrzygamy konflikty lokalizacji. Nie kopiujemy całej bazy dev ani danych testowych do produkcji.
- **Faza 5:** po odbiorze katalogu na dev przygotowujemy zasoby produkcyjne, kopie i odtworzenie, monitoring, domenę i indeksowanie. Kontrolowany import zaakceptowanego katalogu i plików do produkcji, dostosowanie odnośników do plików oraz publikacja HTML, indeksu, sitemapy i przekierowań należą do tej fazy. Odbiór obejmuje pełny katalog i odłożone testy manualne fazy 4. To wydanie zamyka MVP.1.
- Produkcję nadal publikujemy wyłącznie na osobne, wyraźne zlecenie wydania. Zmiana kolejności nie uruchamia importu ani wdrożenia i nie dodaje nowych funkcji aplikacji.

Poniższy pierwotny podział zachowano jako szczegółowy opis prac; przy sprzeczności zakresu środowisk lub kolejności obowiązuje decyzja powyżej.

## Podział

| Faza | Działający rezultat | Deployment |
| --- | --- | --- |
| 1. Podstawa aplikacji i marka | Responsywny szkielet z logo, typografią i panelem treści | Statyczny frontend na Firebase Hosting, adres preview |
| 2. Mapa współczesna i plan historyczny | Mapa wektorowa, nakładka z 1932 r. i suwak przezroczystości | Frontend z oboma podkładami, adres preview |
| 3. Infrastruktura, API i jedna pełna karta | Skonfigurowane usługi, API odczytu i zapisu, wyszukiwanie i SEO dla jednego zweryfikowanego kościoła | Frontend + Functions + konfiguracja Firebase, adres preview |
| 4. Logowanie i zapis lokalizacji | Google Sign-In i publiczne ustawianie/poprawianie pozycji | Frontend + zabezpieczone API zapisu Functions, adres preview |
| 5. Gotowość produkcyjna | Komplet funkcji sprawdzony na jednym rzeczywistym miejscu | Produkcja pod `historyczny.rybnik.pl`, nadal z jednym miejscem |
| 6. Zasilenie całego katalogu | Zweryfikowany katalog miejsc, opublikowane karty i pliki | Końcowy deployment katalogu i stron SSG na produkcję |

Fazy 1–4 odbieramy na adresach preview, aby domena docelowa nie udawała gotowego MVP.1. Hosting preview nie izoluje automatycznie bazy i Functions. Wersje testowe korzystają z jawnie wskazanego środowiska testowego; przed fazą 3 wybieramy jego konfigurację i oddzielenie od danych produkcyjnych. Każdy deployment obejmuje rzeczywiście zmienione elementy, a nie obowiązkową przebudowę wszystkich usług.

## Faza 1 — podstawa aplikacji i marka

**Zakres:** utworzenie aplikacji od zera, konfiguracja Angulara SSG, Tailwind i daisyUI, tokeny kolorów, Lora i Source Sans 3, przygotowanie logo „Ryba na mapie” w SVG i favicony. Jeden panel treści na desktopie i układ mobilny zgodny z zaakceptowanym projektem. Konfiguracja builda i pierwszej publikacji na Hosting.

Mapa może być jeszcze pustym obszarem o docelowych wymiarach. W tym wydaniu nie pokazujemy pozornie działających przycisków logowania ani zapisu.

**Odbiór deploymentu:** strona otwiera się po HTTPS; układ działa na telefonie i desktopie; fonty, logo i zasoby są dostępne; odświeżenie `/` działa, nieznany adres zwraca 404. Istnieje powtarzalny sposób budowania i publikacji.

## Faza 2 — mapa współczesna i plan historyczny

**Zakres:** integracja MapLibre uruchamianego wyłącznie w przeglądarce, wybór dostawcy i stylu kafelków, ustalona kolorystyka wektorowa, przesuwanie i przybliżanie. Mały, jawnie przykładowy zestaw miejsc w pliku pozwala sprawdzić znaczniki, wybór i panel. To dane do odbioru interfejsu, nie deklaracja importu katalogu.

W tej samej fazie dodajemy rzeczywisty plan z 1932 r. jako nakładkę, przełącznik widoczności oraz suwak przezroczystości. Wybrane miejsce i kadr pozostają zachowane podczas zmiany warstw. Pokazujemy zasięg planu i komunikat poza pokryciem. Przed publikacją sprawdzamy warunki użycia podkładu i planu, atrybucję, koszt oraz georeferencję.

**Odbiór deploymentu:** prawdziwy podkład działa na urządzeniu mobilnym; wybór znacznika otwiera właściwy panel; zamknięcie zachowuje kadr; przy braku WebGL/podkładu widoczny jest komunikat i dostępna treść. Build SSG nie inicjalizuje mapy. Plan historyczny daje się włączyć i wyłączyć, suwak rzeczywiście zmienia krycie, a poza zasięgiem nadal można korzystać z mapy współczesnej.

## Faza 3 — infrastruktura, API i jedna pełna karta

**Warunki wejścia:** ustalone edycja i region Firestore, konfiguracja środowiska testowego, rozliczenia potrzebne usługom oraz wybór jednego kościoła z jednoznacznie ustaloną lokalizacją i sprawdzonymi referencjami. Konkretny obiekt wybieramy po weryfikacji materiałów; nie przedstawiamy przykładowych danych jako faktów.

**Zakres:** konfiguracja infrastruktury potrzebnej MVP.1: Firestore, Storage, Functions, Authentication Google, App Check, uprawnienia, konfiguracja środowisk i wdrażania. Powstaje API odczytu oraz callable zapisu lokalizacji z walidacją, sprawdzaniem wersji, Auth i App Check. API zapisu sprawdzamy już w tej fazie; jego interfejs użytkownika dostarczymy w fazie 4. Przed implementacją rozstrzygamy, kto może usunąć ustawioną pozycję.

Prosty walidowany import zasila `places` **dokładnie jednym rzeczywistym miejscem — zweryfikowanym kościołem**. Dodajemy jego opis, adres, współrzędne, daty, referencje oraz wycinki i miniatury, jeśli podstawa publikacji jest ustalona. Przykłady z fazy 2 usuwamy z wdrożonego katalogu. Pozostałych miejsc nie importujemy do bazy; pełne zasilenie nastąpi dopiero w fazie 6.

Wyszukiwanie po nazwach, aliasach i adresach, także bez polskich znaków, działa już na tym jednym miejscu. Jeden panel przechodzi z listy do szczegółów i z powrotem. SSG generuje `/miejsca/:slug`, pełne HTML i metadane, canonical i sitemapę. Bezpośrednie wejście, odświeżenie i Wstecz/Dalej są częścią tej fazy. Mechanizm dawnych slugów generuje przekierowania Hosting. Mapa pobiera bieżącą pozycję niezależnie od HTML.

Przypadki braku pozycji, konfliktów i draftów sprawdzamy na lokalnych danych testowych/emulatorach, bez dodawania kolejnych publicznych rekordów.

**Odbiór deploymentu:** na preview znajduje się jeden kościół, który da się znaleźć i otworzyć po URL; opis i referencje są w HTML bez JS; nieznane adresy mają 404, przekierowania działają, a wycinki są czytelne. Odczyt i zapis API są wdrożone; zapis bez Auth/App Check, próba zmiany opisu/draftu i konflikt wersji są odrzucane. Prywatne dane i pliki pozostają niedostępne. Preview ma blokadę indeksowania; właściwe zasady indeksowania produkcji włączymy w fazie 5.

## Faza 4 — logowanie i zapis lokalizacji

**Zakres:** podłączenie interfejsu logowania Google i edycji lokalizacji do usług i API wdrożonych w fazie 3. Wskazanie punktu, wybór dokładności, uzasadnienie, podgląd, anulowanie i jawny zapis. Każdy zalogowany może poprawić pozycję innej osoby. Backend aktualizuje tylko bieżącą lokalizację, wersję i czas; bez historii i cofania.

Sprawdzanie wersji zabezpiecza równoczesne poprawki. Niepewny wynik zapisu powoduje ponowny odczyt. Scenariusze sprawdzamy na tym samym jednym kościele; po testach przywracamy jego zweryfikowaną pozycję. Nie rozszerzamy katalogu.

**Odbiór deploymentu:** logowanie działa na adresie wdrożenia; zapis jest od razu publiczny i pozostaje po odświeżeniu, bez nowego deploymentu frontendu. Anulowanie niczego nie zmienia. API odrzuca brak Auth/App Check, próbę zmiany opisu lub draftu i zapis na nieaktualnej wersji. Niezalogowany może nadal przeglądać katalog.

## Faza 5 — gotowość produkcyjna

**Zakres:** odbiór kompletu funkcji na jednym zweryfikowanym kościele i wdrożenie na środowisko produkcyjne. Mapa współczesna oraz plan z suwakiem są już gotowe od fazy 2; nie odkładamy ich na ten etap. Katalog nadal zawiera tylko jeden rzeczywisty rekord.

Domykamy konfigurację domeny/HTTPS, produkcyjnego logowania i App Check, uprawnień, podstawowego monitorowania błędów i sposobu odtworzenia danych. Sprawdzamy kryteria zakresu produktu na telefonie i desktopie, ze szczególnym uwzględnieniem klawiatury, czytelności karty, wolnej sieci i błędów usług. Scenariusze wymagające większej liczby rekordów weryfikujemy lokalnie i ponownie po zasileniu w fazie 6.

**Odbiór deploymentu:** aplikacja z jednym kościołem działa pod `historyczny.rybnik.pl`, publiczne strony mogą być indeksowane, sitemap i canonical wskazują domenę produkcyjną, a testowe adresy pozostają wyłączone z indeksowania. Znany jest sposób powrotu do poprzedniego wydania Hosting i odtworzenia danych; powrót frontendu sam w sobie nie cofa zapisów w Firestore. Działają mapa, nakładka z suwakiem, wyszukiwanie, karta, logowanie i zapis lokalizacji.

## Faza 6 — zasilenie całego katalogu i końcowe wydanie MVP.1

**Zakres:** osobny, ostatni etap po zakończeniu prac nad aplikacją. Przeglądamy cały katalog MVP.0, porządkujemy nazwy, adresy, referencje i daty oraz sprawdzamy podstawy wykorzystania plików. Przeprowadzamy kontrolowany import do `places` i Storage, zachowując rekord kościoła z wcześniejszych faz oraz jego ID. Import nie nadpisuje po cichu aktualnych pozycji poprawionych przez użytkowników; konflikty wymagają jawnego rozstrzygnięcia.

Nie wymyślamy współrzędnych ani dat. Miejsca bez pozycji pozostają wyszukiwalne. Rekordy niepewne opisujemy zgodnie z modelem, a braki uniemożliwiające publikację dokumentujemy zamiast automatycznie publikować wadliwe dane. Cały katalog źródłowy ma zostać przejrzany; ewentualne wyłączenia z publikacji muszą być jawne.

Budujemy i wdrażamy HTML wszystkich publicznych kart, indeks wyszukiwania, sitemapę i potrzebne przekierowania. To deployment treści, a nie dodawanie kolejnych funkcji aplikacji.

**Odbiór deploymentu:** katalog na produkcji odpowiada raportowi importu; liczby opublikowanych, nieustalonych i wyłączonych rekordów są znane. Sprawdzamy wyszukiwanie na pełnym zbiorze, miejsca bez pozycji, kilka miejsc pod tym samym adresem, mapę i wydajność, wycinki, bezpośrednie URL i kompletność sitemapy. Jeden kościół startowy nie został zduplikowany. Ta publikacja zamyka MVP.1.

## Co jest poza tym podziałem

Komentarze, dodawanie źródeł i zdjęć przez użytkowników, panel moderacji, filtrowanie czasu, dodatkowe metody logowania, strony informacyjne oraz SSR. Nie dokładamy ich do ostatniej fazy jako warunku wydania MVP.1.

[Szczegółowy plan implementacji](plan-implementacji.md) rozbija powyższe fazy na zadania i zależności. Warunkiem zamknięcia każdej fazy będzie sprawdzenie jej wdrożonego rezultatu, nie samo ukończenie kodu lokalnie.
