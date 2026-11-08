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

Administratorzy zalogowani przez Google mogą poprawiać lokalizację: wskazać punkt, określić dokładność i opcjonalny komentarz oraz jawnie zapisać zmianę. Logowanie i wylogowanie są dostępne w sekcji konta u góry menu. Na komputerze nazwa użytkownika jest także widoczna obok hamburgera. Zapis sprawdza wersję pozycji, bez blokad edycji.

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

Katalog dev zawiera 200 miejsc: 196 przeniesionych z MVP.0 i cztery punkty sprzedaży benzyny potwierdzone w źródłach. Lokalizacje kandydackie pozostają nieustalone; kopie dawnych wycinków bez potwierdzonej podstawy publikacji są wyłączone, referencje zawierają odnośniki do źródeł.

Przy oddaleniu mapy pobliskie miejsca łączą się w grupy z liczbą punktów. Kliknięcie grupy przybliża mapę; wybrane miejsce pozostaje widoczne osobno.

Wyszukiwarka ma filtr „Bez lokalizacji”, łączony z wpisaną nazwą, adresem lub dzielnicą.

Potwierdzone w źródłach wycinki domeny publicznej są stopniowo podłączane do kart na dev. Źródła bez potwierdzonego statusu pozostają dostępne przez linki.

Warsztat badań ma projektowy skill, prywatne dane źródeł/materiałów/miejsc, synchronizację ze Storage i [lokalną przeglądarkę](data/places/README.md) (`npm run research:view`). Każde badanie kontynuuje wcześniejsze ustalenia; publikacja zatwierdzonych treści pozostaje osobnym etapem. Karty pokazują tagi i brak potwierdzenia istnienia w okresie międzywojennym.

Lokalny warsztat: widok Materiały pokazuje galerię skanów i wycinków z miejscami, źródłami oraz stanem praw. Prywatna archiwizacja jest niezależna od zgody na publikację.

Miejsce ma opis redakcyjny, udokumentowane daty i zweryfikowane wzmianki z właściwymi materiałami historycznymi. Lokalny warsztat rozdziela historyczne obrazy, kopie źródeł oraz materiały do rozpoznania; współczesne zdjęcia nie ilustrują dawnych wzmianek.

Rzeczywiste dane miejsc i wygenerowane katalogi pozostają poza Git. Testy i CI używają wyłącznie fikcyjnych danych; build dev pobiera aktualny snapshot z Firestore.
