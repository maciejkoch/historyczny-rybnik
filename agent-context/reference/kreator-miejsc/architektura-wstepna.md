# Kreator miejsc — wstępna architektura i weryfikacja

> **Aktualizacja po odtworzeniu, 25 listopada 2026:** kod i zależności opisane w historycznych sekcjach o rozpoczętych pracach zostały następnie wycofane. Te sekcje dokumentują wcześniejsze próby i nie potwierdzają obecności ani działania implementacji w repozytorium. Dokument przywrócono z zapisu sesji.

> Status: materiał planistyczny, 24 listopada 2026. Opisuje ustalenia i wyniki ograniczonych odczytów oraz prób, nie działającą funkcję ani gotowy projekt wykonawczy. [Wymagania](wymagania.md) określają oczekiwane zachowanie; [TECHNICAL](../../../TECHNICAL.md) opisuje stan kodu na bieżącej gałęzi, a [SECURITY](../../../SECURITY.md) obowiązujące zasady bezpieczeństwa.

## Kierunek

- Kandydatem na framework jest **Genkit**, uruchamiany po stronie backendu Node.js/Firebase Functions. Model startowy wybrany do prototypu to **Gemini 3.5 Flash-Lite** w Google Cloud. Benchmark innych modeli odłożono na później.
- Jeden główny agent zna kontekst Historycznego Rybnika i model miejsca, korzysta z bieżącej rozmowy oraz aktualnego szkicu. Reaguje na wyniki narzędzi i może wykonywać wiele kroków model → narzędzie → model. Pętla ma ograniczenia czasu, liczby kroków i zużycia; jej samo istnienie nie gwarantuje jakości wyniku.
- Stałe instrukcje utrzymujemy z aplikacją; administrator może zmieniać dodatkowe wspólne wskazówki bez wydania. Nie polegamy na instrukcjach jako zabezpieczeniu: backend egzekwuje uprawnienia, walidację i akceptację.
- Historia rozmowy działa podczas bieżącej sesji, ale nie jest trwale zapisywana w MVP. PDF-y pozostają przypisane do szkicu. Sposób przekazywania kontekstu, okres życia danych tymczasowych i ich usuwanie wymagają projektu.
- Osobne narzędzia domenowe, z ograniczonym zakresem, obsługują odczyt szkicu i modelu, źródła, przygotowanie materiałów oraz propozycje zmian. Agent nie otrzymuje ogólnego dostępu do bazy ani narzędzia samodzielnej publikacji. Opcjonalny odczyt podobnych miejsc może pomagać wykrywać duplikaty; zakres i przydatność należy potwierdzić.

## Komunikacja i stan

Proponowany przepływ: Angular wywołuje funkcję Firebase; agent korzysta z narzędzi i przekazuje zdarzenia; interfejs na bieżąco pokazuje postęp oraz tymczasowe, oznaczone propozycje w formularzu i na karcie. Administrator zatwierdza, odrzuca albo doprecyzowuje propozycję kolejnym poleceniem. Zatwierdzenie zapisuje zweryfikowaną propozycję do szkicu, a publikacja jest osobną akcją.

Streaming callable functions pozwala wysyłać wiele zdarzeń w odpowiedzi na żądanie klienta; po zakończeniu pracy połączenie się zamyka. Akceptacja i kolejna wiadomość wymagają kolejnego żądania. To nie jest automatyczny nasłuch zmian pochodzących od innego administratora. Do sprawdzenia pozostaje `onCallGenkit` kontra zwykłe `onCall` i dopasowanie protokołu do Genkit. [Firebase — streaming callable](https://firebase.google.com/docs/functions/callable), [Genkit w Functions](https://firebase.google.com/docs/functions/oncallgenkit).

Przed pracą AI interfejs kończy zapis ręcznych zmian. Akceptacja dotyczy konkretnej przedstawionej propozycji. Decyzja właściciela: ostatni zapis wspólnego szkicu wygrywa, bez wersjonowania szkicu i wykrywania konfliktów edycji, również przy akceptacji propozycji. Otwarte: przechowywanie propozycji, obsługa przerwanego połączenia, synchronizacja drugiej przeglądarki i obsługa niepewnego wyniku zapisu. Nie należy zakładać, że stan procesu Functions przetrwa kolejne żądanie.

## Dokumenty, linki i materiały

PDF w prywatnym Storage nie musi być w całości zwracany modelowi. Narzędzia mogą udostępniać metadane, wyszukiwanie w warstwie tekstowej, odczyt wybranych stron i renderowanie strony. Gdy brak strony lub tekstu, OCR albo szersza analiza może wymagać przetworzenia całego dokumentu; należy przedstawić postęp i ograniczyć zasoby. W przypadku niedostępnego linku agent ma wskazać, którego źródła faktycznie nie odczytano.

AI może wskazać prostokąt fragmentu, zaś deterministyczny kod przygotowuje pełną stronę z ramką i miniaturę. Jakość współrzędnych na przedwojennych gazetach pozostaje do sprawdzenia; użytkownik ogląda propozycję. Rozdzielenie pliku źródłowego, tymczasowego obrazu i publicznej galerii oraz ich cykl życia wymagają szczegółowego projektu. Osoba dodająca materiał odpowiada za prawo do jego udostępnienia, a stan praw nie blokuje dodania ani wyświetlenia.

## Koszt

W interfejsie planujemy szacowany koszt modelu aktualizowany w miarę uzyskiwania danych o zużyciu oraz podsumowanie po zadaniu. Rzeczywiste rozliczenie pochodzi z Google Cloud Billing i może różnić się od szacunku; dodatkowe usługi, np. OCR, Functions i Storage, trzeba rozliczać oddzielnie. Limity zadania — koszt, liczba kroków, stron i czas — wymagają określenia. Alert budżetowy nie jest automatycznie twardym limitem. Cenniki i dostępność usług należy ponownie sprawdzić w chwili implementacji. [Google Cloud — budżety](https://docs.cloud.google.com/billing/docs/how-to/budgets).

## Wyniki sprawdzenia środowiska — 24 listopada 2026

Odczyty wykonano dla projektu `historyczny-rybnik`, bazy `places-dev` oraz bucketa `historyczny-rybnik-dev-files`, bez zmiany zasobów:

- Projekt jest aktywny, billing włączony, Vertex AI API włączone, a Document AI API wyłączone. To ostatnie blokuje jedynie wariant zależny od tej usługi, dopóki nie zostanie ona włączona.
- `places-dev` jest bazą Firestore Native Standard w `europe-central2`, z włączonym trybem aktualizacji realtime na poziomie bazy. Bucket dev istnieje w `EUROPE-CENTRAL2` i korzysta z jednolitego dostępu na poziomie bucketa.
- Aktywne reguły Firestore i Storage odpowiadały plikom repozytorium: bezpośredni dostęp klienta do Firestore i zapisy do Storage są zabronione; publiczny odczyt Storage obejmuje ścieżkę materiałów. Realtime dla szkiców lub upload bezpośredni wymagają osobnego uzgodnionego projektu dostępu i odpowiednich testów; nie wyłączamy istniejących zabezpieczeń.
- W Firebase działały funkcje wcześniejszego kreatora, w tym funkcje szkiców i publikacji, choć nie ma ich na obecnym `main`. Współdzielony backend dev wymaga oceny wpływu nowych wdrożeń; sama obecność tych funkcji nie oznacza decyzji o wykorzystaniu wcześniejszej implementacji.
- Istniały konta wcześniejszego kreatora oraz role dotyczące modelu, szkiców i ograniczonych ścieżek Storage. Rola modelu zawierała `aiplatform.endpoints.predict`; rola szkiców miała odczyt, listowanie, tworzenie i aktualizację, bez usuwania. Ich istnienie nie potwierdza kompletności IAM dla nowego rozwiązania.
- Odczyt konfiguracji wskazał, że wcześniejsza funkcja generowania szkicu miała limit 120 sekund i jedną instancję. To fakt o tej funkcji, nie uzgodniony limit nowego agenta.
- Obecny frontend nie zawierał znalezionej konfiguracji debug providera App Check ani podłączenia Functions do emulatora. Uzgodniony odbiór używa lokalnej aplikacji i Functions oraz rzeczywistej bazy dev, z autoryzacją i lokalnym wyjątkiem od App Check; szczegóły zawiera [plan fazy 1](plan-fazy-1.md). [Firebase — App Check lokalnie](https://firebase.google.com/docs/app-check/web/debug-provider).

Firestore ma limit rozmiaru pojedynczego dokumentu; PDF-ów, obrazów i nieograniczonej historii nie należy umieszczać w jednym rekordzie szkicu. [Limity Firestore](https://cloud.google.com/firestore/quotas).

## Próby Gemini 3.5 Flash-Lite — 24 listopada 2026

W projekcie `historyczny-rybnik` wykonano krótkie wywołania bezpośrednio do API modelu, z istniejącego konta operatora, na fikcyjnych danych:

| Próba | Wynik i granice |
| --- | --- |
| Dostęp do modelu | Odpowiedź HTTP 200 z `gemini-3.5-flash-lite`. |
| Narzędzie i kontynuacja | Model wywołał fikcyjne narzędzie z właściwym argumentem, a po przekazaniu wyniku wykorzystał go w odpowiedzi. To podstawowa próba pętli, nie test całej implementacji Genkit. |
| PDF | Poprawnie odczytał nazwisko i rok z prostego, fikcyjnego jednostronicowego PDF-u. |
| Obraz strony | Poprawnie odczytał nazwisko i rok z obrazu tej strony oraz zwrócił propozycję współrzędnych prostokąta. Nie oceniono jakości na prawdziwych skanach. |
| Streaming modelu | Odpowiedź API została dostarczona w kilku częściach. Nie przetestowano jeszcze streamingu przez Functions i Angular. |

Próba wywołania w imieniu istniejącego konta usługi kreatora nie doszła do modelu: konto operatora nie miało uprawnienia do jego impersonacji. Nie dowodzi to braku dostępu wdrożonej funkcji do modelu. Wymaga osobnej weryfikacji uruchomienia pod właściwą tożsamością bez osłabiania IAM. Testy nie zapisywały miejsc ani nie zmieniały konfiguracji chmury.

Gemini 2.5 Flash nie jest kandydatem startowym w Google Cloud: karta modelu wskazuje wycofanie 20 października 2026. Dostęp przez inne API może podlegać odmiennym warunkom. [Karta modelu](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash).

## Przed implementacją

1. Potwierdzić wywołanie wybranego modelu z docelowej tożsamości funkcji oraz obsługę Genkit, strumieniowania i akceptacji w lokalnym prototypie.
2. Sprawdzić wieloetapową pracę, polskie źródła i ramki na rzeczywistych reprezentatywnych skanach; zmierzyć czas i koszt. Benchmark innych modeli pozostaje późniejszy.
3. Zaprojektować bezpieczne pobieranie linków, obsługę niezaufanej treści, limity plików i przetwarzania oraz prywatne materiały tymczasowe.
4. Doprecyzować zapis propozycji, dokumentów i instrukcji administratora oraz ponowienia, usuwanie i publikację między Firestore a Storage. Szkice stosują zasadę ostatniego zapisu.
5. Dobrać IAM oraz ścieżkę lokalnego odbioru zgodną z SECURITY i uwzględnić współdzielone zasoby dev. Nie zakładać uprawnień tylko na podstawie istniejących nazw kont.
6. Ustalić monitoring kosztu, limity i powiadamianie; sprawdzić rzeczywiste limity i dostępność wybranych usług w projekcie.
7. Przed wdrożeniem aktualizować właściwe dokumenty, w tym politykę prywatności, zgodnie z rzeczywiście używanymi usługami i retencją.

## Prace rozpoczęte — 24 listopada 2026

Powstały niewystawione przez API moduły walidacji szkiców i propozycji, wstępnego zapisu szkiców, agenta Genkit oraz renderowania pojedynczych stron PDF. Nie tworzą kompletnego kreatora. W rzeczywistym wywołaniu z konta operatora agent Genkit z Gemini 3.5 Flash-Lite odczytał fikcyjny szkic i przygotował propozycję; przetestowano odczyt PDF i ramkę na syntetycznej stronie, walidację publicznych URL-i oraz konflikt wersji w emulatorze. Nie wykonano end-to-end przez UI ani testu prawdziwego skanu.

Dodano zależności Genkit i PDF. Po aktualizacji `protobufjs`, `grpc-js` oraz propagatora Jaeger `npm audit` zgłaszał cztery pośrednie wpisy wysokiego ryzyka związane z `zod` 3 używanym przez Genkit oraz 56 umiarkowanych, bez krytycznych. Podatność `zod` dotyczy walidacji nadmiernie dużych kolekcji; ograniczenia wejścia w powstającym module nie zastępują pełnej oceny wszystkich ścieżek biblioteki. Zmiany wersji pośrednich wymagają oceny zgodności i pełnego retestu. [Opis podatności](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Przed wystawieniem API oraz uznaniem pracy za ukończoną trzeba zakończyć ocenę bezpieczeństwa zależności zgodnie z SECURITY.

### Kolejne sprawdzenia lokalne

Agent potrafi uruchomić analizę wizualną pojedynczej wyrenderowanej strony PDF jako osobny krok modelu. Próba z Gemini i fikcyjną stroną zwróciła poprawny rok i nazwisko; rzeczywisty skan historyczny pozostaje nieprzetestowany. Rejestr narzędzi agenta jest izolowany dla każdego wywołania, aby równoczesne zadania nie współdzieliły domknięć z danymi szkicu.

Niewystawiony moduł przeglądu propozycji wiąże akceptację z administratorem i wersją szkicu, obsługuje ponowienie akceptacji oraz odrzuca zmiany materiałów do czasu wdrożenia kontroli plików. Testy Firestore w emulatorze objęły akceptację, brak dostępu innego administratora, konflikt wersji i odrzucenie. Propozycje mają termin ważności, ale automatyczne usuwanie wygasłych rekordów nie jest jeszcze wdrożone, dlatego moduł nie jest gotowy do wystawienia.
