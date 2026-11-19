# Opis techniczny

Aktualny stan kodu i konfiguracji. [CONTRIBUTING.md](CONTRIBUTING.md) określa praktyki implementacji i review. [SECURITY.md](SECURITY.md) określa obowiązujące wymagania bezpieczeństwa przy pracy i review; opis mechanizmów poniżej nie zastępuje ich weryfikacji. Materiały szczegółowe i plany są w [agent-context/reference/](agent-context/reference/README.md).

## Stos

- Angular 22.2 (core 22.2.4, CLI/build/SSR 22.2.5), TypeScript 6.0, RxJS 7.8.
- Tailwind CSS 4.3.4 i daisyUI 5.7.50; fonty Lora i Source Sans 3 z lokalnych pakietów Fontsource.
- MapLibre GL JS 6.16.0.
- Hybrydowe renderowanie: statyczne strony SSG, SSR kart miejsc w Firebase Functions i hydratacja; klasyczny Firebase Hosting.
- Node 22.23.2 z `.nvmrc`, npm 12.0.2. Dokładne zależności: `package.json` i `package-lock.json`.
- Firebase JS 12.19.0 i Zod 4.6.6; backend Firebase Functions, Firestore, Storage, Google Auth i App Check.

## Mechanizmy i struktura

- Angular generuje publiczny HTML i hydratację; mapa jest uruchamiana wyłącznie w przeglądarce.
- Trasy: `/` (mapa), `/szukaj`, `/miejsca/:slug` dla opublikowanych miejsc, `/o-nas`, `/prywatnosc` i 404. Hosting nie stosuje globalnego fallbacku SPA.
- Mapa i wyszukiwarka pobierają listę opublikowanych miejsc przez API przy otwarciu. Karta miejsca jest renderowana na serwerze z bieżących danych z Firestore; otwarte strony nie są automatycznie odświeżane. Logowanie i edycja nadal wymagają zgody Google.
- Komponenty panelu i mapy są w `src/app/atlas/` i `src/app/atlas-map/`; `src/app/places/` obsługuje modele i API miejsc, `src/app/privacy/` zgody i politykę prywatności. Stan interfejsu korzysta z Signals.
- `functions/` zawiera backend i jego testy; `functions/src/contracts/` współdzielone kontrakty. `data/` przechowuje dane do publikacji, a `infra/` konfigurację infrastruktury.
- `public/` zawiera zasoby, `scripts/` narzędzia budowania i danych, `.github/` CI. `agent-context/` zawiera współdzielone materiały pomocnicze i opisy szczegółowe w `reference/`, a ignorowany `agent-context/.local/` lokalne materiały robocze agenta.
- Backend dev działa w projekcie `historyczny-rybnik`: baza `places-dev`, bucket `historyczny-rybnik-dev-files`, codebase Functions `places-dev` i osobne konta usług dev; Auth jest wspólne. [Konfiguracja](agent-context/reference/mvp-1/faza-3-infrastruktura.md).

## Architektura frontendu

| Obszar | Odpowiedzialność |
| --- | --- |
| `src/main.ts`, `main.server.ts`, `app.config*.ts` | Start przeglądarki, SSG i SSR, konfiguracja Angulara, routera i hydratacji. |
| `app.routes.ts`, `app.routes.server.ts` | Trasy statyczne i parametryczna trasa SSR `/miejsca/:slug`; atlas pozostaje ładowany osobno, a reuse rozpoznaje go po `data.atlas`. |
| `app/atlas/atlas.ts` | Łączy stan trasy, wyszukiwania, wybranego miejsca i lokalizacji. Ustawia metadane, zarządza nawigacją, przewijaniem i powiększaniem skanów. |
| `app/atlas/place-*-panel.*` | Osobne widoki wyników wyszukiwania i szczegółów miejsca; panel miejsc pokazuje szkielet po 250 ms pobierania katalogu i ponowienie przy błędzie. |
| `app/atlas/panel-layout.ts` | Układ i rozmiar paneli oraz ustawienia zapamiętywane zgodnie ze zgodą użytkownika. |
| `app/atlas-map/` | Mapa i jej znaczniki. |
| `app/places/` | Typy, normalizacja wyszukiwania, klient publicznego API, konfiguracja Firebase i odczyt pozycji. `AtlasReuse` zachowuje instancję atlasu między jego trasami. |
| `app/about/` | Publiczna strona „O nas”, prerenderowana pod `/o-nas`, z metadanymi i wspólnym układem portalu. Desktop udostępnia przycisk Mapa, telefon również Znajdź miejsce. App ustawia przewinięcie okna na górę po wyrenderowaniu każdej zmiany ścieżki, także Wstecz/Dalej; zmiana samego zapytania nie przesuwa widoku. Atlas zeruje właściwy panel przy przejściu do wyszukiwarki lub karty na desktopie. |
| `app/privacy/` | Serwis zgód, baner i polityka prywatności. Wycofanie zgody Google przeładowuje stronę, aby zatrzymać SDK i odświeżanie tokenów. |
| `app/layout/` | Wspólny nagłówek, stopka, nawigacja mobilna i menu globalne. `PortalMenu` otacza wspólny układ aplikacji standardową strukturą Drawer daisyUI (`drawer-toggle`, `drawer-content`, `drawer-side`, `drawer-overlay`) i współdzieli listę odnośników z Dropdown daisyUI na Popover API oraz CSS Anchor Positioning. Stan nagłówka i menu łączy `PortalMenuState`. Wspólny nagłówek jest przyklejony do góry; na desktopie zajmuje pełną szerokość nad mapą i panelami. Dropdown otwiera się pod hamburgerem i pomija odnośnik Miejsca, ponieważ wyszukiwarka jest dostępna w panelu. Na telefonie menu zachowuje Mapa/Miejsca; tło jest nieaktywne dzięki `inert`, przewijanie strony jest blokowane, a fokus wraca do hamburgera. Przejścia otwierania i zamykania pochodzą z daisyUI. |

Przepływ danych: Firestore `places-dev` → zweryfikowane publiczne projekcje → SSR karty lub API lekkiego katalogu → mapa i wyszukiwarka. SSR przekazuje szczegóły przez TransferState do hydratacji. Na trasach wewnętrznych szczegóły pobiera przeglądarka; brak miejsca oznacza 404, a błąd serwera 503. Dynamiczne odpowiedzi używają no-store i dev noindex. Statyczne strony pozostają prerenderowane.

Atlas przekazuje mapie pełny katalog miejsc, a panelowi wyszukiwania wynik filtrowania nazwy, głównego tagu i braku lokalizacji. Mapa tworzy znaczniki dla miejsc ze współrzędnymi i wyróżnia wybrane miejsce niezależnie od filtrów listy.

`Locations` ładuje Firebase i App Check dopiero po zgodzie Google i pobiera bieżącą pozycję przed edycją. Publiczne API i karty są dostępne niezależnie od zgody; publiczny odczyt nie zmienia chronionego API zapisu.

## Architektura backendu

| Obszar | Odpowiedzialność |
| --- | --- |
| `functions/src/public-places.mjs`, `public-web.mjs` | Jawne, walidowane projekcje publiczne; dynamiczny katalog, karta, sitemap i SSR. |
| `functions/src/index.mjs` | Inicjalizuje Admin SDK i bazę `places-dev`, eksportuje callable API `placesDevRead` i `placesDevUpdate` w regionie `europe-central2`. Konfiguruje App Check, CORS, konto usługi i limity zasobów. |
| `functions/src/service.mjs` | Realizuje odczyt publicznych pozycji i transakcyjny zapis lokalizacji, autoryzację oraz mapowanie danych Firestore na odpowiedź API. |
| `functions/src/validation.mjs` | Udostępnia walidację wejścia i katalogu oraz wspólny format błędów walidacji. |
| `functions/src/contracts/places.mjs` | Schematy Zod współdzielone przez backend, frontend i skrypty publikacji; obejmują katalog, żądania i odpowiedzi. |
| `functions/test/` | Testy logiki, kontraktów i walidacji oraz testy API i reguł w emulatorach. |
| `firestore.rules`, `storage.rules`, `firestore.indexes.json` | Kontrola bezpośredniego dostępu klientów i konfiguracja indeksów. Operacje serwerowe działają przez Admin SDK i uprawnienia IAM. |
| `firebase.backend.dev.json`, `infra/iam.dev.json` | Docelowe zasoby backendu dev i uprawnienia kont usług. |

`placesDevRead`: App Check → walidacja listy identyfikatorów → odczyt opublikowanych dokumentów `places` → odpowiedź z lokalizacją i czasem aktualizacji. Nie wymaga zalogowanego użytkownika.

`placesDevUpdate`: App Check, Google Auth i rola administratora → walidacja → zapis lokalizacji z czasem serwera. Równoległe zapisy stosują zasadę ostatniego zapisu. API nie przechowuje historii ani autora zmiany.


## Schemat miejsca

Aktualny kontrakt katalogu, publicznej projekcji i prywatnego warsztatu oraz przykład rekordu opisuje [schemat miejsca](agent-context/reference/place-schema.md). Źródłem prawdy są schematy w kodzie.

Miejsce ma niezależną galerię `materials`; wzmianki odwołują się do niej przez `materialIds`. Galeria pokazuje wszystkie materiały; PhotoSwipe używa wymiarów obrazu. Pola praw nie blokują dodawania lub wyświetlania. Prywatny warsztat i dawny skill badawczy nie są częścią nowego przepływu aplikacji; ich integracja wymaga późniejszych prac. Nowy skill `rybnik-create-place` przygotowuje samodzielnie pakiet aktualnego kontraktu. Dokumentację źródeł, datowania i praw zachowuje w `review.md` przy lokalnym pakiecie `.local/place-drafts/ID/`; nie korzysta z warsztatu, jego rejestrów ani synchronizacji. Skany przygotowuje jako pełne strony z mechanicznie wrysowanymi ramkami fragmentów, również w miniaturach. Czysty oryginał, współrzędne i sumy zachowuje prywatnie; publiczny `sourceUrl` wskazuje źródło i stronę PDF. To zwykłe obrazy aktualnego kontraktu, bez osobnej warstwy w galerii.

Wspólne API i renderer SSR wdrażamy z tego samego builda. Nie utrzymujemy zgodności ze starym kontraktem.

## Katalog lokalny `.local/`

To generowany, ignorowany przez Git katalog danych roboczych. `places:snapshot` zapisuje tu punkt odniesienia dla eksportu warsztatu i narzędzi operatora; build i wdrożenie aplikacji z niego nie korzystają. `prepare-hosting.mjs` zapisuje lokalną konfigurację Hosting. Lokalne notatki i skrypty agenta trafiają do osobnego `agent-context/.local/`.

## Uruchomienie, publikacja i weryfikacja

Wymagany Node zgodny z `.nvmrc` (22.23.2) oraz npm 12.0.2.

```sh
npm ci
npm ci --prefix functions
npm start
npm run build
npm run emulate
```

Build generuje statyczne strony informacyjne w `dist/historyczny-rybnik/browser` i serwer Angulara w `functions/ssr`. Nie wymaga kopii danych miejsc ani połączenia z Firestore; rekordy aplikacji pochodzą z publicznego API w runtime, a SSR karty pobiera aktualną projekcję z bazy. Build sprawdza obecność serwera SSR, ale nie renderuje fikcyjnej karty. `data/places.fixture.json` jest używany tylko w testach. `npm run build` sprawdza też prerender strony głównej, 404 i blokadę indeksowania preview. Fonty Lora i Source Sans 3 (również latin-ext z polskimi znakami) są bundlowane lokalnie z pakietów Fontsource; ich licencje znajdują się w `public/fonts`.

## Środowiska i publikacja

| Środowisko | Adres | Witryna Hosting | Polecenie |
| --- | --- | --- | --- |
| Dev — integracja | https://historyczny-rybnik-dev.web.app/ | `historyczny-rybnik-dev` | `npm run deploy:dev` |
| Produkcja — wydania | https://historyczny.rybnik.pl/ | `historyczny-rybnik` | `npm run deploy:prod` (obecnie blokowane) |

Dev jest osobną witryną Hosting ze swoim kanałem live, dlatego nie wygasa i ma stały adres. Konfiguracja `firebase.dev.json` wskazuje dev, a `firebase.json` produkcję. `deploy:dev` buduje aplikację bez pobierania danych miejsc; SSR i API czytają bieżące rekordy z Firestore w runtime. Backend dev: `npm run deploy:backend:dev`. Nie konfigurujemy automatycznych deploymentów CI ani poświadczeń w repo.

Skrypt wdrożenia wiąże Hosting ze zbudowaną funkcją SSR przy użyciu pinTag: integracyjny dev używa `placesDevWeb`, sloty `placesDevWeb1`, `placesDevWeb2`, `placesDevWeb3`. Publiczne API i sitemapę obsługuje wspólna funkcja `placesDevWeb`. Każda funkcja korzysta z tej samej bazy dev. Stan faktycznych migracji slotów opisuje dokument środowisk.

Ustalenie z 5 listopada 2026: bieżące prace publikujemy na dev. Skrypt `deploy:prod` obecnie przerywa pracę bez publikacji, dopóki faza 5 nie przygotuje backendu, domeny i indeksowania produkcji. Produkcję publikujemy na wyraźne zlecenie wydania; dodanie polecenia nie oznacza publikacji obecnego szkieletu. Indeksowanie produkcji włączamy w fazie 5; obecny build ma noindex. Logowanie CLI: `npx firebase login`.

Obie witryny należą do `historyczny-rybnik`. Właściciel wybrał wspólne Auth i billing oraz oddzielną bazę, bucket, funkcje i konta usług dev. Szczegóły izolacji i poleceń: [faza 3](agent-context/reference/mvp-1/faza-3-infrastruktura.md).

### Tymczasowe preview

```sh
npx firebase login
npm run preview
```

Polecenie buduje aplikację i publikuje wyłącznie kanał `faza-1` w projekcie `historyczny-rybnik`, ważny 30 dni. Używa lokalnego logowania Firebase CLI; poświadczenia nie trafiają do repozytorium. Nie publikuje kanału live. Konfiguracje nie zawierają fallbacku SPA: nieznane URL-e zwracają HTTP 404 z własnym `404.html`. Preview blokuje indeksowanie przez meta robots, robots.txt i nagłówek X-Robots-Tag. Przed produkcją w fazie 5 potrzebna będzie osobna konfiguracja indeksowania.

CI wykonuje `npm ci`, build i zapisuje artefakt Hosting. Nie ma uprawnień do deploymentu. CI uruchamia także walidację oraz testy API/reguł w emulatorach. Offline build korzysta wyłącznie z fikcyjnego data/places.fixture.json, bez poświadczeń chmurowych.

[Zapis odbioru fazy 1](agent-context/reference/mvp-1/odbior-fazy-1.md).

Szczegóły: [środowiska dev i produkcja](agent-context/reference/mvp-1/srodowiska.md).

## Testy i utrzymanie

`npm test` sprawdza mapę, kontrakty, prywatność i backend; odłączony warsztat wymaga osobnego dostosowania. `npm run test:emulator` weryfikuje API i reguły w emulatorach Firestore/Storage. Przy zmianach georeferencji uruchamiamy testy opisane w [scripts/maps/README.md](scripts/maps/README.md).

Szczegóły zgód i ich odbioru: [cookie-consent.md](agent-context/reference/mvp-1/cookie-consent.md). Aktualizujemy ten dokument razem ze zmianami technologii, mechanizmów, struktury i procedur. Sama dokumentacja nie wymaga deploymentu.

### Środowiska równoległych zadań

Trzy witryny `historyczny-rybnik-dev-1`, `-2`, `-3` mają osobne konfiguracje `firebase.dev-N.json` i polecenia `deploy:dev-N`. Współdzielą istniejący backend dev; domeny dopuszczono w CORS, Auth i App Check. Atomowe blokady `env-lock/dev-N` oraz pole Środowisko w Projects określają rezerwacje. Pełny proces: [środowiska](agent-context/reference/mvp-1/srodowiska.md). Stały dev służy integracji.

Rola administratora: custom claim `admin: true` w Firebase Auth. Rejestracja i przeglądanie są publiczne; zapis lokalizacji wymaga Google Auth, App Check i roli admina. Rola dociera do klienta przy wydaniu nowego tokenu, np. po ponownym logowaniu. Odebranie roli nie unieważnia już wydanego tokenu (ważnego do około godziny).

Podczas edycji lokalizacji wybór innych miejsc jest wyłączony, współrzędne są tylko informacją. Komentarz jest opcjonalny: edytor wczytuje bieżący tekst i zastępuje go przy zapisie (pusty tekst usuwa komentarz), bez historii komentarzy.

## Dane dev i warsztat

Przed podmianą katalogu wykonuje się pełną kopię Firestore i powiązanych plików z manifestem w ignorowanym lokalnym folderze. Baza pozostaje źródłem danych SSR i API. Dotychczasowy importer jest przestarzały i nie obsługuje nowego schematu. Prywatny warsztat zachowano bez zmian, ale jego integracja z nowym kontraktem nie jest dostępna.

`places:import-one` (`scripts/places/import-place.mjs`) obsługuje pojedynczy pełny rekord aktualnego kontraktu. Domyślny podgląd jest lokalny; zapis wymaga jawnego projektu dev, `--apply` i SHA-256 zatwierdzonego pakietu. Odczyt `--read=ID --output=PLIK` obejmuje również drafty. Impersonacja Firestore korzysta z istniejącego konta importera; upload z dotychczasowego mechanizmu operatora. Skrypt sprawdza kolizje slugów, konflikt `updatedAt`, zachowuje `createdAt`, nadaje czas zapisu, zapisuje lokalną kopię poprzedniego rekordu i publikuje tylko zatwierdzone warianty obrazów. Ponowienie identycznej treści niczego nie zmienia. Nie modyfikuje pozostałych miejsc. Storage i Firestore nie są wspólną transakcją; nieudany import może pozostawić niepodłączone pliki. Skrypt nie weryfikuje praw ani treści historycznej i nie dekoduje obrazów w celu sprawdzenia wymiarów — robi to skill przed akceptacją.

Skill `rybnik-create-place` używa bieżącego agenta bez wymogu konkretnego modelu ani delegacji; dodatkowe znalezione źródła i końcowy pakiet wymagają akceptacji właściciela. Import do dev nie wymaga builda ani deploymentu. Właściciel sam sprawdza efekt w aplikacji. Szczegóły i ograniczenia: [procedura importu](.agents/skills/rybnik-create-place/references/import.md).

## Mapa

Aplikacja używa MapLibre GL JS 6.16.0: źródeł i warstw wektorowych, rastrowych oraz GeoJSON, znaczników HTML, kamery, kontrolek i zdarzeń mapy. Grupowanie wykorzystuje klastrowanie GeoJSON MapLibre; własna obsługa znaczników i animacji grup znajduje się w `src/app/atlas-map/group-markers.ts`, a rozstrzyganie nakładających się grup w `src/app/atlas-map/cluster-visibility.ts`.

Domyślna kamera i przycisk powrotu mapy używają wspólnego punktu na Rynku. Kontrolka atrybucji MapLibre zachowuje dane źródeł i domyślny responsywny tryb: na wąskiej mapie po przesunięciu zwija się do przycisku informacji. Działania edycji lokalizacji są wyświetlane w sekcji lokalizacji karty.
