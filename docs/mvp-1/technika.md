# MVP.1 — plan techniczny

Data weryfikacji: 4 listopada 2026. Status: **ustalony kierunek: SSG + Firebase Hosting + Functions; szczegóły do dopracowania przed implementacją**.

**Architektura MVP.1:** Angular prerender (SSG) dla publicznej treści, Firebase Hosting dla statycznych plików i Cloud Functions 2nd gen dla API. Mapa działa wyłącznie w przeglądarce. SSR jest opcją przyszłego rozwoju, a osobna usługa Cloud Run nie jest częścią planu MVP.1. [Uzasadnienie i porównanie wariantów](renderowanie-porownanie.md).

## 1. Rekomendowany kierunek

Angular z prerenderem (SSG) dla publicznych kart, Tailwind z tokenami marki, daisyUI dla podstawowych kontrolek, MapLibre GL JS dla mapy wektorowej, Firebase Authentication dla Google Sign-In, Firestore dla danych i Cloud Storage dla plików. Zmiany lokalizacji przechodzą przez backend, który sprawdza zalogowanie i App Check oraz aktualizuje bieżącą pozycję.

To rekomendacja projektowa. Projekt Firebase `historyczny-rybnik` został wybrany i utworzony. Wybór edycji i instancji Firestore, schemat dokumentów, dostawca kafelków oraz konfiguracja środowisk pozostają otwarte.

## 2. Wersje sprawdzone w rejestrze npm

| Pakiet | Stabilny tag `latest` w chwili sprawdzenia |
| --- | --- |
| `@angular/core` | 22.2.4 |
| `@angular/cli` | 22.2.5 |
| `tailwindcss` | 4.3.4 |
| `daisyui` | 5.7.50 |
| `maplibre-gl` | 6.16.0 |

Wersja CLI nie musi mieć tego samego numeru poprawki co framework. Przy rozpoczęciu implementacji ponownie sprawdzamy `latest`, zgodność zależności oraz zapisujemy dokładne wersje w lockfile. Nie wybieramy wersji `next` ani `rc`.

Angular 22.2.4 deklaruje Node `^22.22.3 || ^24.15.0 || >=26.0.0`. Linię Node dobieramy do wspólnego zakresu Angulara i środowiska uruchomieniowego. Backend Functions może mieć oddzielną wersję runtime oraz własny lockfile. Numery z tabeli nie są jeszcze manifestem zależności aplikacji.

Źródło: bezpośredni odczyt `https://registry.npmjs.org/<package>/latest` dla każdego pakietu. Kontekst: [wydania Angulara](https://angular.dev/reference/releases) i [zgodność wersji](https://angular.dev/reference/versions).

## 3. Frontend i branding

- Standalone Angular, stan interfejsu na Signals, moduły funkcjonalne ładowane według potrzeb.
- Tailwind 4: tokeny w CSS, wspólna konfiguracja kolorów, typografii, odstępów i promieni. Bez kopiowania przypadkowych wartości pomiędzy komponentami.
- daisyUI 5 jako zestaw bazowych kontrolek i motywu. Zachowanie wyszukiwarki, zarządzanie fokusem i panel mapy realizuje Angular; sama biblioteka CSS nie zapewnia kompletnego zachowania dostępności.
- Wybrana typografia: Lora dla nazwy i tytułów, Source Sans 3 dla opisów i kontrolek. Docelowo pliki fontów serwowane z aplikacji, z polskimi znakami i właściwymi licencjami.
- Wybrany kierunek logo: „Ryba na mapie” — symbol ryby połączony z układem ulic, w zielonej kolorystyce i z nazwą obok. Zastępuje wcześniejszy monogram HR. [Plansza koncepcyjna i status plików logo](assets/logo/README.md). Finalne SVG i favicon wymagają przygotowania oraz sprawdzenia w małym rozmiarze.
- Jeden panel: lista i karta są kolejnymi stanami; zapytanie i przewinięcie wyników są odtwarzane przy powrocie.

Źródła: [Tailwind — theme variables](https://tailwindcss.com/docs/theme), [daisyUI dla Angulara](https://daisyui.com/docs/install/angular/). Instrukcje instalacji traktujemy jako punkt odniesienia; ewentualnych konfliktów zależności nie ukrywamy wymuszoną instalacją.

## 4. Routing i SEO

- `/` — mapa, z publicznym tekstowym kontekstem aplikacji i zwykłymi odnośnikami do miejsc.
- `/miejsca/:slug` — publiczna karta miejsca, także przy braku współrzędnych. Slug jest oddzielony od trwałego identyfikatora rekordu; zmiana sluga wymaga przekierowania.
- SSG publicznego opisu, referencji, metadanych, canonical i nagłówków dla wszystkich opublikowanych kart. Lista slugów jest ustalana podczas builda.
- Mapa, znaczniki, plan historyczny i edycja pozycji uruchamiają się wyłącznie w przeglądarce. Build nie inicjalizuje DOM/WebGL mapy.
- Strona główna ma statyczny szkielet i tekstowy kontekst; mapa i bieżące dane są ładowane w przeglądarce.
- Statyczny build nie wymaga procesu SSR ani fallbacku serwerowego. Nieznane adresy nie mogą być przepisywane globalnie na `index.html` ze statusem 200.
- Zachowanie jednego panelu i adresu karty jest spójne przy wejściu bezpośrednim, odświeżeniu, nawigacji aplikacji oraz Wstecz/Dalej.
- Zapytanie i kadr mogą być stanem nawigacji; ich warianty nie tworzą osobnych indeksowalnych kopii karty.
- Nieistniejący slug zwraca rzeczywisty HTTP 404. Sitemap obejmuje opublikowane karty; brak pustych stron „O mnie” i „Współpraca”.
- Publiczny HTML jest dostępny bez logowania i bez tokenu App Check z przeglądarki. W przeciwnym razie utrudnilibyśmy indeksowanie.

Źródło: [Angular — SSR i renderowanie hybrydowe](https://angular.dev/guide/ssr).

## 5. Mapa

Rekomendacja: bezpośrednia integracja MapLibre GL JS w komponencie Angulara, bez uzależnienia od dodatkowego wrappera. Daje kontrolę nad paletą wektorową oraz obsługę osobnej nakładki rastrowej z 1932 r.

- Styl mapy utrzymywany w repozytorium: kolory budynków, dróg, zieleni, wody i etykiet zgodne z wybranym UX/UI.
- Miejsca katalogu są osobną warstwą danych; wybór punktu otwiera tę samą kartę co wynik wyszukiwarki.
- Nakładka historyczna ma regulowane krycie i jawny zasięg. Georeferencja nie gwarantuje dokładności historycznych posesji.
- Punkt przybliżony różni się też oznaczeniem i tekstem, nie tylko kolorem.
- Gdy WebGL lub podkład jest niedostępny, wyszukiwarka, lista i treść karty pozostają użyteczne.

**Do wyboru:** dostawca kafelków wektorowych, glifów i ikon stylu, licencje, limity, atrybucja oraz koszt. MapLibre jest silnikiem, nie usługą dostarczającą podkład. Dotychczasowy fragment danych OSM z prototypu nie jest kompletną usługą mapy dla całego miasta. Sprawdzamy także warunki użycia planu historycznego.

Źródła: [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/), [specyfikacja stylu](https://maplibre.org/maplibre-style-spec/layers/).

## 6. Dane, wyszukiwanie i pliki — decyzje przed schematem

Wybrano i utworzono osobny projekt Firebase `historyczny-rybnik` (Historyczny Rybnik). [Uproszczony model danych](model-danych.md) zakłada jedną główną kolekcję `places`: jeden dokument zawiera nazwę, slug, opis, adresy, lokalizację i tablicę referencji z datami oraz ścieżkami plików. Nie tworzymy podkolekcji historii; zapisujemy wyłącznie bieżącą pozycję. Nie tworzymy osobnych kolekcji instytucji, źródeł, plików, slugów ani wydań SSG.

Edycja Firestore i region nie zostały zatwierdzone; model nie wymaga Enterprise. Wcześniejsza rekomendacja Enterprise nie jest obowiązującą decyzją. Ostatni odczyt listy instancji zwrócił 403 z powodu niewłączonego Firestore API. Przed utworzeniem bazy ponawiamy sprawdzenie konfiguracji i wybieramy edycję oraz region. Obecnej bazy MVP.0 nie traktujemy automatycznie jako produkcyjnej bazy nowej aplikacji.

Dla obecnego katalogu około 200 miejsc proponuję na początek mały publiczny indeks nazw, aliasów i adresów, filtrowany w przeglądarce, bez pobierania opisów i wszystkich skanów przy wpisywaniu każdej litery. Format, odświeżanie i wersjonowanie indeksu ustalimy razem z modelem danych. Wzrost katalogu może uzasadnić wyszukiwanie serwerowe.

W schemacie zachowujemy osobne dokumenty miejsc, referencje wewnątrz każdego dokumentu, różne rodzaje dat, stopień dokładności lokalizacji oraz bieżącą pozycję. Kilka miejsc może mieć ten sam adres. Nie dodajemy osobnego modelu instytucji. Szczegóły pól i walidacji zawiera [model danych](model-danych.md). Nie wdrożono jeszcze schematu ani reguł.

Cloud Storage przechowuje pliki i miniatury, z metadanymi wskazującymi oryginalne źródło i podstawę użycia. Karty pobierają obrazy na żądanie. Zwykły użytkownik zmienia pozycję; nie otrzymuje przez to uprawnień do podmieniania skanów ani treści źródeł.

## 7. Backend, logowanie i App Check

Rekomendacja dla zapisów: Cloud Functions 2nd gen, endpoint callable do zmiany lokalizacji. Sprawdza użytkownika Firebase Auth, token App Check, dane wejściowe i wersję rekordu. Czas aktualizacji nadaje backend, nie klient. Autor zapisu nie jest utrwalany w modelu miejsca.

Zapis pozycji sprawdza `locationVersion` i aktualizuje jeden dokument miejsca w transakcji. Konflikt z nowszą zmianą zwraca czytelny wynik zamiast nadpisywania cudzego zapisu. Po niepewnym wyniku żądania klient ponownie odczytuje bieżący stan. Nie przechowujemy poprzednich pozycji, autorów zmian ani rejestru żądań; cofanie zmian nie wchodzi do MVP.1.

- Każdy zalogowany przez Google może zmienić lokalizację, bez moderacji przed publikacją.
- Użytkownik niezalogowany nie może zapisać zmiany nawet przez bezpośrednie wywołanie API.
- Administrator jest wskazany trwałym UID; początkowo jest nim właściciel. Szczegóły naprawy bieżących danych dopracujemy bez budowania panelu zarządzania rolami i mechanizmu cofania.
- App Check potwierdza pochodzenie żądania z aplikacji; autoryzację użytkownika sprawdzamy oddzielnie.
- Build SSG odczytuje wyłącznie opublikowane dane przez kontrolowaną ścieżkę z uprawnieniami środowiska CI. Dane uwierzytelniające nie trafiają do plików frontendu. Publiczny statyczny HTML nie wymaga tokenu przeglądarki. Interaktywne API aplikacji ma własne egzekwowanie App Check.
- Bezpośredni zapis danych z przeglądarki do bazy ma być zamknięty; zapis biznesowy realizuje backend. Reguły i testy emulatora przygotujemy po wyborze instancji oraz schematu.

Źródła: [egzekwowanie App Check w callable Functions](https://firebase.google.com/docs/app-check/cloud-functions), [weryfikacja App Check w custom backendzie](https://firebase.google.com/docs/app-check/custom-resource-backend).

## 8. Budowanie, publikacja i środowiska

- Angular generuje statyczne HTML dla `/` i wszystkich opublikowanych `/miejsca/:slug`, wraz z metadanymi i sitemapą. Wynik builda jest wdrażany na klasyczny Firebase Hosting, który serwuje także JavaScript, CSS i fonty.
- Cloud Functions 2nd gen obsługują API odczytu bieżących danych i zapisu lokalizacji. W MVP.1 nie renderują stron HTML. Nie wdrażamy osobnej usługi Cloud Run ani Firebase App Hosting.
- Mapa pobiera aktualne współrzędne niezależnie od wersji HTML. Zapis lokalizacji nie uruchamia builda ani deploymentu frontendu.
- Zmiana opisu, źródeł, metadanych lub zestawu publicznych adresów wymaga builda i deploymentu statycznej treści. Proces publikacji może być automatyczny i łączyć wiele zmian redakcyjnych. Nowe karty publikujemy wraz z ich stronami.
- Przy przyszłej moderacji oddzielamy zatwierdzenie materiału od zakończenia publikacji HTML. Błąd builda nie może być prezentowany jako udana publikacja. Materiały pobierane z API mogą pojawić się wcześniej niż zaktualizowany HTML.
- CI sprawdza build, indeksowalną treść, metadane, bezpośrednie wejścia, rzeczywiste 404 i przekierowania. Proces publikacji ma zachowywać możliwość powrotu do poprzedniej wersji.

Docelowo: oddzielna konfiguracja development i production, lokalne emulatory dla zapisów oraz CI dla testów i budowania. Regiony, billing oraz koszty infrastruktury, buildów i mapy wymagają ustalenia. Konfiguracja domeny i aktualny stan usług są opisane w [dokumencie domeny](domena-konfiguracja.md); sam plan nie oznacza wdrożenia aplikacji, bazy ani backendu.

### Możliwa późniejsza migracja do SSR

Jeśli częstotliwość publikacji lub rozmiar katalogu uzasadnią SSR, możemy przełączyć generowanie stron miejsc na renderowanie na żądanie. Mapa nadal pozostaje w przeglądarce; zachowujemy adresy i dane Firebase. SSR może działać jako HTTP Function 2nd gen — osobna usługa Cloud Run nie jest warunkiem migracji.

Od początku rozdzielamy odczyt publicznej treści od logowania i API zapisu, a kod mapy od renderowania HTML. Decyzja o przyszłym SSR wymaga wtedy osobnego sprawdzenia kosztów, cache, routingu i wdrożenia.

Źródła: [Angular — prerender i renderowanie hybrydowe](https://angular.dev/guide/ssr), [Firebase Hosting — konfiguracja tras i 404](https://firebase.google.com/docs/hosting/full-config), [Functions 2nd gen](https://firebase.google.com/docs/functions/version-comparison).

## 9. Następne decyzje i kolejność

1. Projekt Firebase wybrany i utworzony: `historyczny-rybnik`. Następnie ustalić instancję/edycję Firestore i regiony.
2. Doprecyzować [uproszczony model danych](model-danych.md): `places` z referencjami i bieżącą lokalizacją w dokumencie, bez podkolekcji historii. Ustalić uprawnienie do usuwania pozycji.
3. Wybrać dostawcę podkładu i potwierdzić warunki wykorzystania mapy historycznej.
4. Potwierdzić statyczny build SSG, routing Firebase Hosting i integrację Functions API na minimalnym szkielecie; oszacować koszt dla oczekiwanego ruchu i częstości publikacji.
5. Dopiero potem przygotować właściwy szkielet od zera i wdrażać kolejne funkcje.

Weryfikacja implementacji obejmie realne 404 i przekierowania, indeksowalny HTML bez JS, nawigację panelu, dostępność bez mapy, zapisy bez Auth/App Check, konflikty edycji, ponowny odczyt po niepewnym wyniku zapisu oraz rozróżnienie miejsc bez pozycji i przybliżonych.


## Utworzony projekt — 4 listopada 2026

- Nazwa: **Historyczny Rybnik**.
- Project ID: `historyczny-rybnik`.
- Numer projektu: `301143182490`.
- [Konsola Firebase](https://console.firebase.google.com/project/historyczny-rybnik/overview).
- Repozytorium ma własny `.firebaserc` wskazujący ten projekt i pusty `firebase.json`; nie skonfigurowano jeszcze produktów do wdrożenia.
- Projekt MVP.0 pozostaje odrębny: `maciejkoch-project-1`.


## Rozwój po MVP.1 — moderowane materiały

Uwzględnić przyszłe komentarze, źródła i zdjęcia zgłaszane przez użytkowników, wszystkie z weryfikacją redaktora przed publikacją. Rozdzielić prywatną ścieżkę zgłoszeń i plików od publicznej treści oraz generowania HTML. Zatwierdzenie może automatycznie uruchamiać publikację SSG; treści pobierane z API mogą być dostępne wcześniej. [Wpływ na renderowanie i deployment](renderowanie-porownanie.md#przyszłe-materiały-od-użytkowników-i-moderacja).
