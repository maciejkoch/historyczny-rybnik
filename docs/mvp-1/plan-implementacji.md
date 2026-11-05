# MVP.1 — plan implementacji

Data: 5 listopada 2026. Status: **faza 1 wdrożona i odebrana — 5 listopada 2026**. [Zapis odbioru fazy 1](odbior-fazy-1.md).

Podstawa: [fazy wdrożenia](fazy-wdrozenia.md), [zakres produktu](README.md), [technika](technika.md), [model danych](model-danych.md), [UX/UI](ux-ui.md).

## Zasady realizacji

- Sześć faz wykonywanych kolejno. Każda kończy się deploymentem, sprawdzeniem działającego adresu i krótkim zapisem wyniku odbioru w repo.
- Fazy 1–4: Hosting preview; fazy 5–6: produkcja pod `historyczny.rybnik.pl`. Preview nie jest osobnym backendem — jego konfiguracja musi wskazywać środowisko testowe.
- Faza 2 obejmuje od razu mapę współczesną i plan z 1932 r. z suwakiem przezroczystości.
- Faza 3 dostarcza całą infrastrukturę miejsc, API odczytu i zapisu oraz jedną kompletną kartę. Faza 4 dodaje interfejs logowania i edycji do już działających usług.
- Od fazy 3 do końca fazy 5 wdrożony katalog zawiera dokładnie jeden zweryfikowany kościół. Dodatkowe przypadki sprawdzamy na danych lokalnych/emulatorach. Cały katalog importujemy dopiero w fazie 6.
- Jedna kolekcja `places`, z referencjami wewnątrz dokumentu. Bez historii zmian, podkolekcji, rejestru żądań i cofania. `locationVersion` chroni tylko przed konfliktem zapisu.
- Statyczne HTML opisów i referencji, mapa w przeglądarce, Functions jako API. Zmiana pozycji nie uruchamia deploymentu frontendu.
- Nie dodajemy komentarzy, zgłaszania materiałów, moderacji, filtra czasu, SSR ani stron informacyjnych.

## Decyzje przed zadaniami, których dotyczą

Nie blokujemy całej pracy wyborami potrzebnymi dopiero w późniejszej fazie.

| Kiedy | Decyzja / sprawdzenie | Wynik do zapisania |
| --- | --- | --- |
| Początek fazy 1 | Aktualna stabilna wersja Angulara, zgodność Node i bibliotek | Wersje przypięte lockfile, wymagania uruchomienia |
| Przed publikacją fazy 2 | Dostawca kafelków wektorowych, glifów i ikon | Styl, atrybucja, limity i koszty; ograniczenia klucza przeglądarkowego |
| Początek fazy 2 | Plik planu z 1932 r., prawa i georeferencja | Źródło pliku, podstawa publikacji, zakres i sposób serwowania |
| Początek fazy 3 | Edycja Firestore, region i izolacja test/produkcja | Jawna konfiguracja projektów, bazy, Storage, Functions i kont usług |
| Przed provisioningiem fazy 3 | Stan rozliczeń i wymagania usług | Zweryfikowana konfiguracja, przewidywane obszary kosztów i alert budżetowy |
| Początek fazy 3 | Wybór jednego rzeczywistego kościoła | Sprawdzony adres i pozycja, opis, referencje oraz prawa do obrazów |
| Przed API zapisu w fazie 3 | Kto może usuwać już ustawioną pozycję | Jedna reguła obowiązująca w API i interfejsie |

Dla izolacji danych proponujemy osobny projekt testowy, zamiast rozdzielania danych dodatkowymi kolekcjami w produkcji. Konkretna konfiguracja wymaga rozstrzygnięcia przed fazą 3; nie tworzymy projektu w ramach pisania tego planu. Nie traktujemy wcześniejszej propozycji Enterprise ani Warszawy jako zatwierdzonego wyboru.

## Faza 1 — podstawa i marka

**Zależności:** zaakceptowane kierunki UX/UI oraz repozytorium. Brak zależności od Firestore.

- [x] **1.1 Szkielet Angulara.** Utworzyć aplikację CLI w istniejącym repo bez nadpisania dokumentacji. Włączyć routing i prerender; skonfigurować wyjście statyczne. Zapisać polecenia instalacji, developmentu i builda.
- [x] **1.2 Marka.** Dodać Tailwind i daisyUI, wspólne tokeny wybranej palety, lokalne fonty Lora i Source Sans 3 z polskimi znakami. Przygotować wybrane logo „Ryba na mapie” jako SVG oraz faviconę; zachować planszę koncepcyjną jako materiał referencyjny.
- [x] **1.3 Układ.** Zbudować główny obszar mapy i jeden panel treści: po lewej na desktopie, zgodnie z układem mobilnym na telefonie. Przygotować fokus, semantyczne przyciski i podstawowe stany ładowania/błędu. Na tym etapie mapa może być pustym obszarem; nie prezentować niedziałającego zapisu.
- [x] **1.4 Hosting i build.** Skonfigurować statyczne zasoby, prawdziwe 404 oraz preview z `noindex`. Ustalić powtarzalny build i publikację; CI co najmniej sprawdza instalację z lockfile i build. Uprawnienia deploymentu nie trafiają do repo ani frontendu.
- [x] **1.5 Deployment i odbiór.** Opublikować preview i zapisać adres oraz commit.

**Sprawdzenie:** build przechodzi; HTTPS, logo i fonty działają na wdrożeniu; układ jest czytelny na telefonie i desktopie; `/` działa po odświeżeniu, nieznany URL zwraca HTTP 404. Nie są wymagane testy jednostkowe odtwarzające sam układ CSS.

**Wynik:** dostępny szkielet aplikacji z marką, bez mapy i usług danych.

## Faza 2 — mapa współczesna i plan historyczny

**Zależności:** faza 1, wybór podkładu i możliwość publikacji planu z 1932 r.

- [ ] **2.1 Podkład wektorowy.** Dodać bezpośrednią integrację MapLibre, inicjalizowaną tylko w przeglądarce. Wprowadzić styl zgodny z paletą: jasny teren, stonowane budynki i zieleń, niebieskoszara woda oraz ciemnozielone znaczniki. Ustawić początkowy kadr Rybnika i atrybucję.
- [ ] **2.2 Plan historyczny.** Przygotować plan do nakładania na współczesne współrzędne, sprawdzić dopasowanie na kilku rozpoznawalnych punktach. Dobrać raster lub kafelki do rozmiaru pliku i płynności na telefonie. Jeśli plik wymaga serwowania już teraz, wdrożyć niezbędne statyczne zasoby w tej fazie, bez czekania na infrastrukturę miejsc.
- [ ] **2.3 Warstwy.** Dodać przełącznik planu i suwak 0–100% z opisem dostępnym dla klawiatury/czytnika. Zachować kadr i zaznaczenie podczas przełączania. Pokazać ograniczony zasięg nakładki i komunikat poza pokryciem.
- [ ] **2.4 Wybór miejsca.** Na jawnie przykładowych danych lokalnych sprawdzić znacznik, wyróżnienie wyboru i otwieranie jednego panelu. Zamknięcie panelu zachowuje kadr. Przy niedostępnym WebGL/podkładzie nadal dostępna jest treść i komunikat.
- [ ] **2.5 Deployment i odbiór.** Wdrożyć oba podkłady oraz potrzebne pliki i konfigurację dostawcy na preview.

**Sprawdzenie:** build nie inicjalizuje WebGL; obie mapy działają na wdrożeniu mobilnym i desktopowym; suwak zmienia faktyczne krycie, w tym krańce 0 i 100%; wyłączenie planu odsłania uzgodniony styl wektorowy. Sprawdzić klawiaturę suwaka, zasięg i podstawowe dopasowanie planu.

**Wynik:** działająca mapa współczesna i historyczna, bez katalogu w Firestore. Jeśli plan jest zablokowany przez brak pliku/praw, faza pozostaje nieukończona; nie zastępujemy go fikcyjnym obrazem.

## Faza 3 — infrastruktura miejsc, API, wyszukiwanie i SEO

**Zależności:** faza 2 i decyzje infrastrukturalne z tabeli. To pełna ścieżka danych miejsc; nie jest to import całego katalogu.

- [ ] **3.1 Konfiguracja usług.** Zweryfikować aktualny stan projektu, instancje i edycję bazy przed utworzeniem zasobów. Skonfigurować Firestore, Storage, Functions, Authentication Google, App Check, domeny testowe i konta usług. Zapisać jawne identyfikatory środowisk oraz regiony. Oddzielić uprawnienia importu/CI od API użytkownika.
- [ ] **3.2 Kontrakt miejsca i walidacja.** Zdefiniować model z `model-danych.md` oraz DTO odczytu i zapisu. Walidować wymagane pola, daty częściowe, slugi, współrzędne, referencje, rozmiar dokumentu i dozwolone pola aktualizacji. Nie dodawać kolejnych kolekcji.
- [ ] **3.3 Import jednego kościoła.** Zweryfikować źródła i lokalizację wybranego obiektu. Przygotować plik wejściowy oraz prosty importer z trybem podglądu, stabilnym ID i ponawialnym zapisem. Zaimportować dokładnie jeden rzeczywisty dokument i jego dozwolone pliki. Usunąć dane przykładowe z wdrożonego katalogu. Dodatkowe warianty testowe trzymać lokalnie.
- [ ] **3.4 Odczyt.** Wdrożyć API zwracające bieżącą pozycję, dokładność, wyjaśnienie, wersję i czas dla publicznych miejsc z katalogu frontendu. Egzekwować App Check, ograniczenia wejścia i odpowiedzi; nie ujawniać draftów ani prywatnych pól. Dane opisu i referencji dla SSG pobiera CI przez ścieżkę serwerową z właściwymi uprawnieniami.
- [ ] **3.5 Zapis.** Wdrożyć callable zmiany lokalizacji: Auth + App Check, tylko istniejące publiczne miejsce, tylko dozwolone pola. Transakcja sprawdza `expectedLocationVersion`, zapisuje `location`, zwiększa wersję i ustawia `updatedAt`. Nie zapisuje autora, poprzednich wartości ani historii. Uwzględnić uzgodnioną regułę usuwania pozycji. API ma być sprawdzone przed końcem tej fazy, mimo braku interfejsu edycji.
- [ ] **3.6 Dostęp do danych i plików.** Zamknąć bezpośredni zapis klienta do Firestore. Przyjąć serwerowy odczyt danych przez API, bez bezpośredniego dostępu przeglądarki do bazy. Publiczne wycinki udostępnić bez logowania, prywatne pliki pozostawić niedostępne. Backend weryfikuje uprawnienia niezależnie od reguł klienta. Napisać i sprawdzić niezbędne reguły dopiero w implementacji.
- [ ] **3.7 SSG i routing.** Pobrać dane wejściowe jednego builda do lokalnego pliku CI. Wygenerować `/` i `/miejsca/:slug`, opisy, referencje, tytuły, canonical, Open Graph i sitemapę. Skonfigurować brak fallbacku do serwera, rzeczywiste 404 oraz przekierowania ze starych slugów. Szkielet mapy pozostaje częścią strony, sama mapa uruchamia się po stronie klienta.
- [ ] **3.8 Wyszukiwanie i karta.** Generować lekki indeks nazw, aliasów, adresów i dzielnic. Filtrować lokalnie, normalizując wielkość liter i polskie znaki. Dodać listę wyników, pusty wynik, opis, referencje, daty, linki i powiększanie wycinków. Lista i karta zajmują ten sam panel; powrót odtwarza zapytanie i przewinięcie. URL i Wstecz/Dalej sterują wyborem bez niepotrzebnego tworzenia mapy od nowa.
- [ ] **3.9 Deployment i odbiór.** Wdrożyć konfigurację usług, reguły, potrzebne indeksy, API i frontend preview. Utrzymać dokładnie jeden kościół w katalogu. Preview pozostaje `noindex`; testowe dane App Check nie są umieszczane w publicznym bundle.

**Sprawdzenie:** celowane testy walidacji i transakcji w emulatorach obejmują brak Auth, draft, niedozwolone pola i dwa równoczesne zapisy. Na wdrożeniu osobno sprawdzić egzekwowanie App Check, ponieważ emulator nie zastępuje tej kontroli. Zapis bez interfejsu można sprawdzić lokalnym klientem testowym z prawidłowo uzyskanymi tokenami, bez publicznej furtki testowej.

Sprawdzić surowy HTML bez JS, statusy HTTP, sitemapę, brak prywatnych danych w artefaktach, bezpośredni URL, odświeżenie i Wstecz/Dalej. Lokalnie sprawdzić miejsce bez pozycji i źródło bez skanu. Jeden kościół na preview musi przejść pełną ścieżkę wyszukania i odczytu. Po próbach API przywrócić jego sprawdzoną pozycję.

**Wynik:** kompletna infrastruktura miejsc i działająca karta z wyszukiwaniem/SEO. Funkcje logowania i zapisu mają gotowy backend; ich docelowy interfejs powstaje w fazie 4.

## Faza 4 — interfejs logowania i zmiany pozycji

**Zależności:** gotowe API odczytu i zapisu, Google Auth i App Check z fazy 3. Bez nowych kolekcji i bez rozszerzania katalogu.

- [ ] **4.1 Logowanie.** Dodać wejście przez Google, stan zalogowania i wylogowanie. Auth inicjalizować w przeglądarce; logowanie nie blokuje publicznej treści. Obsłużyć anulowanie i nieudane logowanie na urządzeniu mobilnym.
- [ ] **4.2 Edycja.** Dodać akcję ustawienia/poprawienia lokalizacji. Kliknięcie lub dotyk mapy tworzy roboczy punkt; użytkownik wybiera dokładność i wpisuje wyjaśnienie. Interfejs wyraźnie oddziela podgląd od zapisanej pozycji i informuje o natychmiastowej publikacji. Domyślnie nowy punkt jest przybliżony.
- [ ] **4.3 Zapis i błędy.** Podłączyć callable z oczekiwaną wersją. Zablokować wielokrotne kliknięcie w trakcie żądania, zachować podgląd przy błędzie, obsłużyć konflikt i wygaśnięcie logowania. Po niepewnym wyniku odczytać aktualny stan zamiast ślepo ponawiać zapis.
- [ ] **4.4 Odczyt po zmianie.** Odświeżyć marker i informację w karcie po potwierdzonym zapisie. Inne sesje widzą zmianę po ponownym pobraniu danych; nie budujemy pełnej synchronizacji w czasie rzeczywistym. Anulowanie nie zapisuje niczego.
- [ ] **4.5 Deployment i odbiór.** Wdrożyć frontend na preview, nadal z jednym kościołem. API zmieniać tylko, jeśli integracja ujawni błąd kontraktu; nie odkładać brakujących endpointów z fazy 3.

**Sprawdzenie:** dwa różne zalogowane konta mogą kolejno poprawić to samo miejsce; zapis utrzymuje się po odświeżeniu bez deploymentu HTML. Anulowanie i wylogowanie nie publikują podglądu. Odtworzyć konflikt dwóch sesji, brak sieci i błąd zapisu. Sprawdzić klawiaturę oraz mapę z włączonym planem. Po odbiorze przywrócić kościołowi zweryfikowaną pozycję.

**Wynik:** komplet przepływu użytkownika — przeglądanie, logowanie i edycja bieżącej lokalizacji, bez historii.

## Faza 5 — gotowość i deployment produkcyjny

**Zależności:** odebrane fazy 1–4. W produkcji nadal tylko jeden kościół.

- [ ] **5.1 Konfiguracja produkcji.** Odtworzyć konfigurację usług i dostępu dla produkcji z tym samym kontraktem. Ustawić domenę i HTTPS, autoryzowane domeny Google, App Check, regiony, dostęp kont usług oraz konfigurację dostawcy map. Nie przenosić danych testowych ani tokenów debug.
- [ ] **5.2 Dane i publikacja.** Przenieść tylko sprawdzony rekord kościoła, zachowując stabilne ID i pliki. Zbudować wersję produkcyjną z właściwym canonical i sitemapą. Wyłączyć `noindex` tylko na produkcji; adresy preview pozostawić poza indeksem.
- [ ] **5.3 Utrzymanie.** Włączyć podstawowe logi błędów frontendu/API i monitorowanie usług bez logowania tokenów. Ustawić alerty kosztowe. Wybrać prosty sposób backupu i odtworzenia Firestore oraz plików; sprawdzić odtworzenie na danych testowych. Zapisać procedurę rollbacku Hosting, która nie jest cofnięciem zapisów w bazie.
- [ ] **5.4 Odbiór całości.** Przejść kryteria produktu na telefonie i desktopie, także przy wolnej sieci, awarii podkładu i niedostępnym obrazie. Poprawić błędy blokujące wyszukiwanie, czytanie lub zapis. Nie rozszerzać zakresu funkcji.
- [ ] **5.5 Deployment i odbiór.** Opublikować pod `historyczny.rybnik.pl`; sprawdzić HTTPS, HTML bez JS, metadane, 404, oba podkłady, Google login, zapis i odczyt bieżącej pozycji. Zapisać commit i adres wydania.

**Wynik:** aplikacja produkcyjna z pełnym zakresem funkcji i jednym kościołem. To nie zamyka jeszcze zasilenia MVP.1.

## Faza 6 — cały katalog i końcowe wydanie

**Zależności:** działająca produkcja z fazy 5. Nie budujemy nowej infrastruktury ani nowych funkcji.

- [ ] **6.1 Inwentaryzacja.** Przejrzeć cały katalog MVP.0 i materiały. Dla każdego rekordu ustalić docelowy dokument, kompletność danych oraz możliwość publikacji plików. Zachować brak współrzędnych i niepełne daty, zamiast je zgadywać.
- [ ] **6.2 Przygotowanie importu.** Uporządkować nazwy, aliasy, adresy, referencje i slugi. Zapisać mapowanie starych ID do nowych w pliku importu, bez osobnej kolekcji. Rozpoznać istniejący rekord kościoła i zachować jego ID. Jawnie rozstrzygnąć ewentualne konflikty z pozycjami zmienionymi przez użytkowników.
- [ ] **6.3 Walidacja i próba lokalna.** Użyć importera z fazy 3 w trybie podglądu, sprawdzić kolizje slugów, poprawność dat, rozmiary dokumentów, ścieżki i prawa do plików. Przeprowadzić próbę pełnego zbioru lokalnie, również wyszukiwanie, wiele miejsc w jednym budynku i rekordy bez lokalizacji.
- [ ] **6.4 Import i build.** Wykonać kopię bieżących danych, kontrolowany import do produkcyjnego `places` i Storage oraz build stron dla całego publicznego katalogu. Podczas publikacji spójnie wdrożyć HTML i indeks; stary frontend nie pobiera znaczników nowych kart spoza swojego katalogu. Nie nadpisywać bieżących pozycji bez rozstrzygnięcia konfliktu.
- [ ] **6.5 Deployment i raport.** Opublikować HTML, indeks, sitemapę i przekierowania. Zapisać liczbę przejrzanych, opublikowanych i wyłączonych rekordów oraz miejsc bez pozycji. Wyjaśnić każdy rekord niedopuszczony do publikacji; nie pomijać go bez śladu.

**Sprawdzenie:** liczba publicznych kart zgadza się z raportem i sitemapą; kościół nie jest zdublowany; wyszukiwanie, kilka miejsc pod jednym adresem, wycinki i URL-e działają na pełnym zbiorze. Porównać czas ładowania i płynność mapy z wersją jednoelementową; poprawić stwierdzone problemy bez dokładania nowych usług na zapas.

**Wynik:** końcowe wydanie MVP.1 z przejrzanym całym katalogiem. Nieuzasadnione braki danych pozostają widoczne w raporcie, nie są uzupełniane fikcyjnymi wartościami.

## Zapis odbioru każdej fazy

Po wdrożeniu dopisujemy do dokumentacji: numer fazy, datę, commit, adres i środowisko, wynik sprawdzenia wdrożenia oraz otwarte usterki blokujące odbiór. Zaznaczenie zadań nie zastępuje działającego deploymentu. Następną fazę rozpoczynamy po spełnieniu kryteriów poprzedniej.

Realizację fazy 1 rozpoczęto 5 listopada 2026 na zlecenie właściciela. Wynik publikacji i kontroli zapisujemy w [odbiorze fazy 1](odbior-fazy-1.md).
