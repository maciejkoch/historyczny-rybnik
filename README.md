# Historyczny Rybnik

Aplikacja do poznawania historii Rybnika przez mapę i miejsca.
[Wersja rozwojowa](https://historyczny-rybnik-dev.web.app/).

Operator może przygotować nowe miejsce lub uzupełnić istniejące skillem [rybnik-create-place](.agents/skills/rybnik-create-place/SKILL.md), działającym bez starego warsztatu i synchronizacji. Podgląd obejmuje treść, daty, źródła, historyczne obrazy i ich prawa oraz lokalizację, jeśli można ją ustalić. Dodatkowe znalezione źródła wymagają akceptacji. Po zatwierdzeniu danych importer zapisuje miejsce i obrazy do dev; odbiór w aplikacji wykonuje właściciel.

## Dostępne funkcje

- Strona „O nas” z opisem portalu, map i pracy na źródłach, dostępna z menu pod `/o-nas`.
- Mapa współczesnego Rybnika z przesuwaniem i przybliżaniem; widok początkowy i przycisk powrotu centrują ją na Rynku.
- Plan miasta z 1932 r., domyślnie włączony z kryciem 100%, z regulacją przezroczystości i oznaczeniem zasięgu. Zapisane preferencje użytkownika mają pierwszeństwo.
- Wyszukiwanie miejsc i karty miejsc z opisem, źródłami oraz osobnym adresem.
- Karta może pokazać zdjęcie główne oraz galerię materiałów miejsca, otwieraną w PhotoSwipe; stan lokalizacji opisuje kolorowa etykieta. Skany mogą pokazywać pełną stronę z ramką wskazującą fragment dotyczący miejsca.
- Przełączanie mapy, wyszukiwania i szczegółów miejsca na telefonie i komputerze; zwinięte panele na komputerze mają ikonę wyszukiwania i ikonę głównego tagu wybranego miejsca.
- Ustawienia prywatności: osobne zgody na zapamiętywanie ustawień oraz usługi Google do logowania i edycji. Aktualne opublikowane miejsca są dostępne także bez zgody.
- Globalne menu we wspólnym górnym nagłówku: panel z prawej na telefonie i menu rozwijane na komputerze. Mapa i wyszukiwanie są oddzielone od polityki prywatności oraz ustawień cookies.

Administratorzy zalogowani przez Google mogą poprawiać lokalizację: wskazać punkt, określić dokładność i opcjonalny komentarz oraz jawnie zapisać zmianę. Logowanie i wylogowanie są dostępne w sekcji konta u góry menu. Na komputerze nazwa użytkownika jest także widoczna obok hamburgera. Ostatni zapis lokalizacji wygrywa.

## Dokumentacja

- [Opis techniczny i uruchomienie](TECHNICAL.md).
- [Zasady kodu i code review](CONTRIBUTING.md).
- [Obowiązujące zasady bezpieczeństwa](SECURITY.md).
- [Materiały referencyjne i plany](agent-context/reference/README.md).
- [Źródła wiedzy o historii Rybnika](resources/README.md).
- [Instrukcje agenta](AGENTS.md) i [materiały pomocnicze](agent-context/README.md).

Opis funkcji aktualizujemy w tej samej zmianie, która zmienia zachowanie aplikacji.

Każdy może zalogować się przez Google. Edycja lokalizacji jest obecnie dostępna tylko dla administratorów; rolami zarządza operator.

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.

Baza dev zawiera m.in. Bazylikę św. Antoniego Padewskiego, Kamienicę Noaha Leschczinera, Rybnicką Synagogę, Państwowe Gimnazjum Męskie w Rybniku, Stary cmentarz żydowski oraz cztery przedwojenne stacje benzynowe: Plintów (Standard Oil), Ożoga, E. Dardy i przy warsztacie Krajewskiego. Pozostałe miejsca są przygotowywane do ponownego wprowadzenia.

Przy oddaleniu mapy pobliskie miejsca łączą się w grupy z liczbą punktów. Kliknięcie grupy przybliża mapę, a zmiana grupowania jest animowana; wybrane miejsce pozostaje widoczne osobno.

Panel „Miejsca” wyszukuje fragment nazwy i pozwala łączyć jeden tag z filtrem „Bez lokalizacji”. Wybór tagu pokazuje także miejsca, dla których jest on tagiem dodatkowym. Filtry dotyczą tylko listy miejsc; mapa nadal pokazuje wszystkie miejsca z lokalizacją i wyróżnia wybrane miejsce. Wyniki listy pokazują tagi oraz dostępny adres historyczny.

Materiały są podłączane do kart na dev wraz z dostępnym źródłem i informacją o prawach. Osoba przekazująca materiał odpowiada za prawo do jego udostępnienia.

Prywatny warsztat badań i jego skill pozostają zachowane, ale ich integracja z nowym modelem aplikacji wymaga osobnego dostosowania. Dotychczasowe narzędzia warsztatu mogą nie działać z nowym kontraktem.

Miejsce ma krótki opis, ręcznie wpisany udokumentowany zakres, wzmianki i galerię materiałów.

Karty miejsc są renderowane z aktualnych danych z bazy; mapa i wyszukiwarka pobierają listę przez publiczne API przy załadowaniu aplikacji. Otwarte strony nie odświeżają się automatycznie. Baza jest jedynym źródłem danych aplikacji; fikcyjne rekordy pozostają wyłącznie w testach i CI.

Znaczniki mapy pokazują ikonę pierwszego (głównego) tagu miejsca. Zielony oznacza dokładną lokalizację (wskazany budynek), bursztynowy z przerywanym obrysem — przybliżoną. „Mapa i legenda” ma zakładki „Warstwy” i „Legenda” z ustawieniami planu oraz objaśnieniami ikon, kolorów i grup. Na telefonie są osobne przyciski: mapa rozwija mały panel planu, pozwalając obserwować zmianę krycia, a legenda otwiera osobny modal ze stale widocznym zamknięciem i przewijaną treścią. Na komputerze zakładki są w panelu, domyślnie otwartym; jego zwinięcie można zapamiętać po zgodzie na preferencje.
