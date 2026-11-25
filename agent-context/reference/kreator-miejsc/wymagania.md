# Kreator miejsc z pomocą AI — wymagania

> Status: plan funkcji MVP, 24 listopada 2026. Dokument opisuje uzgodnione wymagania i propozycje do dopracowania, a nie funkcję dostępną w aplikacji. Aktualny stan opisują [README](../../../README.md) i [TECHNICAL](../../../TECHNICAL.md). Obowiązujący model danych określają kontrakty w kodzie; ich opis zawiera [schemat miejsca](../place-schema.md).

## Cel i dostęp

Kreator pozwala administratorowi dodawać i edytować miejsca w aplikacji, łącząc ręczny formularz z pomocą AI w opracowaniu danych i materiałów źródłowych. Zmiany trafiają do wspólnego szkicu. Do chwili jawnej publikacji odbiorcy widzą dotychczasową wersję miejsca.

Kreator jest dostępny wyłącznie administratorom. Odnośnik „Kreator” w menu otwiera osobną stronę. MVP obejmuje interfejs desktopowy; widok mobilny pozostaje poza zakresem. Odbiór implementacji ma być lokalny.

## Lista miejsc

Lista umożliwia wyszukiwanie po nazwie, edycję miejsca i utworzenie nowego. Pokazuje, czy miejsce jest opublikowane, ma nieopublikowane zmiany, czy jest nowym szkicem. Nowy, nieopublikowany szkic można usunąć. Usuwanie i wycofywanie opublikowanych miejsc nie wchodzi do MVP.

„Edytuj” otwiera aktualny szkic; gdy nie ma zmian roboczych, punktem wyjścia są dane opublikowane. „Dodaj nowe miejsce” otwiera pusty formularz nowego szkicu.

## Instrukcje dla AI

Agent otrzymuje stałą instrukcję określającą cel i kontekst pracy: przygotowywanie oraz edycję historycznych miejsc Rybnika, przede wszystkim z okresu przedwojennego. Instrukcja obejmuje znaczenie modelu miejsca, pracę ze źródłami i narzędziami, oznaczanie niepewności, pytanie o niejasne polecenia oraz przedstawianie zmian do akceptacji. Stałe zasady są utrzymywane wraz z aplikacją.

Na stronie listy miejsc administrator ma dostęp do sekcji **„Instrukcje dla AI”**. Może tam edytować i zapisać dodatkowe wskazówki redakcyjne, np. dotyczące stylu opisów lub sposobu pracy ze źródłami, oraz przywrócić domyślne wskazówki. Interfejs informuje, że wskazówki są wspólne dla administratorów, i pokazuje czas ostatniej zmiany. Zapisana konfiguracja jest przekazywana agentowi przy kolejnych uruchomieniach bez potrzeby wydania nowej wersji aplikacji.

Dodatkowe wskazówki uzupełniają stałe zasady; nie mogą ich znosić ani obchodzić autoryzacji, walidacji lub akceptacji zmian. Uprawnienia i walidacja są egzekwowane przez backend niezależnie od instrukcji dla modelu. To konfiguracja promptu, nie trenowanie ani fine-tuning modelu. Wskazówki są zapisywane niezależnie od historii rozmowy, która w MVP nie jest trwale przechowywana.

## Edytor

Edytor ma trzy sąsiadujące panele, których szerokość można zmieniać:

1. **AI:** rozmowa, dokumenty, postęp pracy i propozycje zmian.
2. **Edycja ręczna:** formularz miejsca, wzmianek, materiałów i lokalizacji.
3. **Podgląd:** karta oparta na zapisanym szkicu albo, podczas pracy z AI, na wyraźnie oznaczonej propozycji.

### Asystent znający model miejsca

AI jest asystentem tworzenia i edycji aktualnie otwartego miejsca. Zna aktualny schemat i semantykę pól, wzmianek, materiałów, powiązań oraz lokalizacji; otrzymuje aktualny stan formularza i wie, jakie dokumenty są dostępne. Wynik musi odpowiadać obowiązującemu modelowi i przejść walidację aplikacji.

AI rozumie kontekst bieżącej rozmowy i wykorzystuje go do interpretowania poleceń, takich jak „dodaj wzmiankę”, „zrób wycinek ze skanu na stronie 5” czy „uzupełnij źródło tej wzmianki”. Powinno ograniczać zmiany do wskazanego zakresu. Gdy nie da się jednoznacznie ustalić intencji albo obiektu zmiany, prosi o doprecyzowanie. Nie wymyśla nieznanych danych.

Administrator przekazuje polecenia w rozmowie, może wkleić jeden lub wiele linków bezpośrednio do wiadomości i załączyć PDF-y. AI korzysta z rozmowy, podanych linków, dokumentów i bieżącego formularza. Wskazuje, które źródła odczytało, a których nie udało się otworzyć; niedostępność jednego źródła nie oznacza automatycznie niedostępności pozostałych. Samodzielne wyszukiwanie w internecie nie jest wymagane w MVP i może zostać dodane później.

Historia rozmowy jest zachowana w bieżącej sesji edycji, lecz nie jest trwale zapisywana. Po ponownym otwarciu miejsca czat jest pusty, a formularz zawiera zapisany szkic.

### Dokumenty i skany

Załączone PDF-y pozostają przypisane do szkicu i są dostępne przy kolejnym otwarciu edytora. Panel pokazuje dokumenty i umożliwia ich usuwanie. Cykl życia dokumentów po publikacji, przywróceniu wersji i usunięciu szkicu wymaga rozstrzygnięcia technicznego.

AI może przeanalizować wielostronicowy PDF, wybrać właściwą stronę i przygotować pełny skan z ramką wokół właściwego fragmentu. Jeżeli wynika to z polecenia lub kontekstu, dodaje materiał i wiąże go z właściwą wzmianką. Administrator ocenia rezultat. W formularzu nie rysuje ręcznie ramki.

### Praca AI i zatwierdzanie zmian

Interfejs pokazuje, że AI pracuje, i przedstawia możliwie szczegółowy, rzeczywisty postęp — zakres dostępnych informacji zależy od wybranego rozwiązania. Nie należy sugerować działań, których nie można potwierdzić. Podczas pracy AI formularz jest tylko do odczytu.

Dla **nowego i istniejącego miejsca** AI na bieżąco przygotowuje tymczasową propozycję. Formularz i karta podglądu pokazują jej kolejne wyniki podczas pracy agenta, np. nową wzmiankę, przygotowany skan i ich powiązanie. Proponowane pola i materiały są wyraźnie oznaczone jako niezatwierdzone; ich pojawienie się zależy od dostępności użytecznego wyniku danego kroku. Propozycja nie zmienia zapisanego szkicu ani wersji publicznej.

Po zakończeniu pracy administrator może wybrać **„OK”**, **„Odrzuć”** albo wysłać kolejne polecenie, aby agent kontynuował i poprawił tę samą propozycję w kontekście rozmowy. „OK” zatwierdza przedstawiony wynik i powoduje jego walidację oraz zapis do szkicu; „Odrzuć” usuwa propozycję z widoku i przywraca widok zapisanego szkicu. Obie akcje dotyczą tak samo nowych, jak i istniejących miejsc. Publikacja pozostaje osobną decyzją.

Przed uruchomieniem agenta aplikacja kończy trwający automatyczny zapis ręcznych zmian. Jeśli zapis się nie uda, informuje o tym i nie uruchamia agenta na nieaktualnym szkicu. Zatwierdzenie odnosi się do konkretnej przedstawionej propozycji i wersji szkicu: jeśli w międzyczasie inny administrator zmienił szkic, aplikacja zgłasza konflikt zamiast nadpisać zmiany. Przy błędzie zapisu lub zerwanym połączeniu nie przedstawia propozycji jako zapisanej; sposób odzyskania stanu i tymczasowych materiałów zostanie określony w architekturze.

Propozycja musi być zrozumiała przed akceptacją. Pokazuje, jakiego pola, wzmianki lub materiału dotyczy; przy zmianie tekstu pokazuje dotychczasową i pełną proponowaną treść. Nową wzmiankę przedstawia z jej treścią, nowy skan jako podgląd, a usunięcie jednoznacznie wskazuje usuwany element. Jeśli AI powołuje się na źródło, pokazuje je wraz z dostępnym wskazaniem, np. stroną dokumentu. Przy kilku zmianach każdą przedstawia w sposób pozwalający ją ocenić. Szczegółowy sposób zatwierdzania części zestawu wymaga dopracowania.

## Formularz ręczny

Formularz odzwierciedla aktualny model miejsca i umożliwia edycję jego danych. Zmiany zapisują się automatycznie do szkicu.

### Miejsce

- nazwa, slug i krótki opis;
- tagi wraz z kolejnością — pierwszy określa ikonę miejsca;
- udokumentowany okres: początek i koniec;
- informacja, czy miejsce istnieje współcześnie: tak, nie lub nie wiadomo;
- adres historyczny;
- lokalizacja, wzmianki oraz materiały opisane poniżej.

Daty zachowują znaną dokładność: rok, miesiąc lub pełną datę. Nieznane dane pozostają nieustalone.

### Wzmianki

Administrator może dodawać, edytować i usuwać wzmianki. Każda obejmuje tytuł, opis lub streszczenie, datę publikacji źródła, datę lub okres opisywanego zdarzenia, nazwę i link do źródła, wskazanie fragmentu (np. stronę PDF) oraz powiązania z materiałami miejsca.

### Materiały

Administrator może dodawać i usuwać zdjęcia oraz skany, edytować dane materiałów i wskazać jeden materiał główny. Galeria obejmuje także skany z ramką przygotowane przez AI. Materiał może być powiązany ze wzmiankami.

Dane materiału obejmują plik, tekst alternatywny, datę, nazwę i link do źródła oraz oznaczenie materiału głównego. Identyfikatory, ścieżki, wymiary i sumy kontrolne wynikające z kontraktu obsługuje aplikacja. Osoba dodająca materiał odpowiada za prawo do jego udostępnienia; stan praw lub brak potwierdzenia nie blokuje dodawania ani wyświetlania.

### Lokalizacja

Pod formularzem znajduje się mapa umożliwiająca wskazanie punktu, określenie dokładności jako dokładna albo przybliżona i dodanie opcjonalnego wyjaśnienia. Lokalizacja może pozostać nieustalona. Zmiana w kreatorze trafia do szkicu i staje się publiczna przy jego publikacji.

## Zapis, podgląd i publikacja

Szkic jest wspólny dla administratorów. Ręczne zmiany zapisują się automatycznie; interfejs pokazuje stan zapisu: zapisywanie, powodzenie lub błąd. Nieudany zapis musi być widoczny i możliwy do ponowienia. Poza trybem propozycji AI podgląd pokazuje aktualny **zapisany** stan szkicu. Podczas przygotowywania i oceny propozycji pokazuje zapisany szkic wraz z tymczasowymi zmianami AI, wyraźnie oznaczonymi jako niezatwierdzone. Oba widoki odróżniają się od wersji publicznej.

Przycisk „Publikuj” publikuje zapisany szkic: tworzy publiczną kartę nowego miejsca albo zastępuje opublikowaną wersję istniejącego. Przed publikacją aplikacja sprawdza dane wymagane przez kontrakt. Miejsce można opublikować bez lokalizacji, zdjęcia i innych niewymaganych danych.

„Przywróć opublikowaną wersję” odrzuca nieopublikowane zmiany istniejącego miejsca i przywraca jego publiczne dane, w tym lokalizację i materiały. Dokumenty PDF i historia rozmowy są odrębnymi zagadnieniami: historia nie jest trwale zapisywana; sposób traktowania PDF-ów przy przywracaniu wymaga decyzji.

## Scenariusze

### Nowe miejsce

1. Administrator wybiera „Dodaj nowe miejsce”.
2. Wprowadza dane ręcznie lub przekazuje AI polecenia, linki i PDF-y.
3. AI przygotowuje propozycję, a formularz i karta na bieżąco pokazują jej oznaczone wyniki, w tym materiały i powiązania.
4. Administrator może poprosić AI o poprawki, zatwierdzić propozycję albo ją odrzucić. Zatwierdzona propozycja zapisuje się do szkicu; odrzucenie jej nie zmienia.
5. Administrator sprawdza zapisany szkic i publikuje go osobną akcją.

### Edycja istniejącego miejsca

1. Administrator wyszukuje miejsce i otwiera jego szkic; czat zaczyna się od pustej rozmowy.
2. Poprawia dane ręcznie albo prosi AI o przygotowanie zmiany.
3. Podczas pracy AI formularz jest tylko do odczytu. Formularz i podgląd na bieżąco pokazują oznaczone propozycje AI.
4. Administrator może poprosić AI o poprawki, zatwierdzić propozycję albo ją odrzucić. Po zapisie sprawdza szkic i publikuje go albo przywraca wersję opublikowaną.

## Kryteria odbioru

- Dostęp do kreatora i jego operacji jest ograniczony do administratorów także po stronie serwera.
- Administrator może znaleźć miejsce, otworzyć jego szkic, utworzyć nowe miejsce i usunąć nieopublikowany nowy szkic.
- Formularz obsługuje dane aktualnego modelu miejsca, wzmianki, materiały i lokalizację.
- Szkic zapisuje się automatycznie i jest dostępny po ponownym otwarciu; błędy zapisu nie są prezentowane jako sukces.
- PDF-y pozostają dostępne przy ponownym otwarciu; historia rozmowy nie jest odtwarzana.
- Agent otrzymuje stałe instrukcje o celu i kontekście projektu. Administrator może z listy miejsc zapisać lub przywrócić wspólne dodatkowe wskazówki, które działają bez wydania aplikacji i nie omijają zabezpieczeń.
- AI rozumie cel pracy, model, aktualny formularz i kontekst bieżącej rozmowy; korzysta z podanych linków i PDF-ów.
- AI może przygotować skan z ramką bez ręcznego rysowania jej w formularzu.
- Zarówno dla nowego, jak i istniejącego miejsca formularz i karta pokazują na bieżąco wyraźnie oznaczone propozycje AI. Formularz jest tylko do odczytu podczas pracy AI.
- Administrator może poprawić propozycję kolejnym poleceniem, zatwierdzić ją albo odrzucić. Dopiero zatwierdzona i poprawnie zapisana propozycja zmienia szkic; odrzucenie pozostawia go bez zmian.
- Przed pracą AI ręczne zmiany są zapisane; konflikt wersji szkicu lub błąd zapisu jest zgłaszany i nie powoduje cichego nadpisania.
- Poza trybem propozycji podgląd pokazuje zapisany szkic; w trybie propozycji pokazuje także oznaczone niezatwierdzone zmiany. Publikacja jest osobną akcją, a wersję opublikowaną można przywrócić.
- Błędy odczytu, pracy AI, zapisu i publikacji są czytelne i nie są przedstawiane jako powodzenie.

## Kierunek technologiczny agenta

Wstępnie przyjmujemy Genkit jako framework agenta oraz **Gemini 3.5 Flash-Lite** jako model startowy w Google Cloud. Wykonano ograniczone próby modelu z konta operatora; dostęp z docelowego konta funkcji, integracja z Genkit i jakość na rzeczywistych skanach wymagają potwierdzenia. Wyniki i zakres sprawdzenia opisuje [wstępna architektura](architektura-wstepna.md). Porównanie innych modeli zaplanowano na później. Wybór nie oznacza skonfigurowania ani wdrożenia usługi.

## Otwarte decyzje techniczne

W kolejnym etapie należy określić: sposób przechowywania, kontroli dostępu i wersjonowania edytowalnych wskazówek oraz ich łączenia ze stałymi instrukcjami; sposób uruchomienia Genkit i przekazywania kolejnych zmian do interfejsu, obsługę przerwanej sesji i rzeczywisty zakres informacji o postępie; utrzymanie kontekstu i jego ograniczenia; bezpieczny odczyt linków i PDF-ów; mechanizm skanów z ramką; cykl życia plików; strukturę wspólnych szkiców i zachowanie przy równoczesnej pracy administratorów; publikację i przywracanie oraz wymagane zmiany Firebase, zabezpieczeń i dokumentacji. Ustalenia te nie są jeszcze deklaracją wdrożenia ani wyboru dostawcy.
