# Renderowanie — SSR + Cloud Run a prerender + Functions

Data: 4 listopada 2026. Status: **wybrano SSG + Firebase Hosting + Functions dla MVP.1; SSR pozostaje wariantem przyszłego rozwoju**.

## Wniosek dla MVP.1

Rekomendacja po ponownej analizie: **Angular prerender (SSG) + Firebase Hosting + Cloud Functions 2nd gen jako API**.

Wcześniejsza propozycja SSR miała zapewnić aktualny HTML po zmianach danych. Dla ustalonego MVP przeglądanie historycznych opisów i źródeł można jednak oddzielić od bieżących współrzędnych. Zmiana pozycji przez zalogowanego użytkownika nie wymaga generowania całej strony na serwerze przy każdym wejściu.

Katalog MVP.0 liczy około 200 miejsc. W MVP.1 publiczni użytkownicy zmieniają lokalizacje, a nie tworzą nowych kart i opisów. To przemawia za wygenerowaniem publicznych kart podczas publikacji katalogu i pobieraniem aktualnych pozycji do mapy w przeglądarce.

## Dwie osobne decyzje

1. **Kiedy powstaje HTML?** Podczas builda (prerender) albo na żądanie (SSR).
2. **Gdzie działa backend?** W Firebase Functions albo w samodzielnie wdrażanej usłudze Cloud Run.

Functions mogą obsługiwać wyłącznie API przy statycznym frontendzie albo również renderowanie SSR przez endpoint HTTP. Functions 2nd gen są wdrażane na infrastrukturze Cloud Run, obsługują współbieżność i skalowanie. Nie porównujemy ich z ograniczeniami Functions 1st gen.

## Porównanie

| Obszar | Angular prerender + Hosting + Functions API | Angular SSR + Hosting + Cloud Run + Functions API |
| --- | --- | --- |
| HTML karty | Generowany podczas builda dla znanych adresów | Generowany na żądanie albo podawany z cache |
| SEO | Pełny HTML opisu, referencji i metadanych dostępny od razu | Pełny HTML opisu, referencji i metadanych dostępny od razu |
| Wydajność odczytu | Statyczny dokument z CDN; bez startu procesu renderującego | Cache hit może być szybki; przy cache miss dochodzi renderowanie i możliwy zimny start |
| Zmiana opisu i źródeł | Nowy build/deploy dla aktualnego HTML i metadanych | Nowe dane przy kolejnym renderowaniu; cache może opóźnić ich widoczność |
| Zmiana współrzędnych | Od razu widoczna na mapie dzięki aktualnemu odczytowi API; HTML może zachować starszy stan do publikacji | Mapa również potrzebuje aktualizacji po stronie klienta; HTML zależy od renderowania i cache |
| Nowa karta i adres | Publiczna ścieżka dostępna po buildzie/deployu | Może być dostępna po opublikowaniu danych bez nowego builda frontendu |
| Koszt | Hosting, transfer, buildy, odczyty danych i Functions API | Te same obszary plus renderowanie SSR i odczyty danych potrzebne do renderu |
| Utrzymanie | Proces budowania i publikacji statycznego katalogu oraz backend API | Dodatkowo usługa SSR, zgodność wersji frontendu i serwera oraz polityka cache |
| Awaria backendu odczytu | Statyczna treść karty nadal dostępna; mapa i edycja mogą działać w ograniczonym zakresie | Cache może podać istniejącą stronę; cache miss zależy od dostępności SSR i źródła danych |
| App Check i Auth | Zabezpieczają interaktywne API; statyczne publiczne HTML są dostępne dla robotów | Analogicznie; publiczne SSR nie wymaga tokenu przeglądarki |

SSG nie oznacza zerowych kosztów: ruch, pliki, odczyty API i buildy nadal kosztują według wykorzystania. SSR nie oznacza konieczności stale uruchomionej instancji: możliwe jest skalowanie do zera i cache. Dokładne kwoty zależą od ruchu, konfiguracji i częstości publikacji; na tym etapie nie podajemy sztucznego miesięcznego kosztu.

## Proponowany przepływ SSG

1. Redakcyjna publikacja katalogu wyznacza spójny zestaw danych do budowania.
2. Build generuje `/` oraz `/miejsca/:slug` dla wszystkich opublikowanych kart, z opisem, źródłami, metadanymi i sitemapą.
3. Firebase Hosting serwuje HTML, JavaScript, CSS i fonty.
4. Po uruchomieniu w przeglądarce mapa pobiera bieżące współrzędne, także poprawki wykonane po ostatnim buildzie. Nie może polegać wyłącznie na pozycji zapisanej w statycznym indeksie z builda.
5. Zalogowany użytkownik zapisuje korektę przez Functions API, z Auth i App Check. Backend aktualizuje bieżącą pozycję, sprawdzając wersję rekordu; nie zapisuje historii. Poprawka jest publiczna bez czekania na nowy deploy; mechanizm odświeżenia pozostałych sesji ustalimy osobno.
6. Zmiana opisu, referencji, sluga lub dodanie karty wymaga nowej publikacji statycznego HTML. Możemy uruchamiać ją po zmianach redakcyjnych, z łączeniem wielu zmian w jeden build. Nie uruchamiamy builda po każdej korekcie współrzędnych; historii zmian nie prowadzimy.

Dane historyczne potrzebne robotom nie mogą istnieć tylko w odpowiedzi API po uruchomieniu JS. Metadane, Open Graph i ewentualne dane strukturalne z pozycji historycznej pozostają zgodne z wersją publikacji do czasu jej odświeżenia.

## Routing i nowe strony

Dla SSG wszystkie opublikowane slugi muszą trafić do builda. Nowa karta jest publikowana razem ze swoją stroną; zapis pozycji istniejącej karty nie tworzy nowej ścieżki.

Trzeba jawnie skonfigurować fallback tras prerenderowanych: Angular domyślnie przewiduje fallback serwerowy, który nie jest dostępny przy samym statycznym Hostingu. Nie dodajemy globalnego przekierowania nieznanych URL-i do `index.html` ze statusem 200. Nieistniejący adres ma prawdziwe 404, a zmieniony slug — trwałe przekierowanie. Testy obejmą bezpośrednie wejścia, odświeżanie i Wstecz/Dalej.

Przyszłe strony „O mnie” i „Współpraca” również dobrze pasują do prerenderu; nie wymagają SSR tylko dlatego, że są osobnymi trasami.

## Kiedy wybrać SSR

SSR staje się uzasadniony, gdy nowe publiczne strony i ich metadane muszą być dostępne natychmiast bez procesu publikacji, treści zmieniają się bardzo często albo skala przebudowy katalogu przestaje być praktyczna. Sam wzrost liczby znaczników lub częste zmiany ich pozycji nie przesądzają o SSR.

Jeżeli SSR będzie potrzebny, można go wdrożyć również jako HTTP Function 2nd gen. Wybór własnej usługi Cloud Run uzasadniałaby potrzeba większej kontroli nad kontenerem, runtime i sposobem wdrażania. Brak aktywnego wsparcia Angulara 22 w tabeli App Hosting sam w sobie nie daje przewagi Cloud Run nad ręcznie przygotowaną funkcją HTTP.

Nie opieramy nowego projektu na wycofanym dla nowych uczestników eksperymencie framework-aware Firebase Hosting. Zwykły build Angulara SSG i wdrożenie statycznych plików na Firebase Hosting to osobna ścieżka.

## Źródła

- [Angular — prerender, parametry tras i fallback](https://angular.dev/guide/ssr#customizing-build-time-prerendering-ssg).
- [Firebase Hosting — Functions i Cloud Run](https://firebase.google.com/docs/hosting/serverless-overview).
- [Hosting — przekierowanie żądań do Functions](https://firebase.google.com/docs/hosting/functions).
- [Functions 2nd gen — infrastruktura i współbieżność](https://firebase.google.com/docs/functions/version-comparison).
- [Firebase Hosting — cache](https://firebase.google.com/docs/hosting/manage-cache).
- [Firebase Hosting — kolejność routingu, pliki i 404](https://firebase.google.com/docs/hosting/full-config).
- [Status eksperymentu framework-aware Hosting dla Angulara](https://firebase.google.com/docs/hosting/frameworks/angular).


## Przyszłe materiały od użytkowników i moderacja

Komentarze, źródła i zdjęcia mają przechodzić przez redaktora. Architektura wymaga odseparowania zgłoszeń i prywatnych plików oczekujących od zatwierdzonej treści publicznej. Status publikacji egzekwuje backend i dostęp do plików, a nie wyłącznie ukrywanie elementów interfejsu. Nie projektujemy jeszcze szczegółowego schematu bazy ani panelu redakcyjnego.

Moderacja dostarcza kontrolowanego momentu publikacji, więc nadal pasuje do SSG. Wpływ zatwierdzenia zależy od sposobu wyświetlania materiału:

| Materiał | Widoczność po zatwierdzeniu | Potrzeba builda/deployu |
| --- | --- | --- |
| Komentarz ładowany z API | Może pojawić się publicznie po odświeżeniu danych | Nie; jeśli ma też wejść do statycznego HTML, dopiero jego odświeżenie wymaga publikacji |
| Źródło lub zdjęcie ładowane z API | Może pojawić się po odświeżeniu danych | Nie dla widoku dynamicznego; tak dla aktualizacji prerenderowanego HTML |
| Opis, źródła, metadane i materiały osadzone w HTML karty | Po nowym buildzie i publikacji statycznych plików | Tak, może to być automatyczny proces |

Przy SSG zatwierdzanie treści nie aktualizuje samoistnie wygenerowanych plików HTML. Możemy uruchamiać pipeline po decyzji redaktora, łączyć wiele decyzji w jeden build i osobno pokazywać status publikacji. Akceptacja redaktora nie powinna zgłaszać zakończonej publikacji HTML, jeśli build dopiero czeka albo zakończył się błędem.

Do uzgodnienia: które materiały muszą być indeksowalne bez JS, czy akceptujemy opóźnienie publikacji HTML do zakończenia builda oraz jak często redaktor będzie zatwierdzać zmiany. Jeśli wszystkie zatwierdzone treści mają od razu trafiać do HTML i metadanych, SSR staje się mocniejszym kandydatem; nadal trzeba uwzględnić cache. Dla MVP.1 wybrano SSG; ewentualny powrót do SSR będzie osobną decyzją.
