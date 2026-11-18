# Pakiet pojedynczego miejsca

Uruchamiaj z root repo. Rzeczywiste pakiety i obrazy przechowuj wyłącznie poza Git, np. `.local/place-drafts/ID/`. W tym samym folderze zachowaj `review.md`: adresy źródeł, locatory, uzasadnienia datowania i lokalizacji, ocenę domeny publicznej każdego materiału z dowodem i datą kontroli oraz uzyskaną akceptację i ewentualne oświadczenie o prawach. Powiąż informacje przez ID miejsca, wzmianek i materiałów oraz sumę zatwierdzonego pakietu. To dokumentacja konkretnego importu, bez centralnego rejestru i synchronizacji. Pozostałe notatki agenta należą do `agent-context/`. Nie kopiuj fikcyjnego fixture jako rzeczywistego miejsca.

Nowy pakiet `bundle.json` ma dokładnie cztery pola:

```json
{
  "schemaVersion": 1,
  "expectedUpdatedAt": null,
  "assetsDirectory": "./images",
  "place": {}
}
```

`place` zastąp kompletnym rekordem `placeSchema`, nie częściową poprawką. Wszystkie pola kontraktu są wymagane. Dla nowego miejsca nadaj trwałe ID oraz `published: true`, `createdAt` i `updatedAt` w ISO UTC (czasy zapisu nada skrypt).

W polach źródła trzymaj osobno nazwę (`source`), link (`sourceUrl`) i krótkie wskazanie miejsca w źródle (`sourceNote`, np. strona PDF; dla strony WWW zwykle `null`). Szczegółowe dowody i komentarze redakcyjne zachowaj w `review.md`, poza rekordem aplikacji. Materiały mają nazwę i link źródła, bez pola `sourceNote`. Skan publikuj jako pełną stronę z mechanicznie wrysowaną ramką; miniaturę utwórz z tego samego gotowego obrazu. Nie dopisuj pól zaznaczenia do kontraktu. `sourceUrl` wskazuje oryginalny PDF z `#page=N` albo kartę obiektu, a `review.md` wiąże ID materiału z czystym oryginałem, numerem strony, współrzędnymi ramki i sumami. Publiczne `width`/`height` oraz SHA-256 dotyczą gotowej pełnej strony z ramką.

Dla aktualizacji odczytaj bieżący rekord, także nieopublikowany:

```sh
GCLOUD_PROJECT=historyczny-rybnik node scripts/places/import-place.mjs --read=PLACE_ID --output=.local/place-drafts/PLACE_ID/bundle.json --firebase-cli
```

Polecenie odmawia nadpisania pliku wyjściowego. `expectedUpdatedAt` to dokładny czas pobranego rekordu, bez ręcznego zaokrąglania. Zachowaj `createdAt`, ID i slug. Obrazy umieść pod ich nazwami plików (bez prefixu Storage) w `assetsDirectory`, rozwiązywanym względem pakietu. Nowy materiał używa `public/materials/MATERIAL_ID/UNIQUE_NAME.jpg|png|webp`, także miniatura. Przy aktualizacji niezmienione materiały nie wymagają lokalnych plików; dla zmienionego materiału wymagane są oba warianty.

Podgląd lokalny, bez chmury:

```sh
npm run places:import-one -- .local/place-drafts/PLACE_ID/bundle.json
```

Waliduje kontrakt i drukuje rekord oraz SHA-256 **bajtów całego pakietu**. Dla tworzenia sprawdza też lokalne pliki (sumy, limit i sygnaturę formatu). Dla aktualizacji kontrola plików odbywa się po porównaniu z bazą na etapie apply. Wymiary i treść obrazów sprawdza agent przed podglądem; sygnatura formatu nie jest pełnym dekoderem. To nie jest potwierdzenie praw ani historii.

Po pokazaniu danych i uzyskaniu potwierdzenia właściciela:

```sh
GCLOUD_PROJECT=historyczny-rybnik npm run places:import-one -- .local/place-drafts/PLACE_ID/bundle.json --firebase-cli --apply --approved-sha256=SUMA_Z_ZATWIERDZONEGO_PODGLADU
```

Flaga sumy wiąże zapis z plikiem; sama nie udowadnia zgody człowieka — odpowiada za nią agent. Używane są istniejące uprawnienia operatora (ADC lub Firebase CLI, impersonacja `places-dev-import` dla bazy); nie twórz kluczy. Skrypt jest ograniczony do dev. Aktualizacja publikuje cały zaakceptowany rekord; zachowuje czas utworzenia, nadaje nowy czas zapisu. Zmiana lokalizacji w aplikacji po odczycie powoduje konflikt; nie jest po cichu nadpisywana. Identyczny ponowny import to brak zmian.

Importer sprawdza ID, kolizje slugów w całej kolekcji (także drafty) i aktualność rekordu, zapisuje kopię poprzedniego rekordu w `.local/place-import-backups/`, wysyła nowe warianty przez istniejący uploader, a następnie transakcyjnie sprawdza ponownie i zapisuje jeden dokument. Nie usuwa innych miejsc ani plików. Slug istniejącego miejsca jest stały; jego migracja wymaga osobnego zadania. Operacje Storage i Firestore nie tworzą wspólnej transakcji: po błędzie mogą zostać niepodłączone pliki publiczne. Dlatego upload także wymaga wcześniejszej akceptacji. Ponowienie używa tych samych niezmiennych nazw i sum; nie usuwaj automatycznie pozostałości. Błąd nie oznacza ukończonego importu.

Po sukcesie podaj link `https://historyczny-rybnik-dev.web.app/miejsca/SLUG`. Nie otwieraj aplikacji w celu odbioru, nie uruchamiaj deploymentu ani `check-live`.
