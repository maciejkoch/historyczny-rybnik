---
name: rybnik-start-task
description: Rozpocznij lub wznów wskazane zadanie GitHub Projects Historyczny Rybnik, sprawdzając zależności, istniejącą pracę, branch i rezerwację środowiska dev. Używaj przy poleceniu podjęcia pracy nad zadaniem tego projektu.
---

# Rozpoczęcie lub wznowienie zadania

Zakres: repozytorium `maciejkoch/historyczny-rybnik` i tablica
<https://github.com/users/maciejkoch/projects/1> (owner `maciejkoch`, numer `1`).
Nie przeszukuj innych kont. Nie zapisuj sekretów.
Polecenie podjęcia pracy obejmuje status i zapis powiązań zadania na tablicy;
nie obejmuje komentarzy/review. Produkcja wymaga osobnego wyraźnego zlecenia.
Sama prośba o ocenę gotowości jest tylko odczytem.

## Odczyt zadania i aktualnych zasad

Preferuj konektor GitHub; jeśli nie obsługuje Projects, użyj istniejącego
logowania `gh`. Przykładowe odczyty:

```sh
gh project view 1 --owner maciejkoch --format json
gh project field-list 1 --owner maciejkoch --format json --limit 100
gh project item-list 1 --owner maciejkoch --format json --limit 100
git remote -v
git status --short
git branch --show-current
git worktree list --porcelain
```

Sprawdź tożsamość tablicy i repozytorium. Odczytaj komplet stron/pól
(`totalCount`). Przy nieaktualnej liście CLI lub opóźnionym liczniku użyj
bezpośrednio `gh api graphql` bez cache i przejdź wszystkie strony do
`pageInfo.hasNextPage=false`. Po zapisie odczytaj świeżo pozycję po node ID.
Przy opóźnionej propagacji ponawiaj wyłącznie odczyt w ograniczonym czasie
(np. do 30 sekund); potem zgłoś niepotwierdzony zapis i zatrzymaj mutacje.
Nie rezerwuj slotu na podstawie nieodświeżonej listy. Ustal pozycję po linku
lub trwałym ID; tytuł traktuj jako
wyszukiwanie. Przy kilku dopasowaniach poproś o wskazanie zadania przed zmianami.
Obsługuj drafty i issues. Odczytaj cały opis, istotne komentarze issue, zależności
i powiązania pracy. Odróżniaj ID pozycji Projects, ID draftu oraz numer issue.
Status jest polem pozycji Projects.

Przeczytaj bieżące instrukcje użytkownika, `AGENTS.md`, `README.md`, `TECHNICAL.md`, `CONTRIBUTING.md` i wskazaną
dokumentację architektury, testów, branchowania i środowisk. Zasady pozostają
w tych źródłach. Instrukcje użytkownika mają pierwszeństwo; nierozstrzygnięty
konflikt zgłoś przed zależną operacją. Do odkrywania kodu stosuj graf MCP zgodnie
z instrukcjami repozytorium.

## Gotowość i istniejąca praca

- Zweryfikuj kryteria ukończenia i każdą blokującą zależność. Otwarta zależność albo brak dostępu do niej blokuje zależne prace. Zgłoś warunek odblokowania. Możesz przygotować niezależny fragment zlecony przez użytkownika; nie uznawaj zależności za spełnioną.
- Sprawdź branch, worktree, otwarte PR i rezerwację. Szukaj PR wyłącznie w tym repozytorium, także po head branchu. Błąd API nie oznacza braku pracy.
- `Done` lub zamknięty PR nie oznacza zgody na ponowne otwarcie. `In review` kieruje do istniejącego PR. Nie cofaj statusu bez polecenia wznowienia/poprawek. `In progress` bez ustalonego wykonawcy i powiązań wymaga wyjaśnienia przed przejęciem.
- Sprawdź lokalne zmiany, także nieśledzone pliki. Nie wykonuj automatycznego resetu, stashowania, czyszczenia ani nadpisania plików. Użyj czystego checkoutu/worktree, jeśli lokalne zmiany mogłyby wejść do nowej pracy. Wznowienie w brudnym worktree jest dopuszczalne po potwierdzeniu, że zmiany należą do tego zadania.
- Wznawiaj ustaloną gałąź i rezerwację. Nie twórz wariantów z kolejnym sufiksem tylko dlatego, że branch już istnieje. Worktree zajęty przez innego agenta wymaga koordynacji przed edycją.

## Branch i środowisko

Ustal bazę i nazewnictwo z dokumentacji. Jeśli nie ma konwencji, nową gałąź
nazwij `codex/<krótki-slug-zadania>` od aktualnego domyślnego brancha repozytorium
(odczytanego z GitHub/remote HEAD), nie od przypadkowo otwartej gałęzi.
Sprawdź lokalne i zdalne branche oraz worktree przed utworzeniem. Nie zmieniaj
bazy istniejącej pracy automatycznie.

Rezerwuj wyłącznie według **wdrożonego** procesu opisanego w aktualnej
dokumentacji środowisk. Odczytaj schemat pola `Środowisko`, wszystkie aktywne
rezerwacje i udokumentowane adresy/polecenia. Nie zakładaj, że dev-1/dev-2/dev-3
istnieją, nie konstruuj ich URL-i i nie traktuj stałego dev integracyjnego jako
wolnego slotu. Uwzględniaj rezerwacje niezależnie od statusu, dopóki nie zostały
jawnie zwolnione.

Brak pola, wdrożonego procesu, potwierdzonego środowiska lub wolnego slotu
blokuje rezerwację i zależne wdrożenie. Nie twórz infrastruktury ani pól w ramach
rozpoczynania zadania. Dla prac bez potrzeby podglądu (np. skille, dokumentacja)
można kontynuować niezależny zakres zlecony przez użytkownika, z jawną informacją
„środowisko nieprzypisane” i przyczyną. Nie raportuj pełnego startu ze środowiskiem.

Sam schemat „odczytaj, zapisz, odczytaj” nie jest atomową blokadą. Przy
równoległej pracy użyj udokumentowanego mechanizmu serializacji rezerwacji.
Bez niego ustal koordynację przed zapisem; nie przejmuj slotu na podstawie
starego odczytu. Tuż przed zapisem sprawdź właściciela ponownie, a po zapisie
odczytaj wszystkie rezerwacje. Przy kolizji wstrzymaj wdrożenie i zgłoś konflikt;
nie usuwaj rezerwacji innych zadań.

## Powiązania i dalsza praca

Odczytaj ID pól/opcji na żywo. Użyj dedykowanych pól zgodnie z procesem.
W innym przypadku aktualizuj jeden blok „Praca agenta” w opisie, zachowując
pozostały tekst: ID zadania, branch i baza, wykonawca/sesja (bez sekretów),
środowisko i jego stan, link podglądu, **wdrożona** rewizja i PR. Do publikacji
oznacz rewizję i podgląd jako niezweryfikowane. Nie dopisuj kolejnych bloków
przy wznowieniu.

Przed edycją ponownie odczytaj opis/pola; zachowaj równoległe aktualizacje
i rozwiąż kolizję. Dla draftu edytuj opis przez ID draftu, dla issue przez jego
numer w tym repozytorium. Do statusu użyj ID pozycji:

```sh
gh project item-edit --id '<item-id>' --project-id '<project-id>' --field-id '<status-field-id>' --single-select-option-id '<in-progress-option-id>'
```

Zastąp przykładowe wartości danymi z API. Opisy przekazuj jako bezpieczne
argumenty procesu, bez interpolacji do powłoki. `In progress` ustaw po
przygotowaniu i sprawdzeniu powiązań gotowego zakresu. Pomijaj zapis statusu,
pól i bloku powiązań, jeśli ich wartości są już poprawne. Niezależny zakres przy
otwartych zależnościach oznacz jawnie w opisie. Po każdej mutacji odczytaj wynik.
Przy częściowym błędzie opisz rzeczywisty stan, nie twórz kolejnego
brancha/rezerwacji i nie cofaj cudzych zmian. Błąd dostępu lub niepewny wynik
zapisu oznacza wstrzymanie mutacji do wyjaśnienia.

Kontynuuj zadanie zgodnie z aktualną dokumentacją: dobierz sprawdzenia do ryzyka,
aktualizuj dokumentację, wdrażaj zmiany aplikacji do właściwego dev i zweryfikuj
URL. Uwzględnij wspólny backend dev i wpływ zmian danych na inne podglądy.
Zaktualizuj powiązania rzeczywistym SHA wdrożenia i PR. Status review/zakończenie
i zwolnienie slotu wykonaj po spełnieniu warunków udokumentowanego procesu,
nie przy samym przerwaniu sesji.

Raportuj link i ID zadania, rzeczywisty status, branch/bazę, środowisko
i zweryfikowany podgląd (lub blokadę), wymagane sprawdzenia i następny krok.
Odróżniaj przygotowanie lokalne, zapis GitHub i wdrożenie.

## Przykłady

- „Użyj $rybnik-start-task i rozpocznij zadanie <link do pozycji>.”
- „Użyj $rybnik-start-task i wznów zadanie <ID>; zachowaj istniejący branch.”
- „Użyj $rybnik-start-task i sprawdź gotowość zadania <link>.” — tylko odczyt.
