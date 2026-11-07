# Obowiązujące zasady bezpieczeństwa

## Stosowanie i egzekwowanie

Ten dokument obowiązuje przy każdej zmianie i każdym code review, również przy pracy agentów. Przeczytaj go przed rozpoczęciem pracy i review. Zasady obejmują kod, konfigurację, skrypty, testy, dokumentację, dane i publikację.

Naruszenie zasad blokuje uznanie zadania za ukończone i pozytywny wynik review. W przypadku sprzeczności, braku wymaganego zabezpieczenia lub niemożności jego weryfikacji zatrzymaj zależną operację i zgłoś problem właścicielowi. Nie osłabiaj zabezpieczeń ani nie zmieniaj zasad, aby dopasować je do kodu. Zmiany zasad wymagają uzgodnienia z właścicielem; zgoda na zmianę funkcji nie oznacza zgody na obejście zabezpieczeń.

Dokument określa wymagania, a nie potwierdzenie ich wdrożenia. Aktualne mechanizmy opisuje [TECHNICAL.md](TECHNICAL.md). Odróżniaj kod na main, pracę w PR-ach i stan działających usług; nie przedstawiaj planowanych funkcji jako wdrożonych.

## Sekrety i poświadczenia

- Bezwzględnie zabronione jest umieszczanie rzeczywistych haseł, kluczy prywatnych, tokenów dostępowych, kluczy kont usług i innych sekretów w kodzie, repozytorium i jego historii, testach, dokumentacji, materiałach agenta, logach oraz artefaktach frontendu.
- Sekrety dostarczaj przez przeznaczone do tego mechanizmy środowiska i zarządzania sekretami. Do operacji serwerowych używaj istniejących mechanizmów ADC, tożsamości kont usług lub autoryzowanego logowania operatora; nie twórz kluczy prywatnych jako skrótu konfiguracji.
- Nie przesyłaj sekretów w rozmowach, issues, PR-ach ani wynikach narzędzi. Nie wypisuj zmiennych środowiskowych ani plików z poświadczeniami. Przykłady i testy używają wyłącznie fikcyjnych wartości.
- Publiczna konfiguracja klienta Firebase, w tym jego API key, identyfikatory projektu i adresy usług, nie jest sekretem ani mechanizmem autoryzacji. Nie wolno umieszczać w niej kluczy prywatnych ani tokenów. Dostęp do zasobów musi wynikać z kontroli po stronie usług.
- Ignorowanie pliku przez Git nie stanowi ochrony sekretu. Wyciek wymaga unieważnienia lub rotacji poświadczeń i oceny skutków; samo usunięcie wartości z pliku lub historii nie wystarcza.

## Tożsamość, uprawnienia i API

- Przyznawaj minimalne niezbędne uprawnienia. Dostęp jest domyślnie zabroniony, a publiczne operacje i dane muszą być jawnie określone.
- Każda chroniona operacja sprawdza tożsamość oraz wymagane uprawnienia po stronie backendu. Nie ufaj rolom, UID ani informacjom o właścicielu przesłanym jako dane żądania; korzystaj ze zweryfikowanej tożsamości i zaufanych danych.
- Firebase Auth, autoryzacja i App Check pełnią odrębne role. App Check nie zastępuje sprawdzenia użytkownika i uprawnień; samo zalogowanie nie daje prawa do dowolnego zapisu. Zachowuj egzekwowanie App Check w API, które go wymaga.
- Ukrycie przycisku, blokada trasy, CORS i noindex nie zastępują autoryzacji. Zabezpieczenia muszą działać również przy bezpośrednim wywołaniu API.
- Nie wyłączaj kontroli tokenów, App Check, autoryzacji ani weryfikacji TLS dla uruchomienia funkcji, testu, builda lub deploymentu. Mechanizmy emulatorów i testowe poświadczenia pozostają w środowisku testowym.

## Walidacja i bezpieczne wyświetlanie

- Traktuj dane klienta i źródeł zewnętrznych jako niezaufane. Backend waliduje typy, dozwolone pola, zakresy i rozmiary danych przed odczytem lub zapisem, korzystając ze wspólnych kontraktów projektu.
- Ograniczaj koszt żądań i wielkość przetwarzanych danych. Zachowuj limity zasobów i kontrolę konfliktów równoległych zapisów; nie nadpisuj nowszych danych bez sprawdzenia wersji tam, gdzie wymaga tego mechanizm aplikacji.
- Korzystaj z bezpiecznego renderowania Angulara. Nie wprowadzaj niezaufanej treści do HTML, skryptów ani adresów bez odpowiedniej walidacji. Obejście sanitizacji wymaga wcześniejszego uzgodnienia i udokumentowanej analizy bezpieczeństwa; nie może służyć do ukrycia błędu.
- Komunikaty błędów dla klienta nie ujawniają sekretów, danych innych użytkowników ani wewnętrznych szczegółów infrastruktury.

## Firestore, Storage i operacje serwerowe

- Reguły Firestore i Storage dopuszczają wyłącznie zamierzony dostęp. Nie otwieraj ogólnego odczytu lub zapisu, również tymczasowo w celu uruchomienia funkcji.
- Zapisy biznesowe realizuj przez uzgodnioną ścieżkę backendu. Dostęp do dokumentów, pól i plików musi odpowiadać uprawnieniom operacji; sam identyfikator zasobu nie upoważnia do dostępu.
- Admin SDK omija reguły klienckie: operacje serwerowe wymagają własnej kontroli dostępu i minimalnych uprawnień IAM. Nie traktuj testów reguł jako potwierdzenia bezpieczeństwa Admin SDK.
- Dane publikowane w HTML, katalogu, snapshotach i zasobach statycznych muszą być przeznaczone do publicznego udostępnienia. Nie kopiuj do nich danych prywatnych ani poświadczeń.

## Prywatność, logi i środowiska

- Przetwarzaj i przechowuj tylko dane potrzebne do uzgodnionej funkcji. Respektuj zgody użytkownika i istniejące zasady uruchamiania usług Google; nie obchodź ich przez nowe ścieżki ładowania SDK.
- Nie zapisuj w logach tokenów, haseł, nagłówków autoryzacji ani zbędnych danych osobowych. Dane diagnostyczne ograniczaj i redaguj przed udostępnieniem.
- Przed operacją sprawdź projekt, bazę, bucket, konto usługi i docelową witrynę. Nie używaj danych ani poświadczeń produkcyjnych w testach bez osobnego uzgodnienia.
- Obecnie dev-1/2/3 współdzielą backend dev, a Auth jest wspólne w projekcie. Osobna witryna Hosting i rezerwacja slotu nie izolują danych ani kont; uwzględniaj wpływ zmian na inne zadania.
- Publikację, rezerwacje i ograniczenia produkcji stosuj zgodnie z [AGENTS.md](AGENTS.md) oraz [opisem środowisk](agent-context/reference/mvp-1/srodowiska.md). Nie omijaj blokad publikacji.

## Zależności, weryfikacja i review

- Oceniaj konieczność, pochodzenie i wpływ nowych zależności oraz skryptów zewnętrznych. Zachowuj pliki lock i oceniaj wykryte podatności w kontekście użycia; nie ignoruj ich bez zapisanej oceny.
- Zmiany dostępu i zabezpieczeń wymagają adekwatnych testów: także odmowy dostępu, błędnych danych i prób przekroczenia uprawnień. Przy zmianach reguł i API używaj odpowiednich testów emulatorów opisanych w TECHNICAL.
- Review sprawdza sekrety, granice zaufania, autoryzację, walidację, prywatność, środowisko docelowe oraz adekwatność weryfikacji. Brak możliwości sprawdzenia istotnego zabezpieczenia musi być jawnie zgłoszony i blokuje akceptację zależnej zmiany.
- Przy zakończeniu zadania sprawdź aktualność tego pliku i opisu mechanizmów w TECHNICAL. Nie deklaruj audytu, testu ani wdrożenia, których nie wykonano.

## Zgłoszenia i incydenty

Nie publikuj szczegółów niewyeliminowanej podatności, sekretów ani danych użytkowników w publicznych issues lub PR-ach. Kanał prywatnych zgłoszeń zewnętrznych nie został jeszcze ustalony; ten plik nie potwierdza włączenia GitHub Private Vulnerability Reporting. Do czasu wskazania kanału można publicznie poprosić wyłącznie o prywatny kontakt do właściciela, bez szczegółów problemu.

Zgłoszenie przekazane prywatnie powinno opisywać dotknięty adres lub komponent, wersję lub commit, minimalne kroki odtworzenia oraz możliwe skutki, bez rzeczywistych sekretów i cudzych danych. Nie wykonuj destrukcyjnych prób ani nie pobieraj danych ponad zakres niezbędny do potwierdzenia problemu.

Po wykryciu incydentu powiadom właściciela, zatrzymaj zależne niebezpieczne operacje, ogranicz skutki w uzgodnionym zakresie i zabezpiecz potrzebne informacje bez dalszego ujawniania danych. Ujawnione poświadczenia należy unieważnić lub wymienić. Naprawę zweryfikuj, ustal zakres skutków i odnotuj działania bez sekretów. Usunięcie podatnego kodu nie oznacza automatycznie zakończenia incydentu.
