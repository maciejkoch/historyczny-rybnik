# Historyczny Rybnik

Aplikacja do poznawania historii Rybnika przez mapę i miejsca.
[Wersja rozwojowa](https://historyczny-rybnik-dev.web.app/).

## Dostępne funkcje

- Strona „O nas” z opisem portalu, map i pracy na źródłach, dostępna z menu pod `/o-nas`.
- Mapa współczesnego Rybnika z przesuwaniem i przybliżaniem; widok początkowy i przycisk powrotu centrują ją na Rynku.
- Plan miasta z 1932 r., domyślnie włączony z kryciem 60%, z regulacją przezroczystości i oznaczeniem zasięgu. Zapisane preferencje użytkownika mają pierwszeństwo.
- Wyszukiwanie miejsc i karta bazyliki św. Antoniego z opisem, źródłami oraz osobnym adresem.
- Karta może pokazać zdjęcie główne oraz galerię materiałów miejsca, otwieraną w PhotoSwipe; stan lokalizacji opisuje kolorowa etykieta.
- Przełączanie mapy, wyszukiwania i szczegółów miejsca na telefonie i komputerze; zwinięte panele na komputerze mają ikonę wyszukiwania i ikonę głównego tagu wybranego miejsca.
- Ustawienia prywatności: osobne zgody na zapamiętywanie ustawień oraz usługi Google do logowania i edycji. Aktualne opublikowane miejsca są dostępne także bez zgody.
- Globalne menu we wspólnym górnym nagłówku: panel z prawej na telefonie i menu rozwijane na komputerze. Mapa i wyszukiwanie są oddzielone od polityki prywatności oraz ustawień cookies.

Administrator zalogowany przez Google może dodać miejsce z panelu „Miejsca” albo edytować kartę. Formularz obejmuje pola widoczne na karcie, tagi istniejące i nowe oraz wskazanie punktu na mapie. Przyciski zapisu i anulowania pozostają widoczne podczas przewijania. Logowanie i wylogowanie są dostępne w sekcji konta u góry menu.

## Dokumentacja

- [Opis techniczny i uruchomienie](TECHNICAL.md).
- [Zasady kodu i code review](CONTRIBUTING.md).
- [Obowiązujące zasady bezpieczeństwa](SECURITY.md).
- [Materiały referencyjne i plany](agent-context/reference/README.md).
- [Źródła wiedzy o historii Rybnika](resources/README.md).
- [Instrukcje agenta](AGENTS.md) i [materiały pomocnicze](agent-context/README.md).

Opis funkcji aktualizujemy w tej samej zmianie, która zmienia zachowanie aplikacji.

Każdy może zalogować się przez Google. Edycja lokalizacji i kart jest dostępna tylko dla administratorów; rolami zarządza operator.

Zapis miejsca wymaga roli administratora, Google Auth i App Check. Backend sprawdza wersję rekordu i unikalność adresu karty; zmiany treści lub lokalizacji są od razu publiczne. Administrator edytuje wzmianki i materiały w formularzach. Obrazy galerii i wzmianki może przesłać po potwierdzeniu prawa do udostępnienia; formularz zapisuje pochodzenie, wymagane metadane oraz sumy kontrolne.

Baza dev zawiera 200 opublikowanych miejsc: 196 przeniesionych z MVP.0 i cztery punkty sprzedaży benzyny potwierdzone w źródłach. Lokalizacje kandydackie pozostają nieustalone; kopie dawnych wycinków bez potwierdzonej podstawy publikacji są wyłączone, referencje zawierają odnośniki do źródeł.

Przy oddaleniu mapy pobliskie miejsca łączą się w grupy z liczbą punktów. Kliknięcie grupy przybliża mapę, a zmiana grupowania jest animowana; wybrane miejsce pozostaje widoczne osobno.

Panel „Miejsca” wyszukuje fragment nazwy i pozwala łączyć jeden główny tag z filtrem „Bez lokalizacji”. Wyniki pokazują tagi oraz dostępny adres historyczny; mapa pokazuje te same wyniki.

Materiały są podłączane do kart na dev wraz z dostępnym źródłem i informacją o prawach. Osoba przekazująca materiał odpowiada za prawo do jego udostępnienia.

Warsztat badań ma projektowy skill, prywatne dane źródeł/materiałów/miejsc, synchronizację ze Storage i [lokalną przeglądarkę](data/places/README.md) (`npm run research:view`). Każde badanie kontynuuje wcześniejsze ustalenia; publikacja zatwierdzonych treści pozostaje osobnym etapem. Karty pokazują tagi i brak potwierdzenia istnienia w okresie międzywojennym.

Lokalny warsztat: widok Materiały pokazuje galerię skanów i wycinków z miejscami, źródłami oraz stanem praw. Prywatna archiwizacja jest niezależna od zgody na publikację.

Miejsce ma opis redakcyjny, udokumentowane daty i zweryfikowane wzmianki z właściwymi materiałami historycznymi. Lokalny warsztat rozdziela historyczne obrazy, kopie źródeł oraz materiały do rozpoznania; współczesne zdjęcia nie ilustrują dawnych wzmianek.

Karty miejsc są renderowane z aktualnych danych z bazy; mapa i wyszukiwarka pobierają listę przez publiczne API przy załadowaniu aplikacji. Otwarte strony nie odświeżają się automatycznie. Baza jest jedynym źródłem danych aplikacji; fikcyjne rekordy pozostają wyłącznie w testach i CI.

Znaczniki mapy pokazują ikonę pierwszego (głównego) tagu miejsca. Zielony oznacza dokładną lokalizację (wskazany budynek), bursztynowy z przerywanym obrysem — przybliżoną. „Mapa i legenda” ma zakładki „Warstwy” i „Legenda” z ustawieniami planu oraz objaśnieniami ikon, kolorów i grup. Na telefonie są osobne przyciski: mapa rozwija mały panel planu, pozwalając obserwować zmianę krycia, a legenda otwiera osobny modal ze stale widocznym zamknięciem i przewijaną treścią. Na komputerze zakładki są w panelu, domyślnie otwartym; jego zwinięcie można zapamiętać po zgodzie na preferencje.
