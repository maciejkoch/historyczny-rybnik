# MVP.1 — wstępny plan techniczny

Data weryfikacji: 4 listopada 2026. Status: **propozycja do omówienia; bez wdrażania usług i implementacji aplikacji**.

## 1. Rekomendowany kierunek

Angular z SSR dla publicznych kart, Tailwind z tokenami marki, daisyUI dla podstawowych kontrolek, MapLibre GL JS dla mapy wektorowej, Firebase Authentication dla Google Sign-In, Firestore dla danych i Cloud Storage dla plików. Zmiany lokalizacji przechodzą przez backend, który sprawdza zalogowanie i App Check oraz zapisuje historię razem ze zmianą.

To rekomendacja projektowa. Wybór edycji i instancji Firestore, schemat dokumentów, dostawca kafelków oraz konfiguracja środowisk pozostają otwarte.

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
- Wybrany znak: monogram HR w ciemnozielonym kole i nazwa obok. Finalne SVG i favicon wymagają przygotowania oraz sprawdzenia w małym rozmiarze.
- Jeden panel: lista i karta są kolejnymi stanami; zapytanie i przewinięcie wyników są odtwarzane przy powrocie.

Źródła: [Tailwind — theme variables](https://tailwindcss.com/docs/theme), [daisyUI dla Angulara](https://daisyui.com/docs/install/angular/). Instrukcje instalacji traktujemy jako punkt odniesienia; ewentualnych konfliktów zależności nie ukrywamy wymuszoną instalacją.

## 4. Routing i SEO

- `/` — mapa, z publicznym tekstowym kontekstem aplikacji i zwykłymi odnośnikami do miejsc.
- `/miejsca/:slug` — publiczna karta miejsca, także przy braku współrzędnych. Slug jest oddzielony od trwałego identyfikatora rekordu; zmiana sluga wymaga przekierowania.
- SSR publicznego opisu, referencji, metadanych, canonical i nagłówków. Mapa uruchamiana dopiero w przeglądarce, bez dostępu do DOM/WebGL podczas SSR.
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

Nie wybrano jeszcze docelowego projektu Firebase, instancji ani edycji Firestore. Przed konkretnym schematem i regułami należy ustalić te parametry, lokalizację oraz zgodność z backendem. Obecnej bazy MVP.0 nie traktujemy automatycznie jako produkcyjnej bazy nowej aplikacji.

Porównanie Standard/Enterprise obejmie wymagane operacje, transakcje, indeksy i koszty. Enterprise ma obecnie własne wyszukiwanie tekstowe; nie zakładamy więc ogólnie, że Firestore nie obsługuje full text. [Firestore Enterprise — text search](https://firebase.google.com/docs/firestore/enterprise/text-search).

Dla obecnego katalogu około 200 miejsc proponuję na początek mały publiczny indeks nazw, aliasów i adresów, filtrowany w przeglądarce, bez pobierania opisów i wszystkich skanów przy wpisywaniu każdej litery. Format, odświeżanie i wersjonowanie indeksu ustalimy razem z modelem danych. Wzrost katalogu może uzasadnić wyszukiwanie serwerowe.

W schemacie zachowamy reguły z planu funkcjonalnego: osobne rekordy punktów, powiązania referencji, różne rodzaje dat, stopień dokładności lokalizacji, historię zmian i powiązania instytucji z wieloma siedzibami. Szczegółowy schemat jest następnym krokiem po wyborze bazy.

Cloud Storage przechowuje pliki i miniatury, z metadanymi wskazującymi oryginalne źródło i podstawę użycia. Karty pobierają obrazy na żądanie. Zwykły użytkownik zmienia pozycję; nie otrzymuje przez to uprawnień do podmieniania skanów ani treści źródeł.

## 7. Backend, logowanie i App Check

Rekomendacja dla zapisów: Cloud Functions 2nd gen, endpoint callable do zmiany lokalizacji. Sprawdza użytkownika Firebase Auth, token App Check, dane wejściowe i wersję rekordu. Autor i czas wynikają z backendu, nie z przesłanych przez klienta wartości.

Zmiana pozycji i wpis historii muszą być atomowe. Konflikt z nowszą zmianą zwraca czytelny wynik zamiast nadpisywania cudzego zapisu. Ponowienie żądania nie powinno tworzyć duplikatów tej samej zmiany. To wymagania do uwzględnienia w schemacie i protokole API.

- Każdy zalogowany przez Google może zmienić lokalizację, bez moderacji przed publikacją.
- Użytkownik niezalogowany nie może zapisać zmiany nawet przez bezpośrednie wywołanie API.
- Administrator jest wskazany trwałym UID; początkowo jest nim właściciel. Zakres cofania i naprawy danych dopracujemy bez budowania panelu zarządzania rolami.
- App Check potwierdza pochodzenie żądania z aplikacji; autoryzację użytkownika sprawdzamy oddzielnie.
- Publiczne SSR odczytuje opublikowane dane przez kontrolowaną ścieżkę serwerową. Publiczne strony nie wymagają tokenu przeglądarki. Interaktywne API aplikacji ma własne egzekwowanie App Check.
- Bezpośredni zapis danych z przeglądarki do bazy ma być zamknięty; zapis biznesowy realizuje backend. Reguły i testy emulatora przygotujemy po wyborze instancji oraz schematu.

Źródła: [egzekwowanie App Check w callable Functions](https://firebase.google.com/docs/app-check/cloud-functions), [weryfikacja App Check w custom backendzie](https://firebase.google.com/docs/app-check/custom-resource-backend).

## 8. Hosting i środowiska

Wstępna rekomendacja przy wymaganiu najnowszego Angulara: Firebase Hosting dla zasobów i domeny, z przekierowaniem tras SSR do własnej usługi Cloud Run. Zapisy lokalizacji pozostają w Functions. Taką ścieżkę należy potwierdzić małym testem budowania i routingu przed implementacją reszty aplikacji.

**Powód:** tabela wsparcia Firebase App Hosting odczytana 4 listopada 2026 oznacza Angular 19.2 jako active i zastrzega brak oficjalnego wsparcia wersji poza tabelą. Nie zakładamy, że deklaracja „Angular 18.2 i nowsze” jest gwarancją aktywnego wsparcia Angulara 22. App Hosting można ponownie ocenić, gdy konkretna aktualna wersja będzie objęta wsparciem.

Alternatywą jest prerender publicznych kart na klasycznym Hostingu, ale wymagałby ustalenia odświeżania HTML po zmianach danych. SSR lepiej odpowiada bieżącej edycji punktów, choć dodaje środowisko serwerowe.

Źródła: [App Hosting — tabela wsparcia](https://firebase.google.com/docs/app-hosting/frameworks-tooling), [Hosting i usługi serverless](https://firebase.google.com/docs/hosting/serverless-overview), [Angular SSR na Cloud Run](https://docs.cloud.google.com/run/docs/quickstarts/frameworks/deploy-angular-ssr-service).

Docelowo: oddzielna konfiguracja development i production, lokalne emulatory dla zapisów, CI dla testów i budowania. Dobór projektu, regionów, billing oraz koszty infrastruktury i mapy wymagają osobnego ustalenia. Nie utworzono usług ani nie włączono płatnego planu w ramach tego dokumentu.

## 9. Następne decyzje i kolejność

1. Wybrać projekt Firebase, docelową instancję/edycję Firestore i regiony.
2. Uzgodnić szczegółowy schemat punktu, referencji, publikacji, datowania, pliku i historii zmian.
3. Wybrać dostawcę podkładu i potwierdzić warunki wykorzystania mapy historycznej.
4. Potwierdzić ścieżkę SSR testem minimalnej aplikacji oraz oszacować koszt dla oczekiwanej skali ruchu.
5. Dopiero potem przygotować właściwy szkielet od zera i wdrażać kolejne funkcje.

Weryfikacja implementacji obejmie realne 404 i przekierowania, indeksowalny HTML bez JS, nawigację panelu, dostępność bez mapy, zapisy bez Auth/App Check, konflikty edycji, atomową historię oraz rozróżnienie miejsc bez pozycji i przybliżonych.
