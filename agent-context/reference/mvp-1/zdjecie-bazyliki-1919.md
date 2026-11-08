# Archiwalna pocztówka bazyliki — test Storage

Dodano 5 listopada 2026 do karty jedynego kościoła na dev. Nie dodano kolejnego miejsca ani nie zmieniono bieżącej lokalizacji.

Materiał: „Rybnik: Antoniuskirche”, kolorowana pocztówka ze zbiorów Biblioteki Narodowej. Datowanie 1919 pochodzi z korespondencji, zgodnie z opisem katalogowym; dokładna data wykonania fotografii oraz autor są nieznane. Nie opisujemy jej jako fotografii wykonanej dokładnie w 1919 r.

- [Karta i oznaczenie praw w Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rybnik_-_Antoniuskirche._1919_(70651365).jpg).
- [Pierwotne źródło Polona / Biblioteka Narodowa](https://polona.pl/item/rybnik-antoniuskirche,NzA0MjAxODc/).
- Commons podaje `Public domain`, `Copyrighted: False`, szablon `PD-old-70` i [Public Domain Mark 1.0](https://creativecommons.org/publicdomain/mark/1.0/). Sprawdzone metadane i hash oryginału: `references[id=polona_1919].images[0].provenance` w dokumencie `places/place_sw_antoni` (wejście importu: `data/places.fixture.json`).

Zachowano cały obraz pocztówki. Jedynymi operacjami są zmniejszenie dłuższego boku do 1800 px / 640 px i kompresja JPEG, bez retuszu, kadrowania ani zmiany kolorów. Oryginał ma 2013 × 3227 px. Kopie są w dev Storage; plików JPG nie przechowujemy w repozytorium ani na Hostingu.

Pliki w buckecie `historyczny-rybnik-dev-files`:

- `public/places/place_sw_antoni/polona_1919/antoni-1919-v1.jpg` — powiększenie, ok. 1,1 MB.
- `public/places/place_sw_antoni/polona_1919/antoni-1919-thumb-v1.jpg` — miniatura, ok. 100 kB.

`npm run places:upload-assets -- --directory=/lokalny/katalog` sprawdza lokalne pliki i SHA-256 względem metadanych obrazów w katalogu miejsc, bez zapisu. Katalog musi zawierać pliki o nazwach zgodnych z końcówkami ścieżek Storage. Domyślnym wejściem są dane testowe `data/places.fixture.json`; `PLACES_SNAPSHOT=.local/places.snapshot.json` pozwala użyć aktualnego snapshotu Firestore. Operator publikuje przez `npm run places:upload-assets -- --directory=/lokalny/katalog --apply --firebase-cli` albo ADC z uprawnieniem do tego bucketa. Skrypt używa istniejących uprawnień operatora; nie nadaje kontu API/builda dostępu do Storage. Nie zmienia IAM ani reguł klienta. Nowy plik jest tworzony z `ifGenerationMatch=0`; ponowienie akceptuje wyłącznie ten sam hash. Nie generujemy tokenów download ani signed URL — obrazy są dostępne anonimowo przez regułę publicznej ścieżki.

Ścieżki Storage, sumy SHA-256 obu wariantów oraz pełne metadane źródła i praw są zapisane przy obrazie w `references[].images[]` dokumentu miejsca. Osobny manifest i plik metadanych źródła usunięto po przeniesieniu danych do tego modelu. Po uploadzie uruchamiamy importer miejsca, zachowujący lokalizację i wersję, a następnie `PLACES_USE_FIREBASE_CLI=1 npm run deploy:dev`.

Karta pobiera miniaturę z Firebase Storage, a po kliknięciu ładuje większy obraz w modalnym oknie. Podpis wskazuje autora nieznanego, Bibliotekę Narodową/Polonę i domenę publiczną; odnośnik prowadzi do karty źródła z informacją o prawach.

Wynik testu: miniatura i powiększenie odczytane anonimowo przez Firebase Storage — HTTP 200, `image/jpeg`, zgodne SHA-256; próba prywatnej ścieżki — HTTP 403. W przeglądarce oba obrazy załadowane: 399 × 640 i 1123 × 1800 px. Kliknięcie otwiera modal, Escape go zamyka i oddaje fokus miniaturze. Karta nadal pokazuje `locationVersion: 1` i pierwotne współrzędne. Walidacja danych i build SSG przeszły; zdjęcie, podpis i link do źródła są dostępne także w statycznym HTML.
