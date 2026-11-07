# Historyczny Rybnik

Aplikacja do poznawania historii Rybnika przez mapę i miejsca.
[Wersja rozwojowa](https://historyczny-rybnik-dev.web.app/).

## Dostępne funkcje

- Mapa współczesnego Rybnika z przesuwaniem i przybliżaniem.
- Plan miasta z 1932 r. z regulacją przezroczystości i oznaczeniem zasięgu.
- Wyszukiwanie miejsc i karta bazyliki św. Antoniego z opisem, źródłami oraz osobnym adresem.
- Przełączanie mapy, wyszukiwania i szczegółów miejsca na telefonie i komputerze.
- Ustawienia prywatności: osobne zgody na zapamiętywanie ustawień i bieżące pozycje z usług Google. Bez zgody aplikacja korzysta z opublikowanego snapshotu.
- Globalne menu we wspólnym górnym nagłówku: panel z prawej na telefonie i menu rozwijane na komputerze. Mapa i wyszukiwanie są oddzielone od polityki prywatności oraz ustawień cookies.

Katalog obejmuje obecnie jeden kościół. Administratorzy zalogowani przez Google mogą poprawiać lokalizację: wskazać punkt, określić dokładność i opcjonalny komentarz oraz jawnie zapisać zmianę. Logowanie i wylogowanie są dostępne w sekcji konta u góry menu. Na komputerze nazwa użytkownika jest także widoczna obok hamburgera. Zapis sprawdza wersję pozycji, bez blokad edycji.

## Dokumentacja

- [Opis techniczny i uruchomienie](TECHNICAL.md).
- [Zasady kodu i code review](CONTRIBUTING.md).
- [Obowiązujące zasady bezpieczeństwa](SECURITY.md).
- [Materiały referencyjne i plany](agent-context/reference/README.md).
- [Instrukcje agenta](AGENTS.md) i [materiały pomocnicze](agent-context/README.md).

Opis funkcji aktualizujemy w tej samej zmianie, która zmienia zachowanie aplikacji.

Każdy może zalogować się przez Google. Edycja lokalizacji jest obecnie dostępna tylko dla administratorów; rolami zarządza operator.

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.
