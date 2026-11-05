# MVP.1 — fazy wdrożenia

Data: 5 listopada 2026. Status: **proponowany podział przed szczegółowym planem implementacji**. Każda faza kończy się działającym deploymentem, sprawdzeniem wdrożonej wersji i zapisaniem adresu do odbioru. Ten dokument nie uruchamia wdrożeń.

Założenia: [zakres produktu](README.md), [technika](technika.md), [model danych](model-danych.md). Budujemy Angular SSG + Firebase Hosting + Functions. Jedna kolekcja `places`, bez historii zmian lokalizacji.

## Podział

| Faza | Działający rezultat | Deployment |
| --- | --- | --- |
| 1. Podstawa aplikacji i marka | Responsywny szkielet z logo, typografią i panelem treści | Statyczny frontend na Firebase Hosting, adres preview |
| 2. Mapa współczesna | Mapa w ustalonej palecie, znaczniki i wybór miejsca na małym zestawie przykładowym | Frontend z rzeczywistym podkładem mapowym, adres preview |
| 3. Katalog, wyszukiwanie i SEO | Rzeczywiste miejsca z Firestore, wyszukiwanie, kompletne karty i adresy SSG | Frontend + API odczytu Functions, adres preview |
| 4. Logowanie i zapis lokalizacji | Google Sign-In i publiczne ustawianie/poprawianie pozycji | Frontend + zabezpieczone API zapisu Functions, adres preview |
| 5. Plan historyczny i wydanie MVP.1 | Nakładka z 1932 r., sprawdzony katalog startowy i komplet uzgodnionego MVP | Produkcja pod `historyczny.rybnik.pl` |

Fazy 1–4 odbieramy na adresach preview, aby domena docelowa nie udawała gotowego MVP.1. Hosting preview nie izoluje automatycznie bazy i Functions. Wersje testowe korzystają z jawnie wskazanego środowiska testowego; przed fazą 3 wybieramy jego konfigurację i oddzielenie od danych produkcyjnych. Każdy deployment obejmuje rzeczywiście zmienione elementy, a nie obowiązkową przebudowę wszystkich usług.

## Faza 1 — podstawa aplikacji i marka

**Zakres:** utworzenie aplikacji od zera, konfiguracja Angulara SSG, Tailwind i daisyUI, tokeny kolorów, Lora i Source Sans 3, przygotowanie logo „Ryba na mapie” w SVG i favicony. Jeden panel treści na desktopie i układ mobilny zgodny z zaakceptowanym projektem. Konfiguracja builda i pierwszej publikacji na Hosting.

Mapa może być jeszcze pustym obszarem o docelowych wymiarach. W tym wydaniu nie pokazujemy pozornie działających przycisków logowania ani zapisu.

**Odbiór deploymentu:** strona otwiera się po HTTPS; układ działa na telefonie i desktopie; fonty, logo i zasoby są dostępne; odświeżenie `/` działa, nieznany adres zwraca 404. Istnieje powtarzalny sposób budowania i publikacji.

## Faza 2 — mapa współczesna

**Zakres:** integracja MapLibre uruchamianego wyłącznie w przeglądarce, wybór dostawcy i stylu kafelków, ustalona kolorystyka wektorowa, przesuwanie i przybliżanie. Mały, jawnie przykładowy zestaw miejsc w pliku pozwala sprawdzić znaczniki, wybór i panel. To dane do odbioru interfejsu, nie deklaracja importu katalogu.

Przed wyborem dostawcy sprawdzamy warunki użycia, atrybucję i koszt. Równolegle potwierdzamy dostępność, prawa i sposób georeferencji planu z 1932 r., aby nie odkryć blokady dopiero w fazie 5.

**Odbiór deploymentu:** prawdziwy podkład działa na urządzeniu mobilnym; wybór znacznika otwiera właściwy panel; zamknięcie zachowuje kadr; przy braku WebGL/podkładu widoczny jest komunikat i dostępna treść. Build SSG nie inicjalizuje mapy.

## Faza 3 — katalog, wyszukiwanie i SEO

**Warunki wejścia:** ustalone edycja i region Firestore, konfiguracja środowiska testowego, rozliczenia potrzebne usługom oraz źródło pierwszego rzeczywistego zestawu danych.

**Zakres:** konfiguracja Firestore i Storage, prosty walidowany import do `places`, Functions API odczytu z App Check, pliki i miniatury. Zastąpienie przykładów rzeczywistym małym katalogiem. Wyszukiwanie po nazwach, aliasach i adresach, także bez polskich znaków. Jeden panel przechodzący z listy do szczegółów i z powrotem. Karty zawierają opisy, referencje, daty, wycinki i linki. Miejsca bez pozycji są wyszukiwalne, bez znacznika.

SSG generuje `/miejsca/:slug`, pełne HTML i metadane, canonical i sitemapę. Bezpośrednie wejście, odświeżenie i Wstecz/Dalej są częścią tej fazy. Poprzednie slugi generują przekierowania Hosting. Mapa pobiera bieżące pozycje niezależnie od HTML. Nie implementujemy jeszcze zapisu użytkownika.

**Odbiór deploymentu:** rzeczywiste miejsce da się znaleźć i otworzyć po URL; opis i referencje są w HTML bez wykonywania JS; nieznane adresy mają 404, stare slugi przekierowują; wycinki otwierają się czytelnie; dane robocze i prywatne pliki nie są publicznie dostępne. Testowy Hosting preview ma blokadę indeksowania; właściwe zasady indeksowania produkcji włączymy w fazie 5.

## Faza 4 — logowanie i zapis lokalizacji

**Zakres:** Firebase Authentication z samym Google, konfiguracja autoryzowanych domen testowych, callable do zmiany lokalizacji z Auth i App Check. Wskazanie punktu, wybór dokładności, uzasadnienie, podgląd, anulowanie i jawny zapis. Każdy zalogowany może poprawić pozycję innej osoby. Backend aktualizuje tylko bieżącą lokalizację, wersję i czas; bez historii i cofania.

Sprawdzanie wersji zabezpiecza równoczesne poprawki. Niepewny wynik zapisu powoduje ponowny odczyt. Przed implementacją rozstrzygamy drobny otwarty punkt: kto może usunąć już ustawioną pozycję.

**Odbiór deploymentu:** logowanie działa na adresie wdrożenia; zapis jest od razu publiczny i pozostaje po odświeżeniu, bez nowego deploymentu frontendu. Anulowanie niczego nie zmienia. API odrzuca brak Auth/App Check, próbę zmiany opisu lub draftu i zapis na nieaktualnej wersji. Niezalogowany może nadal przeglądać katalog.

## Faza 5 — plan historyczny i wydanie MVP.1

**Zakres:** dodanie planu z 1932 r. jako nakładki, przełączanie i regulacja przezroczystości, czytelny zasięg oraz komunikat poza pokryciem. Wybrane miejsce pozostaje dostępne po zmianie warstwy. Przygotowanie docelowego zestawu startowego i publikacja na środowisko produkcyjne.

Domykamy konfigurację domeny/HTTPS, produkcyjnego logowania i App Check, uprawnień, podstawowego monitorowania błędów i sposobu odtworzenia danych. Sprawdzamy wszystkie kryteria zakresu produktu na telefonie i desktopie, ze szczególnym uwzględnieniem klawiatury, czytelności karty, wolnej sieci i błędów usług.

**Odbiór deploymentu:** komplet MVP.1 działa pod domeną docelową, publiczne strony mogą być indeksowane, sitemap i canonical wskazują domenę produkcyjną, a testowe adresy pozostają wyłączone z indeksowania. Znany jest sposób powrotu do poprzedniego wydania Hosting i odtworzenia danych; powrót frontendu sam w sobie nie cofa zapisów w Firestore. Zapisujemy adres produkcji i wynik sprawdzenia po wdrożeniu.

## Co jest poza tym podziałem

Komentarze, dodawanie źródeł i zdjęć przez użytkowników, panel moderacji, filtrowanie czasu, dodatkowe metody logowania, strony informacyjne oraz SSR. Nie dokładamy ich do ostatniej fazy jako warunku wydania MVP.1.

Szczegółowy plan implementacji rozbije powyższe fazy na zadania i zależności. Warunkiem zamknięcia każdej fazy będzie sprawdzenie jej wdrożonego rezultatu, nie samo ukończenie kodu lokalnie.
