---
name: rybnik-create-task
description: Przygotuj lub utwórz zadanie w GitHub Projects Historyczny Rybnik, sprawdzając duplikaty, zależności i aktualne pola tablicy. Używaj do zarządzania zadaniami tego projektu, nie do rozpoczynania implementacji.
---

# Tworzenie zadania Historycznego Rybnika

Zakres: repozytorium `maciejkoch/historyczny-rybnik` i tablica
<https://github.com/users/maciejkoch/projects/1> (owner `maciejkoch`, numer `1`).
Nie wyszukuj danych w innych kontach. Nie zapisuj tokenów.

## Intencja i aktualne zasady

- „Omów”, „zaproponuj”, „przygotuj opis” oznacza propozycję w rozmowie bez zapisów w GitHub.
- „Utwórz/dodaj zadanie” upoważnia do utworzenia zadania i uzgodnionych pól tej tablicy. Nie upoważnia do komentarzy, implementacji ani wdrożeń.
- Odczytaj bieżące instrukcje użytkownika, `AGENTS.md`, `README.md`, `TECHNICAL.md`, `CONTRIBUTING.md` i dokumentację dotyczącą tematu z właściwego checkoutu. Zasady projektu pozostają w tych źródłach. Istotną sprzeczność zgłoś; instrukcje użytkownika mają pierwszeństwo.
- Preferuj dostępny konektor GitHub. Gdy nie obsługuje Projects, użyj lokalnego `gh` z istniejącym logowaniem. Brak dostępu zgłoś bez poszerzania zakresu kont i bez proszenia o token w rozmowie.

## Odczyt i duplikaty

Przykładowe odczyty przez CLI; najpierw potwierdź tożsamość tablicy:

```sh
gh project view 1 --owner maciejkoch --format json
gh project field-list 1 --owner maciejkoch --format json --limit 100
gh project item-list 1 --owner maciejkoch --format json --limit 100
```

Porównaj liczbę pobranych elementów/pól z `totalCount`. Przy uciętym wyniku
zwiększ limit lub odczytaj wszystkie strony API. Uwzględnij przez API również
zarchiwizowane pozycje oraz issues repozytorium, także zamknięte i nieprzypięte
do tablicy. Nie uznawaj niepełnego lub nieudanego odczytu za brak duplikatu.
Gdy CLI zwraca nieaktualną listę lub licznik po zmianie, odczytaj bezpośrednio
GraphQL (`gh api graphql`, bez cache) i przejdź wszystkie strony do
`pageInfo.hasNextPage=false`; sam `totalCount` może aktualizować się z opóźnieniem.
Szukaj po celu i zakresie, nie tylko identycznym tytule. Drafty Projects nie
pojawiają się w wyszukiwarce issues.

- Duplikat: zwróć odnośnik i pokrywający się zakres; nie twórz kolejnej pozycji.
- Powiązanie: wskaż trwały identyfikator i odnośnik; rozróżnij zależność blokującą od luźnego związku.
- Nie aktualizuj istniejącego zadania bez polecenia aktualizacji. Przy niejasności pokaż proponowaną różnicę zakresu przed zapisem.

## Przygotowanie i zapis

Opis zawiera cel, zakres i granice, obserwowalne kryteria ukończenia,
zależności z odnośnikami, otwarte decyzje i właściwe sprawdzenia. W spike'u
opisz wynik analizy zamiast obiecywać implementację. Nie przedstawiaj planowanych
środowisk ani niepotwierdzonych praw do materiałów jako dostępnych.

Odczytaj ID pól/opcji z aktualnego schematu. Uzupełniaj pola uzgodnione przez
użytkownika lub wymagane przez bieżące zasady projektu. Nie zgaduj priorytetu,
estymaty, terminów ani osoby przypisanej. Status początkowy wybierz według zasad
projektu; przy ich braku użyj istniejącego `Backlog`. Nie twórz nowych pól/opcji.
Brak wymaganego pola zgłoś przed zapisem.

Zachowaj przyjęty rodzaj zadania. Gdy projekt używa draftów i użytkownik nie
prosi o issue repozytorium, utwórz draft bez dodatkowego issue:

```sh
gh project item-create 1 --owner maciejkoch --title '<tytuł>' --body '<opis>' --format json
gh project item-edit --id '<item-id>' --project-id '<project-id>' --field-id '<status-field-id>' --single-select-option-id '<backlog-option-id>'
```

Wartości w nawiasach zastąp danymi odczytanymi z API. Tytuł i wielowierszowy
opis przekazuj jako bezpieczne argumenty procesu, np. `subprocess.run` z listą
argumentów; nie interpoluj treści użytkownika do kodu powłoki. Jeśli wymagane
jest issue, utwórz je wyłącznie w tym repozytorium i dodaj do tej tablicy po
sprawdzeniu, czy już tam nie jest. Nie twórz równocześnie draftu.

Tuż przed utworzeniem ponownie sprawdź duplikaty. Po zapisie odczytaj pozycję,
opis i pola. Jeśli odpowiedź zapisu zaginęła lub ustawienie pola nie powiodło
się, odszukaj zapisany element po otrzymanym ID albo treści; nie powtarzaj
tworzenia w ciemno. Uzupełnij tylko brakujące, autoryzowane pola tego elementu.
Przy kilku pasujących wynikach nie zgaduj, który jest własnym zapisem;
zwróć ich identyfikatory do wyjaśnienia. Jeśli nie można ustalić wyniku,
zgłoś częściowy zapis i przerwij mutacje.
GitHub Projects nie zapewnia atomowej deduplikacji; przy równoległym tworzeniu
tego samego zadania ustal koordynację przed zapisem.

Zwróć link do issue albo draftu
(`https://github.com/users/maciejkoch/projects/1?pane=issue&itemId=<item.databaseId>`),
tytuł, rzeczywisty status i zależności. Zapis weryfikuj świeżym odczytem pozycji
po node ID, zamiast opierać się na potencjalnie nieaktualnej liście CLI.
Przy opóźnionej propagacji ponawiaj wyłącznie odczyt w ograniczonym czasie
(np. do 30 sekund); potem zgłoś niepotwierdzony wynik, bez ponownego tworzenia.
Numeryczne `databaseId` pobierz z API
ProjectV2Item; nie wstawiaj node ID do `itemId`. Jeśli deep link jest niedostępny,
podaj link tablicy i trwały node ID pozycji, jawnie opisując ograniczenie.

## Przykłady

- „Użyj $rybnik-create-task i zaproponuj opis zadania o wyszukiwaniu miejsc.” — propozycja.
- „Użyj $rybnik-create-task i dodaj zadanie o wyszukiwaniu miejsc do projektu.” — sprawdzenie duplikatów i zapis.
- „Dodaj ponownie to samo zadanie.” — wskaż istniejącą pozycję; ustal odrębny zakres przed tworzeniem duplikatu.
