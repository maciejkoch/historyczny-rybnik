# Weryfikacja skilli — 6 listopada 2026

## Format i scenariusze offline

Oba `SKILL.md` przeszły `quick_validate.py` ze skilla `skill-creator`.
Niezależny agent wykonał symulacje opisane w
[instrukcji użycia](skille-github-projects.md#weryfikacja), bez API i zapisów.
Nie wykrył błędu blokującego udostępnienie instrukcji. Po ocenie doprecyzowano
pomijanie zapisów niezmienionych wartości oraz zatrzymanie przy wielu możliwych
wynikach odzyskiwania zapisu. Symulacja nie zastępuje wykonania na środowiskach.

## Integracja z GitHub Projects

Na właściwej tablicy wykonano test tymczasowego draftu
`PVTI_lAHOAP5vmM4BqYSzzhGnt1k`:

| Sprawdzenie | Wynik |
| --- | --- |
| Utworzenie draftu z wielowierszowym opisem | Poprawny zapis i odczyt treści |
| Odzyskanie po pominięciu odpowiedzi tworzenia | Znaleziono dokładnie jedną pozycję po unikalnym tytule, bez ponownego tworzenia |
| Zmiana opisu przez ID draftu | Treść i jeden blok powiązań odczytane poprawnie |
| Status przez ID pozycji Projects i ID pola/opcji | Ustawiono `Backlog`, następnie ustawiono i odczytano `In progress` |
| Link draftu | API zwróciło numeryczne `databaseId` pozycji |
| Sprzątanie | Draft usunięty; zbiór ID zadań po teście równy zbiorowi sprzed testu |

Test uruchomiono lokalnym Pythonem, przekazując argumenty do `gh` jako listy
procesu, bez interpolacji opisów do powłoki. Odczytano 18 pól tablicy i pełną
listę przez GraphQL z kontrolą `pageInfo.hasNextPage`. Testowe powiązania nie
były rezerwacją rzeczywistego brancha ani środowiska.

Pierwsze próby weryfikacji natychmiast po utworzeniu zwracały listę bez nowego
elementu; `totalCount` również nie zawsze zgadzał się z liczbą węzłów po usunięciu.
Testowe drafty z tych prób usunięto w sekcji sprzątania. Końcowy przebieg ze
świeżymi zapytaniami GraphQL i ograniczonym ponawianiem odczytu przeszedł.
Skille uwzględniają nieaktualne odczyty i nie ponawiają w ciemno mutacji.

## Pozostałe warunki odbioru

Na tablicy nadal nie ma pola `Środowisko`; zadania dokumentacji i trzech
środowisk dev są w `Backlog`. Z tego powodu nie wykonano startu/wznowienia
z rzeczywistą rezerwacją dev-1/dev-2/dev-3 ani wdrożenia podglądu. Brak wolnego
slotu, błędy dostępu i serializację oceniono na danych offline; nie wymuszano
awarii ani nie zajmowano środowisk innych zadań.

Po ukończeniu zależności trzeba wykonać jeden pełny start i wznowienie zadania
aplikacyjnego, potwierdzając status, branch, rezerwację, link oraz SHA wdrożenia,
a następnie zwolnienie slotu według przyjętego procesu. Do tego czasu PR
dostarcza działające instrukcje z obsługą blokad, lecz nie potwierdza wszystkich
kryteriów odbioru całego zadania Projects.

Nie uruchamiano builda ani wdrożenia aplikacji: zmiana dotyczy wyłącznie
skilli i dokumentacji. Format YAML, lokalne odnośniki oraz instalację osobistą
(pierwsze kopiowanie i odmowę nadpisania) sprawdzono osobno w katalogu tymczasowym.
