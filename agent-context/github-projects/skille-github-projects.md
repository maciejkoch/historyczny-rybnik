# Skille GitHub Projects

Źródła wersjonowane w repozytorium:

- [rybnik-create-task](../../.agents/skills/rybnik-create-task/SKILL.md) — propozycja lub utworzenie zadania po sprawdzeniu duplikatów.
- [rybnik-start-task](../../.agents/skills/rybnik-start-task/SKILL.md) — gotowość, rozpoczęcie i wznowienie pracy z zachowaniem istniejących powiązań.

Oba skille działają wyłącznie w `maciejkoch/historyczny-rybnik` i na
[tablicy Historyczny Rybnik](https://github.com/users/maciejkoch/projects/1).
`AGENTS.md`, `README.md` i dokumentacja są źródłami zasad projektu; skille
opisują sposób ich zastosowania, nie przechowują kopii zmiennych ustaleń.

## Instalacja i wywołanie

Checkout tej gałęzi zawiera projektowe skille w `.agents/skills`. Po ponownym
wczytaniu projektu przez Codex powinny być dostępne bez globalnej instalacji.
W rozpoczętej wcześniej sesji można wskazać bezpośrednio właściwy `SKILL.md`.

Jeśli klient wymaga instalacji osobistej, uruchom z katalogu głównego repozytorium:

```sh
python3 - <<'PY'
import os
import shutil
from pathlib import Path

destination = Path(os.environ.get('CODEX_HOME') or Path.home() / '.codex') / 'skills'
names = ('rybnik-create-task', 'rybnik-start-task')
targets = [destination / name for name in names]
if any(path.exists() or path.is_symlink() for path in targets):
    raise SystemExit('Docelowy skill już istnieje; porównaj wersje przed aktualizacją.')
for name, target in zip(names, targets):
    shutil.copytree(Path('.agents/skills') / name, target)
    print(target)
PY
```

Polecenie nie nadpisuje istniejących skilli. Preferuj wersję projektową, aby
uniknąć rozbieżności między kopią osobistą i checkoutem. Po instalacji osobistej
uruchom ponownie klienta. Nie zapisuj danych logowania w plikach skilli.

Przykłady:

```text
Użyj $rybnik-create-task i zaproponuj opis zadania o wyszukiwaniu miejsc.
Użyj $rybnik-create-task i utwórz zadanie o wyszukiwaniu miejsc na tablicy.
Użyj $rybnik-start-task i sprawdź gotowość zadania <link lub ID>.
Użyj $rybnik-start-task i rozpocznij zadanie <link lub ID>.
Użyj $rybnik-start-task i wznów zadanie <link lub ID> na istniejącym branchu.
```

Sama propozycja/ocena gotowości niczego nie zapisuje. Polecenie utworzenia lub
rozpoczęcia obejmuje odpowiednie zapisy pozycji Projects, lecz nie publikowanie
komentarzy/review. Po starcie agent kontynuuje zlecone zadanie zgodnie z zasadami
projektu. Brak dostępu zgłasza bez proszenia o tokeny w rozmowie.

## Bieżące ograniczenia i zależności

Stan odczytany 6 listopada 2026: oba zadania zależne („Uporządkować dokumentację
projektu i zasady pracy agenta” i „Przygotować 3 środowiska aplikacji dev ze
wspólnym backendem”) mają status `Backlog`. Tablica ma 18 pól i nie zawiera
`Środowisko`. Dev-1/dev-2/dev-3 nie mają jeszcze potwierdzonego procesu
rezerwacji w dokumentacji. To migawka walidacji, nie stała konfiguracja skilli.

Skille odczytują aktualny schemat przy każdym użyciu. Pełny start zadania
aplikacyjnego z rezerwacją wymaga ukończenia powyższych zależności. Do tego
czasu skill jawnie zgłasza blokadę; nie tworzy pól/hostingu, nie wymyśla URL-i
i nie zajmuje integracyjnego dev w zastępstwie. Niezależny, zlecony zakres
skilli/dokumentacji można wykonać bez środowiska, z opisaniem ograniczenia.

Po wdrożeniu zależności ponów test rezerwacji i wznowienia na rzeczywistym
środowisku. Sprawdź też zgodność nowych zasad branchowania, testowania i pól
z instrukcjami skilli. Nie oznaczaj całego zadania jako `Done`, dopóki brakuje
tej weryfikacji. Zmiany samych instrukcji nie wymagają wdrożenia aplikacji.

## Weryfikacja

Format obu skilli sprawdzono walidatorem `skill-creator/quick_validate.py`.
Pliki `agents/openai.yaml` mają spójne nazwy i prompty wskazujące właściwy skill.
Niezależny agent sprawdził poniższe scenariusze na danych offline, bez mutacji
GitHub. Jest to walidacja zachowania instrukcji, nie test wdrożenia infrastruktury.

| Scenariusz | Oczekiwany i potwierdzony w symulacji wynik |
| --- | --- |
| Propozycja opisu | Odczyt i propozycja w rozmowie, bez zapisu |
| Istniejący draft o tym samym zakresie | Wskazanie duplikatu, bez nowego zadania |
| Unikalny nowy draft i ponowienie | Jeden draft, status z aktualnego schematu, ponowienie zwraca istniejącą pozycję |
| Utrata odpowiedzi zapisu | Odszukanie wyniku przed ponowieniem; niepewny stan zatrzymuje mutacje |
| Otwarta zależność i brak pola środowiska | Jawna blokada zależnych działań |
| Wznowienie własnego brancha i rezerwacji | Bez nowego brancha, PR i rezerwacji; zachowanie zmian zadania |
| Wszystkie sloty zajęte | Bez przejęcia slotu i zastępowania go stałym dev |
| Błąd 403 lub ucięta lista | Zatrzymanie mutacji albo pobranie kompletu wyników |
| Gotowe zadanie i wolny slot z serializacją | Powiązania i rezerwacja zweryfikowane przed `In progress` |

Integrację z żywą tablicą oraz pozostałe ograniczenia opisano w
[zapisie weryfikacji](skille-github-projects-weryfikacja.md).
