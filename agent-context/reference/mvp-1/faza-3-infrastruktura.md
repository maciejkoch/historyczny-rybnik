# Faza 3 — konfiguracja i uruchomienie

Decyzje właściciela, 5 listopada 2026: jeden projekt `historyczny-rybnik`, wspólne Authentication, oddzielna baza `places-dev` (Standard, `europe-central2`), bucket i funkcje dev. Wybór jednego projektu zastępuje wcześniejsze wymaganie osobnego projektu testowego. Konta użytkowników i rozliczenia są wspólne; dane i endpointy oddzielone. Usuwanie pozycji przez API jest wyłączone. Zalogowanie przez Google pozwala ustawiać i poprawiać pozycję.

## Kontrakt

`functions/src/validation.mjs` waliduje katalog, daty częściowe, linki HTTPS, ścieżki publicznych obrazów, kolizje slugów, rozmiar dokumentu i DTO. Dokumenty są w jednej kolekcji `places`. W Firestore pozycja to GeoPoint, czasy to Timestamp; API zwraca JSON i ISO. Opisy są tekstem, Angular je escapuje.

Callable `placesDevRead({ids})` przyjmuje 1–100 unikalnych identyfikatorów znanych frontendowi. Wymaga App Check, zwraca tylko publiczne miejsca: `id`, `location`, `locationVersion`, `updatedAt`. Drafty i brakujące dokumenty są pomijane. Katalog frontendowy ogranicza zakres żądania; identyfikatory nie stanowią mechanizmu autoryzacji publicznych miejsc.

Callable `placesDevUpdate({placeId,expectedLocationVersion,location})` wymaga Google Auth i App Check. Zmienia tylko lokalizację istniejącego publicznego miejsca. Wyjaśnienie jest obowiązkowe; pozycja musi być określona. Transakcja podnosi wersję i ustawia czas serwera. Konflikt: `aborted`; draft/brak: `not-found`; niepoprawne dane: `invalid-argument`. Brak historii, autora i rejestru żądań. Po niepewnym wyniku należy odczytać bieżący stan.

## Dane i build

Jedyny rekord faz 3–5: `place_sw_antoni`, bazylika św. Antoniego Padewskiego. `data/places.test-data.json` zawiera dane testowe do testów i powtarzalnego builda offline oraz opcjonalnego importu na dev. Wdrożenie dev korzysta ze snapshotu Firestore. Opis to własne streszczenie informacji parafii. Adres i orientacyjny punkt 50.098064, 18.549650 pochodzą z karty Śląskiej Organizacji Turystycznej (osadzony `trackPoiList`, obiekt 3273). Dokładność: `approximate`, bez udawania pomiaru budynku. Pierwotny odbiór miał `images: []`. Na późniejsze zlecenie właściciela dodano jedną pocztówkę oznaczoną domeną publiczną, z miniaturą i powiększeniem w Storage. [Źródło, prawa i test Storage](zdjecie-bazyliki-1919.md).

- https://www.bazylika.rybnik.pl/historia.html
- https://www.silesia.travel/culturalheritage/3273

`npm run places:import` sprawdza dane bez zapisu. `npm run places:import -- --apply` wymaga jawnego `GCLOUD_PROJECT` i serwerowego ADC. Import jest ponawialny; zachowuje aktualną pozycję, wersję i czasy istniejącego dokumentu. Odrzuca katalog z innymi dokumentami. Nie usuwa dokumentów ani nie nadpisuje zmian użytkowników.

`npm run places:snapshot` pobiera publiczne dokumenty serwerowo do `.local/places.snapshot.json`. Zmienna `PLACES_SNAPSHOT=.local/places.snapshot.json` wybiera ten jeden plik jako wejście builda. Snapshot i poświadczenia są ignorowane przez Git. Walidator odrzuca dodatkowe pola zamiast umieszczać je w artefaktach.

`npm run build` generuje HTML `/`, karty i 404, indeks wyszukiwania, sitemapę oraz przekierowania ze starych slugów. Domyślne wejście offline nie potwierdza importu ani wdrożenia backendu. Build nie inicjalizuje mapy, Auth ani App Check. Dev pozostaje noindex; canonical i sitemap wskazują dev. W fazie 5 potrzebna osobna konfiguracja origin i indeksowania.

## Testy i dostęp

`npm test`: walidacja danych, kalendarza, kolizji, wielkości, DTO, filtr draftów, lokalny wariant bez lokalizacji i bez skanu.

`npm run test:emulator`: prawdziwe transakcje Firestore, równoczesny zapis, drafty, Auth, kontrola App Check w handlerach, zabronione pola i usuwanie. Testuje też blokadę bezpośrednich operacji Firestore i prywatnych plików Storage. Firebase CLI ładuje reguły i sprawdza ich składnię w emulatorach. Test lokalny nie dowodzi weryfikacji prawdziwych tokenów App Check — konieczny osobny odbiór na wdrożeniu.

Firestore: wszystkie odczyty i zapisy przeglądarki zabronione, w tym podkolekcje. Storage: tylko odczyt `public/places/{placeId}/{referenceId}/{file}` bez logowania; pozostałe operacje zabronione. Backend/importer używają IAM, które omija reguły klienta. Nie ma bezpośredniego SDK Firestore we frontendzie.

Oceniono próby listowania draftów, obcego odczytu/zapisu, nadpisania pól, dodania właściciela/roli, manipulacji czasem/wersją, przepełnienia i dostępu do podkolekcji: każda bezpośrednia operacja klienta jest odcięta regułą `false`. Walidacja biznesowa działa osobno w API. Publiczna ścieżka Storage jest przeznaczona wyłącznie na pliki dopuszczone do publikacji przez importer.

## Deployment

Frontend: wyłącznie `npm run deploy:dev`, konfiguracja `firebase.dev.json`. Produkcji nie wdrażamy.

Backend: `npm run deploy:backend:dev`, osobna konfiguracja `firebase.backend.dev.json`, wyłącznie baza i funkcje dev oraz reguły dedykowanego bucketa. Przed wykonaniem wymagane są billing, utworzenie bazy/bucketa, IAM, rejestracja aplikacji oraz App Check. Sam plik konfiguracji nie tworzy wszystkich tych zasobów.

Limit funkcji `maxInstances: 3`, minimum 0 ogranicza równoległość; alert budżetowy 10 PLN miesięcznie nie jest twardym limitem wydatków. Koszt obejmuje wywołania Functions/Cloud Run, Firestore, Storage, transfer, Cloud Build/Artifact Registry i ewentualne użycie reCAPTCHA Enterprise ponad bezpłatne limity.

## Identyfikatory wdrożenia

- Projekt: `historyczny-rybnik` / `301143182490`.
- Firestore: `places-dev`, `STANDARD`, `FIRESTORE_NATIVE`, `europe-central2`, ochrona usunięcia włączona.
- Storage: `historyczny-rybnik-dev-files`, `EUROPE-CENTRAL2`, Standard, uniform bucket-level access. Target CLI `places-dev` w `.firebaserc`; reguły nie trafiają do innych bucketów.
- Functions 2nd gen / Node 22: `placesDevRead`, `placesDevUpdate`, codebase `places-dev`, `europe-central2`.
- Aplikacja web dev: `1:301143182490:web:54ca2baf6d4eec1cd3e323`.
- App Check: reCAPTCHA Enterprise, domeny `historyczny-rybnik-dev.web.app`, `localhost`, TTL 1h, egzekwowanie w obu callable. Publiczne klucze konfiguracji są w `runtime-config.ts`, tokeny debug nigdy tam nie trafiają.
- Auth: Google, domena `historyczny-rybnik.firebaseapp.com`, autoryzowane przekierowania dev i localhost. Auth jest współdzielone z przyszłą produkcją na wyraźną decyzję właściciela.
- Osobne konta i role: [manifest IAM](../../../infra/iam.dev.json). Wszystkie wiązania ról danych mają warunek nazwy bazy `places-dev`. API nie może tworzyć/usuwać dokumentów ani listować kolekcji; konto builda nie może zapisywać. Importer ma tworzenie i aktualizację, bez usuwania. `datastore.databases.get` jest uprawnieniem transakcji, nie administrowania bazą.
- Operator może impersonować konta `places-dev-import` i `places-dev-build` bez plików kluczy. Lokalnie: `GCLOUD_PROJECT=historyczny-rybnik npm run places:import -- --apply --firebase-cli`. Build snapshotu: `GCLOUD_PROJECT=historyczny-rybnik npm run places:snapshot -- --firebase-cli`. Publikacja: `PLACES_USE_FIREBASE_CLI=1 npm run deploy:dev`. CI używa ADC/WIF dla `places-dev-build`; bieżący workflow PR buduje offline bez dostępu do chmury.
- Budżet: 10 PLN/miesiąc wyłącznie dla projektu `301143182490`, alerty 50%, 90%, 100% do domyślnych odbiorców IAM konta billingowego. Artifact Registry `gcf-artifacts` w Warszawie usuwa obrazy starsze niż 1 dzień.

`node scripts/places/check-live.mjs` sprawdza odmowę bez App Check, błędny App Check, brak Auth, zapis przy prawidłowych tokenach, konflikt i ponowny odczyt. `APP_CHECK_TOKEN` i `FIREBASE_ID_TOKEN` podaje operator z lokalnej sesji. Skrypt ponownie zapisuje zatwierdzoną pozycję; zwiększa wersję, ale nie przesuwa kościoła. Nie tworzy publicznego endpointu testowego.

Polecenie `deploy:prod` odmawia publikacji builda dev. W fazie 5 należy najpierw dodać konfigurację produkcyjnych usług, origin i indeksowania, a następnie przywrócić docelową publikację. Ten bezpiecznik zapobiega skopiowaniu ustawień dev na domenę produkcyjną.
