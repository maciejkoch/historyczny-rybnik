# MVP.1 — plan produktu

> Dokument planistyczny. Aktualna implementacja: [TECHNICAL.md](../../../TECHNICAL.md); działające funkcje: [README.md](../../../README.md).

Nazwa aplikacji: **Historyczny Rybnik**. Domena główna: **`historyczny.rybnik.pl`**. Wybór zatwierdzony 4 listopada 2026; domena kupiona przez właściciela w Hostido.

Data rozpoczęcia: 4 listopada 2026.

Status: **etap 3 — plan techniczny; zaakceptowano kierunek UX/UI, marki i typografii**.

MVP.1 powstaje od zera w osobnym repozytorium `maciejkoch/historyczny-rybnik`, utworzonym po wyborze nazwy. Obecne MVP.0 jest materiałem referencyjnym i źródłem danych do przeglądu. Ten dokument nie uruchamia implementacji ani migracji danych.

## 1. Cel i zasady

Użytkownik odkrywa historyczne miejsca Rybnika na mapie, wyszukuje interesujące miejsce i sprawdza opis oraz materiały źródłowe.

Interfejs ma trzy główne elementy: mapę, wyszukiwarkę i szczegóły wybranego miejsca. Projektowanie zaczynamy od telefonu, następnie dopracowujemy desktop.

Wymagania przekazane przez właściciela produktu:

- Mapa zajmuje cały ekran lub jego większość.
- Wyszukiwarka umożliwia znalezienie miejsca.
- Wybór punktu otwiera opis, wycinki ze źródeł i linki.
- Każdy punkt jest osobnym rekordem bazy, z listą referencji i ich datowaniem.
- Dane mają umożliwić przyszłe filtrowanie po czasie; interfejs filtrowania po czasie nie wchodzi do MVP.1.
- Nowa aplikacja korzysta z Firebase i najnowszego Angulara; szczegóły ustalimy w etapie technicznym.
- Katalog obejmuje historyczne miejsca w dzisiejszych granicach Rybnika: firmy, zakłady, szkoły, świątynie i inne instytucje.
- Dostępne są mapa współczesna i przełączany plan historyczny.
- Miejsca bez ustalonej lokalizacji pozostają wyszukiwalne, bez znacznika.
- Bez logowania aplikacja służy wyłącznie do przeglądania. Każdy zalogowany może ustawiać lokalizacje; zapis jest od razu publiczny, bez zatwierdzania przez redakcję.
- W MVP.1 logowanie odbywa się wyłącznie przez Google. Rozbudowa zakładania i obsługi kont jest przewidziana na kolejne wersje, z wykorzystaniem Firebase Authentication.
- Każdy zalogowany może poprawić także lokalizację zapisaną przez inną osobę.
- Na początku jedynym administratorem jest właściciel aplikacji. Rozbudowany model ról i zarządzanie uprawnieniami pozostają na kolejne fazy.
- Aplikacja ma być przyjazna SEO, z poprawnym routingiem. Strona główna `/` pokazuje mapę; każde miejsce ma trwały adres URL.
- Routing ma umożliwiać późniejsze dodanie stron informacyjnych, np. „O mnie” i „Współpraca”. Nie tworzymy ich w obecnym zakresie. W wypowiedzi właściciela padło „w mvp0”; na potrzeby planu przyjmujemy odłożenie tych stron również poza MVP.1.

## 2. Kolejność prac i decyzji

| Etap | Wynik | Warunek przejścia dalej |
| --- | --- | --- |
| 1. Funkcjonalność | Zakres, reguły danych, scenariusze i kryteria odbioru | Uzgodniony zakres MVP.1 |
| 2. UX/UI i marka | Kolory, propozycje designu mobile i desktop, nazwa, logo i domena | Wybrana nazwa, kierunek wizualny i domena |
| 3. Technika | Architektura, schema bazy, przechowywanie plików, mapa, API i zabezpieczenia, plan wdrożenia | Uzgodniony plan implementacji |

Po wyborze nazwy tworzymy nowe repozytorium i przenosimy do niego dokumentację. Zakup domeny jest osobną decyzją; sprawdzenie dostępności nie rezerwuje nazwy.

## 3. Proponowany zakres funkcjonalny

Wymagania z sekcji 1 są zatwierdzone przez właściciela produktu. Pozostałe szczegóły są propozycją; otwarte decyzje zebrano w sekcji 7.

### Mapa

- Po wejściu użytkownik widzi mapę Rybnika i opublikowane miejsca.
- Może przesuwać i przybliżać mapę na telefonie oraz komputerze.
- Wybór istniejącego znacznika otwiera szczegóły miejsca i wyróżnia zaznaczenie.
- W trybie przeglądania zaznaczenie oznacza wybór istniejącego miejsca. Zalogowany użytkownik może dodatkowo wskazać na mapie lokalizację istniejącego rekordu.
- Przy wielu miejscach w jednym budynku użytkownik może wybrać każde z nich. Znaczniki nie mogą wzajemnie blokować dostępu do kart.
- Lokalizacja przybliżona jest jawnie opisana. Można wskazać punkt orientacyjny, np. środek znanej ulicy, ale nie przedstawiamy go jako ustalonej posesji.
- Zamknięcie szczegółów zachowuje położenie mapy i wpisane wyszukiwanie.
- Użytkownik może przełączać mapę współczesną i plan historyczny, zachowując wybrane miejsce. Poza zasięgiem planu interfejs informuje o braku pokrycia; nie sugeruje, że plan obejmuje całe dzisiejsze miasto.

### Wyszukiwarka

- Wyszukuje po nazwie, wariantach nazwy, historycznym i współczesnym adresie oraz dzielnicy, jeśli takie dane są dostępne.
- Ignoruje wielkość liter; wpis bez polskich znaków znajduje odpowiednią nazwę z polskimi znakami.
- Wynik zawiera nazwę i krótki kontekst pozwalający odróżnić podobne miejsca, np. adres lub dzielnicę.
- Wybór wyniku otwiera kartę i wskazuje jego lokalizację, jeżeli jest znana.
- Brak wyników pokazuje czytelny komunikat i możliwość wyczyszczenia zapytania.
- Propozycja: wyszukiwanie obejmuje cały opublikowany katalog, niezależnie od aktualnego kadru mapy.
- Katalog obejmuje także miejsca bez ustalonej lokalizacji. Karta jest dostępna z wyszukiwarki, pokazuje „Lokalizacja nieustalona” i nie ma znacznika do czasu zapisania pozycji.

### Szczegóły miejsca

- Nazwa, krótki opis i adres historyczny; adres współczesny, jeśli został ustalony.
- Informacja o pewności lokalizacji i istotnych rozbieżnościach w źródłach.
- Lista referencji, z tytułem publikacji, datowaniem i stroną lub innym wskazaniem fragmentu, jeśli są znane.
- Wycinki przypisane do konkretnych referencji, z możliwością powiększenia do czytelnego widoku.
- Link do oryginalnego źródła, najlepiej do właściwej strony lub skanu, jeśli wydawca to umożliwia.
- Czytelne rozróżnienie cytatu, odczytu ze skanu i naszego streszczenia.
- Brak wycinka lub daty nie jest zastępowany fikcyjną wartością. Referencja może mieć opis i link bez obrazu.
- Każde miejsce ma bezpośredni, trwały link, który po odświeżeniu odtwarza jego kartę w kontekście mapy. Dotyczy to również miejsc bez ustalonej lokalizacji.

### Routing i SEO

- Strona główna `/` otwiera mapę. Publiczne karty miejsc mają osobne ścieżki; roboczy format: `/miejsca/:slug`. Ostateczny format i sposób zapewnienia trwałości adresów ustalimy technicznie.
- Wejście bezpośrednio w adres karty i odświeżenie strony działają bez wcześniejszego odwiedzenia strony głównej. Wstecz/Dalej w przeglądarce odtwarza właściwy widok.
- Opis miejsca i referencje mają być dostępne dla wyszukiwarek jako treść HTML, bez konieczności interakcji z mapą lub logowania. Sama mapa nie zastępuje indeksowalnej treści.
- Strona główna i każda karta mają odpowiednie tytuły, opisy, nagłówki, adres kanoniczny i metadane udostępniania. Linki do kart są zwykłymi odnośnikami, dostępnymi również poza znacznikami mapy.
- Plan techniczny przyjmuje SSG dla publicznej treści, Firebase Hosting i Functions jako API; mapa działa w przeglądarce. Określa też mapę witryny i reguły indeksowania. Stan mapy, zapytania wyszukiwania i tryb edycji nie powinny tworzyć konkurencyjnych kopii tej samej karty w indeksie.
- Nieistniejące adresy zwracają prawidłowy status 404. Zmiany adresów opublikowanych miejsc wymagają trwałych przekierowań.
- Struktura routingu przewiduje osobne strony informacyjne, np. `/o-mnie` i `/wspolpraca`. Teraz nie publikujemy pustych stron ani linków do nieistniejących podstron.

### Logowanie i ustawianie lokalizacji

- Przeglądanie mapy, wyszukiwanie, karty i źródła nie wymagają konta.
- Jedyną metodą logowania w MVP.1 jest Google. Osobny formularz rejestracji, logowanie hasłem i rozbudowana obsługa kont nie wchodzą do tej wersji.
- Logowanie umożliwia ustawianie lokalizacji istniejących miejsc. Każdy zalogowany użytkownik ma tę możliwość; nie ma etapu zatwierdzania zmian.
- Użytkownik otwiera kartę, uruchamia wskazywanie lokalizacji, klika lub dotyka mapy i widzi podgląd punktu. Dopiero jawny zapis publikuje pozycję; anulowanie nie zmienia danych.
- Zapis jest od razu publiczny i trwały; po odświeżeniu aplikacja pokazuje zapisaną pozycję.
- Można wskazać lokalizację przybliżoną, np. środek ulicy. Samo kliknięcie nie potwierdza historycznej posesji. Propozycja: nowe wskazanie domyślnie ma status przybliżony i krótkie uzasadnienie.
- Każdy zalogowany może poprawiać już zapisane pozycje, również ustawione przez inne osoby. Zmiana jest od razu publiczna.
- W MVP.1 zapisujemy wyłącznie bieżącą lokalizację, jej dokładność i uzasadnienie. Nie przechowujemy historii pozycji ani autorów zmian i nie budujemy cofania zapisów.
- Propozycja: zapis oparty na nieaktualnej wersji rekordu wymaga ponownego sprawdzenia zamiast cicho nadpisywać cudzą zmianę.
- Nieudany zapis pokazuje błąd i zachowuje roboczy punkt do ponowienia; nie jest prezentowany jako opublikowany.
- Wylogowanie kończy możliwość zapisu. Ograniczenie musi obowiązywać także przy bezpośrednim wywołaniu API.
- Jedynym administratorem na początku jest właściciel aplikacji. Nie budujemy w MVP.1 panelu zarządzania rolami; szczegóły uprawnień administratora dopracujemy w planie technicznym. Cofanie zmian nie wchodzi do MVP.1.

### Stany i dostępność

- Osobne komunikaty dla ładowania, pustego katalogu, błędu danych i niedostępnego podkładu mapy.
- Nieudany odczyt danych można ponowić bez ręcznego odświeżania strony.
- Niedostępny wycinek nie blokuje tekstu i pozostałych źródeł.
- Wyszukiwanie, lista wyników, karta i zamykanie powiększenia działają klawiaturą; zaznaczenie jest widoczne.
- Na telefonie klawiatura ekranowa i otwarta karta nie zasłaniają potrzebnych przycisków. Rozmieszczenie ustalimy w etapie UX/UI.

## 4. Reguły treści przed projektem schematu

1. Każdy punkt ma własny trwały identyfikator i osobny rekord w bazie. Dokładny podział rekordów ustalimy w etapie 3.
2. Punkt ma listę referencji. Każda referencja identyfikuje publikację i konkretną wzmiankę, a nie tylko ogólną stronę internetową.
3. Rozdzielamy datę publikacji, datę lub okres opisywanego zdarzenia oraz datę pozyskania materiału. Publikacja z 2019 r. może opisywać obiekt z 1938 r.
4. Datowanie zachowuje dokładność źródła: dzień, miesiąc, sam rok, zakres lub brak ustalenia. Nieznanego dnia nie zastępujemy 1 stycznia.
5. Pierwsza i ostatnia znana wzmianka nie dowodzą nieprzerwanej działalności pomiędzy tymi datami.
6. Zachowujemy niepewne identyfikacje i rozbieżne adresy zamiast automatycznie łączyć wszystkie wzmianki.
7. Współrzędne, pewność lokalizacji i uzasadniające ją źródło są osobnymi informacjami. Dzisiejszy adres nie jest sam w sobie dowodem historycznej lokalizacji.
8. Wycinek ma wskazanie źródła i informację o podstawie wykorzystania; dostępność skanu w internecie nie oznacza automatycznie dowolności publikacji.
9. W przyszłości filtr czasu ma korzystać z dat historycznych i reguł niepewności, nie wyłącznie z roku wydania publikacji. Dokładna semantyka filtra pozostaje poza MVP.1.
10. Data zmiany lokalizacji jest oddzielona od dat historycznych i dat publikacji. Zapis użytkownika nie jest nową historyczną referencją ani automatycznym potwierdzeniem lokalizacji.

Otwarte zagadnienie: co jest jednym punktem, gdy instytucja zmieniała adres? Propozycja: osobne rekordy lokalizacji, powiązane z tą samą instytucją, z referencjami przypisanymi do właściwego miejsca. Nie łączymy automatycznie różnych siedzib w jeden znacznik.

## 5. Poza proponowanym MVP.1

- Oś czasu i filtrowanie po latach.
- Heatmapa ludności i rozbudowane warstwy analityczne z MVP.0.
- Komentarze, ulubione i publiczne tworzenie nowych kart miejsc. Logowanie i ustawianie lokalizacji istniejących kart są w zakresie.
- Rozbudowany panel redakcyjny do opisów, źródeł i plików; sposób przygotowania i publikacji tych danych ustalimy technicznie. Ustawianie lokalizacji odbywa się w aplikacji.
- Trasy zwiedzania, nawigacja, geolokalizacja użytkownika i tryb offline.
- Rozbudowane filtry kategorii, źródeł i pewności; podstawowe informacje pozostają widoczne w kartach.
- Automatyczne pozyskiwanie źródeł, OCR i generowanie opisów.
- Rejestracja przez e-mail, hasła, dodatkowi dostawcy logowania i rozbudowane zarządzanie kontami oraz rolami. Rozwój kont planujemy na Firebase Authentication w kolejnych wersjach.
- Strony „O mnie”, „Współpraca” i inne strony informacyjne. Routing ma pozwalać na dodanie ich później.

## Kolejne wersje — materiały od użytkowników

Właściciel planuje możliwość dodawania przez użytkowników komentarzy, źródeł i zdjęć. Wszystkie te materiały wymagają weryfikacji redaktora przed publikacją. Funkcje te pozostają poza MVP.1, ale architektura powinna umożliwiać ich dodanie.

Zgłoszenia i pliki oczekujące nie są publicznymi materiałami miejsca. Odczyt publiczny, indeks wyszukiwarki i generowanie HTML korzystają wyłącznie z zatwierdzonej treści. Uprawnienia redaktora są osobne od zwykłego zalogowanego użytkownika. Ta decyzja dotyczy nowych materiałów; wcześniej uzgodniony zapis lokalizacji w MVP.1 jest publikowany bez moderacji.

## 6. Kryteria odbioru etapu implementacji

| Scenariusz | Oczekiwany rezultat |
| --- | --- |
| Pierwsze wejście na telefonie i desktopie | Mapa jest głównym widokiem; wyszukiwarka jest od razu dostępna |
| Wybór znacznika | Otwiera właściwą kartę z opisem i referencjami |
| Wyszukanie nazwy, wariantu lub adresu | Właściwe miejsce pojawia się w wynikach; zapytanie bez polskich znaków działa |
| Wybór wyniku z lokalizacją | Karta i mapa wskazują to samo miejsce |
| Kilka miejsc pod tym samym adresem | Każda karta jest dostępna |
| Lokalizacja przybliżona | Użytkownik widzi jej status i wyjaśnienie |
| Otworzenie wycinka | Tekst jest czytelny po powiększeniu, a źródło możliwe do zidentyfikowania |
| Referencja z samym rokiem lub bez daty | Nie pojawia się sztuczna data dzienna |
| Zamknięcie karty | Zachowane są kadr mapy i zapytanie |
| Błąd pobierania danych lub obrazu | Jest zrozumiały komunikat; pozostała dostępna treść nadal działa |
| Obsługa klawiaturą | Można wyszukać i otworzyć miejsce oraz zamknąć kartę i powiększenie |
| Miejsce bez lokalizacji | Jest dostępne z wyszukiwarki, z jawnym komunikatem i bez znacznika |
| Przełączenie podkładu | Wybrane miejsce pozostaje dostępne na mapie współczesnej i planie historycznym w jego zasięgu |
| Brak pokrycia planem historycznym | Użytkownik widzi informację o ograniczonym zasięgu i może wrócić do mapy współczesnej |
| Próba zapisu bez logowania | Zmiana jest odrzucona także przez API; przeglądanie pozostaje dostępne |
| Zalogowany wskazuje lokalizację | Podgląd można zapisać lub anulować; anulowanie nie zmienia opublikowanego rekordu |
| Zalogowany zapisuje lokalizację | Pozycja jest publiczna bez moderacji i pozostaje po odświeżeniu |
| Wskazanie środka ulicy | Punkt jest opisany jako przybliżony, bez deklaracji potwierdzenia posesji |
| Błąd zapisu pozycji | Interfejs nie zgłasza sukcesu i pozwala ponowić zapis |
| Logowanie | Dostępne przez Google; po zalogowaniu użytkownik może ustawiać i poprawiać pozycje |
| Poprawienie pozycji innej osoby | Każdy zalogowany może zapisać poprawkę; staje się ona od razu publiczna |
| Zapis aktualnej pozycji | Aktualizuje bieżącą lokalizację bez tworzenia historii zmian |
| Wejście na `/` | Otwiera mapę jako stronę główną |
| Bezpośredni adres miejsca i odświeżenie | Otwiera właściwą kartę bez wcześniejszej nawigacji, także dla miejsca bez współrzędnych |
| Wstecz/Dalej w przeglądarce | Odtwarza widok wynikający z adresu |
| Odczyt publicznej karty przez wyszukiwarkę | Dostępne są treść opisu, referencje i właściwe metadane bez interakcji z mapą |
| Nieistniejący adres | Pokazuje stronę błędu ze statusem HTTP 404 |
| Zmiana adresu opublikowanej karty | Stary adres trwale przekierowuje do aktualnego |

Sprawdzimy także konflikt równoczesnych poprawek oraz ponowny odczyt po niepewnym wyniku zapisu. Historia i cofanie zmian są poza MVP.1.

## 7. Decyzje otwarte w etapie 1

- Zatwierdzone: historyczne miejsca w dzisiejszych granicach Rybnika, w tym firmy, szkoły, świątynie i instytucje.
- Zatwierdzone: miejsca bez lokalizacji są wyszukiwalne i nie mają znacznika; zalogowany może wskazać pozycję, również przybliżoną.
- Zatwierdzone: mapa współczesna i przełączany plan historyczny.
- Zatwierdzone: każdy zalogowany może ustawiać lokalizacje, a zapis jest od razu publiczny. Bez logowania tylko przeglądanie.
- Zatwierdzone: w MVP.1 logowanie wyłącznie przez Google; rozbudowa kont w kolejnych wersjach na Firebase Authentication.
- Zatwierdzone: każdy zalogowany może poprawiać pozycje innych osób; właściciel jest na początku jedynym administratorem. Rozbudowa ról w kolejnych fazach.
- Zatwierdzone uproszczenie: bez historii zmian lokalizacji i cofania zapisów w MVP.1. Przechowujemy bieżącą lokalizację; licznik wersji służy wyłącznie do wykrywania konfliktów.
- Jednostka katalogu przy przeprowadzkach: propozycja — osobne lokalizacje powiązane wspólną instytucją.
- Zatwierdzone: SEO, mapa jako strona główna i poprawny routing. Bezpośrednie adresy kart są w zakresie; strony informacyjne dopiero później.
- Zawartość startowa: przegląd i selekcja danych MVP.0; bez obietnicy automatycznego przeniesienia całego katalogu. Liczbę i minimalną jakość kart ustalimy przed implementacją.
- Tworzenie kart, opisów i referencji: propozycja — przez właściciela/redakcję. Publiczne zmiany lokalizacji istniejących kart są osobną, zatwierdzoną funkcją.

## 8. Backlog etapu 2 — UX/UI, marka i domena

Wybrano [jasny podkład wektorowy i jeden panel treści](ux-ui.md), z ciemnozielonymi akcentami oraz opcjonalną nakładką planu z 1932 r. Dokument UX/UI zawiera decyzję i wcześniejsze propozycje porównawcze.

Wybrano **Historyczny Rybnik** / `historyczny.rybnik.pl`. Zapis decyzji, wcześniejsze propozycje i ceny: [Nazwa i domena](nazwa-i-domena.md). Domena została zarejestrowana w Hostido; [stan konfiguracji](domena-konfiguracja.md).

- Przygotować propozycje kolorystyki i kierunków wizualnych.
- Pokazać porównywalne propozycje mapy, wyszukiwarki i karty miejsca na telefonie i desktopie.
- Zaprojektować logowanie, wskazywanie pozycji, podgląd, zapis i anulowanie oraz przełącznik podkładów.
- Uwzględnić wejście bezpośrednio na kartę miejsca oraz przyszłą nawigację do stron informacyjnych bez tworzenia tych stron teraz.
- Wybrać nazwę i przygotować logo pasujące do interfejsu oraz małej ikony.
- Sprawdzić dostępność kandydatów domen na żywo, w tym warianty w domenach `rybnik.pl` i `rybnik.com.pl`.
- Dla kandydatów podać rejestratora, cenę rejestracji i odnowienia, okres rozliczenia, VAT oraz datę sprawdzenia. Odróżnić promocję pierwszego roku od kosztu utrzymania.
- Dostępności i cen nie uznawać za potwierdzone bez aktualnego sprawdzenia. Decyzja o nazwie poprzedza utworzenie repozytorium.

## 9. Backlog etapu 3 — technika

Przygotowano [podział wdrożenia na sześć faz](fazy-wdrozenia.md). Każda kończy się działającym deploymentem i odbiorem. Przygotowano [szczegółowy plan implementacji](plan-implementacji.md) z zadaniami, zależnościami i weryfikacją.

Przygotowano [plan techniczny](technika.md) oraz [propozycję modelu danych](model-danych.md). Ustalono SSG + Firebase Hosting + Functions. Szczegóły schematu, edycja Firestore i region pozostają do przeglądu przed implementacją.

Założenia użytkownika: Firebase, najnowszy Angular, Tailwind z konfiguracją brandingu, pliki w Storage, rekordy punktów w bazie, backend i API z App Check.

Do rozstrzygnięcia i udokumentowania:

- Aktualna stabilna wersja Angulara i zgodne wersje narzędzi na dzień rozpoczęcia implementacji.
- Biblioteka UI: ocena m.in. daisyUI pod kątem potrzeb wybranego projektu, dostępności i integracji z Angularem.
- Biblioteka mapy oraz osobno dostawca podkładu: koszty, limity, licencje, atrybucja i obsługa przełączanego planu historycznego oraz jego ograniczonego zasięgu.
- Schema bazy: punkty, instytucje i ich lokalizacje, referencje, publikacje, datowanie, pewność oraz pliki; granice dokumentów i reguły spójności.
- Sposób wyszukiwania nazw i adresów oraz koszt odczytów mapy i katalogu.
- Storage: oryginały i miniatury, ścieżki, metadane, dostęp oraz proces publikacji.
- Backend i granice API: co obsługuje backend, a co klient; walidacja danych i błędów.
- App Check: sprawdzanie tokenów w API; osobno uprawnienia do odczytu/zapisu i ochrona przed nadużyciami.
- Logowanie: Google przez Firebase Authentication, weryfikacja zalogowania po stronie zapisu i dostęp każdego zalogowanego do ustawiania oraz poprawiania lokalizacji; bez moderacji przed publikacją. Uwzględnić przyszłe dodanie innych metod logowania i łączenie tożsamości.
- Administrator: przypisanie roli właścicielowi po trwałym identyfikatorze konta, zakres operacji administratora i egzekwowanie uprawnień po stronie backendu. Bez panelu zarządzania rolami w MVP.1.
- Zmiany lokalizacji: zapis bieżącej pozycji i czasu aktualizacji, spójność zapisów oraz konflikty edycji. Bez historii autora, poprzednich wartości i mechanizmu cofania.
- Sposób redakcji, importu i walidacji danych bez budowania panelu administratora.
- Środowiska, hosting, konfiguracja domeny, monitoring, kopie danych i przewidywane koszty.
- Plan budowy od zera oraz kontrolowany import wybranych danych MVP.0.
- Routing i SEO: prerender (SSG) publicznej treści i mapa działająca w przeglądarce, trwałe adresy i slugi, canonical, metadane, sitemap, robots, statusy HTTP i przekierowania. Zapewnić możliwość dodawania stron informacyjnych poza widokiem mapy.

Kierunek architektury i bibliotek opisuje plan techniczny; model danych zawiera propozycje do zatwierdzenia. Uszczegółowienie API, dostawcy mapy i konfiguracji usług poprzedza implementację.
