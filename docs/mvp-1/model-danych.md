# MVP.1 — model danych

Aktualizacja: 5 listopada 2026. Status: **uproszczona propozycja zgodna z ustaleniem: jedna kolekcja `places`, bez historii zmian**. Dokument opisuje model; nie tworzy usług ani danych.

## 1. Jedna kolekcja miejsc

```text
places/{placeId}
  nazwa, slug, opis, kategoria
  aliasy i adresy
  aktualna lokalizacja
  references[] — źródła i konkretne wzmianki
  daty techniczne i wersja lokalizacji
```

**Jeden dokument zawiera wszystko, co potrzebne do wyświetlenia karty miejsca.** Kolekcja nazywa się `places`, ponieważ obejmuje firmy, zakłady, kościoły, szkoły, urzędy i inne obiekty, także bez ustalonych współrzędnych. W kodzie używamy nazwy `Place`, w interfejsie „miejsce”.

Referencje są tablicą w dokumencie miejsca. Przechowujemy wyłącznie bieżącą lokalizację. W MVP.1 nie tworzymy podkolekcji historii, dziennika autora zmian ani mechanizmu cofania zapisów.

Pliki znajdują się w Cloud Storage. Nie tworzymy osobnych kolekcji instytucji, źródeł, plików, slugów ani wydań SSG w MVP.1. Dane źródła mogą się powtarzać w referencjach różnych miejsc — na tę skalę akceptujemy to uproszczenie.

## 2. Przykładowy dokument

Przykład jest fikcyjny. `placeId` to trwały identyfikator dokumentu, niezależny od nazwy i sluga. Pokazane daty techniczne ISO odpowiadają Firestore `Timestamp`. W bazie współrzędne zapisujemy jako `GeoPoint`, a w JSON API jako `{lat, lng}`.

```json
{
  "name": "Przykładowa szkoła",
  "slug": "przykladowa-szkola",
  "previousSlugs": [],
  "description": "Opis miejsca opracowany na podstawie źródeł.",
  "category": "education",
  "aliases": ["Dawna nazwa szkoły"],
  "addresses": [
    {"type": "historical", "text": "Dawna ulica A 12"},
    {"type": "current", "text": "Ulica B 12"}
  ],
  "district": null,
  "location": {
    "coordinates": null,
    "precision": "unknown",
    "explanation": null
  },
  "references": [
    {
      "id": "ref_01",
      "title": "Przykładowy spis instytucji",
      "url": "https://example.org/skan/17",
      "page": "17",
      "publicationDate": {
        "from": "1932",
        "to": null,
        "approximate": false
      },
      "historicalDate": null,
      "accessedAt": "2026-11-04T12:00:00Z",
      "excerpt": "Opracowane streszczenie konkretnej wzmianki.",
      "excerptType": "summary",
      "note": null,
      "images": [
        {
          "storagePath": "places/place_example/ref_01/wycinek-v1.webp",
          "thumbnailPath": "places/place_example/ref_01/miniatura-v1.webp",
          "alt": "Wycinek spisu z wpisem dotyczącym szkoły",
          "credit": "Nazwa archiwum lub autora",
          "rights": "Informacja o licencji lub innej podstawie publikacji"
        }
      ]
    }
  ],
  "published": true,
  "locationVersion": 0,
  "createdAt": "2026-11-04T12:00:00Z",
  "updatedAt": "2026-11-04T12:00:00Z"
}
```

## 3. Pola miejsca

| Pole | Znaczenie |
| --- | --- |
| `name` | Nazwa miejsca |
| `slug` | Aktualny adres `/miejsca/:slug`; unikatowy w katalogu |
| `previousSlugs` | Dawne adresy do trwałych przekierowań; domyślnie pusta tablica |
| `description` | Opis tekstowy; ewentualny Markdown renderowany bez niebezpiecznego HTML |
| `category` | Rodzaj miejsca: `industry`, `commerce`, `religion`, `education`, `public`, `culture`, `other` |
| `aliases` | Inne nazwy wykorzystywane w wyszukiwaniu |
| `addresses` | Znane adresy historyczne i współczesne; pusta tablica, jeśli nieustalone |
| `district` | Dzielnica, jeśli znana; inaczej `null` |
| `location` | Bieżące współrzędne, dokładność i wyjaśnienie |
| `references` | Lista znalezionych wzmianek ze źródłami, datami i wycinkami |
| `published` | Czy rekord należy do publicznego katalogu; drafty są wykluczone z API i builda |
| `locationVersion` | Licznik zmian pozycji, do wykrywania konfliktów zapisu |
| `createdAt`, `updatedAt` | Daty techniczne nadawane przez backend/importer |

Kilka różnych miejsc może mieć ten sam adres i współrzędne. Gdy rozróżniamy historyczne siedziby pod różnymi adresami, można utworzyć osobne dokumenty i wyjaśnić powiązanie w opisie. Nie dodajemy do tego osobnej kolekcji instytucji.

## 4. Lokalizacja

- `coordinates: null`, `precision: unknown` — miejsce wyszukiwalne, bez znacznika.
- `precision: approximate` — punkt przybliżony, np. środek ulicy lub obszaru; `explanation` wyjaśnia przybliżenie.
- `precision: building` — wskazany konkretny budynek. Sam zapis użytkownika nie oznacza potwierdzenia redakcyjnego.

Każdy zalogowany może ustawić lub poprawić pozycję istniejącego publicznego miejsca. Zmiana jest od razu publiczna. Nowe wskazanie domyślnie jest przybliżone. Backend sprawdza poprawność współrzędnych i danych, a użytkownik zatwierdza podgląd przed zapisem.

Szczegół uprawnień do całkowitego usunięcia pozycji pozostaje do ustalenia; nie wprowadzamy ograniczenia do administratora jako zatwierdzonej decyzji.

## 5. Referencje i daty

Każdy element `references[]` opisuje **konkretną wzmiankę**, a nie tylko ogólny link. Ma własne stabilne `id`, tytuł źródła, URL lub wskazanie fragmentu, dostępne daty, tekst i opcjonalne obrazy. Kolejność tablicy jest kolejnością wyświetlania.

`excerptType`: `quote` (cytat), `transcription` (odczyt ze skanu), `summary` (nasze streszczenie). Pole `note` pozwala zapisać niepewny odczyt, rozbieżny adres lub wątpliwości identyfikacji. Nieustalona strona, data albo brak obrazu są poprawnymi stanami.

Rozdzielamy:

- `publicationDate` — datę wydania źródła;
- `historicalDate` — datę lub okres, którego dotyczy wzmianka;
- `accessedAt` — techniczny czas pozyskania materiału.

Typ daty historycznej: `{from, to, approximate}` lub `null`. `from` i `to` to zapis `YYYY`, `YYYY-MM` albo `YYYY-MM-DD`, zgodnie z dokładnością źródła. `to: null` oznacza pojedynczą datę, nie otwarty okres działalności. Zakres np. 1932–1935 zapisujemy jako `from: "1932", to: "1935"`. Backend waliduje kalendarz i kolejność granic.

Brak daty oznacza `null`; samego roku nie zamieniamy na 1 stycznia. Daty wydania nie kopiujemy automatycznie jako daty historycznej. Pierwsza i ostatnia wzmianka nie dowodzą nieprzerwanej działalności. Dane pozwolą później zaprojektować filtr czasu, którego nie budujemy w MVP.1. Nietypowe datowanie, np. „przed 1939”, zachowujemy w `note`, bez wymyślania zamkniętego zakresu.

## 6. Pliki w Storage

Wycinki i miniatury przechowujemy np. pod `places/{placeId}/{referenceId}/...`. Ich ścieżki, podpisy, tekst alternatywny i podstawa wykorzystania są zapisane bezpośrednio w referencji.

- Nie zapisujemy obrazów jako base64 w Firestore.
- Referencja może mieć sam opis i link, bez plików.
- Kopię obrazu publikujemy dopiero po ustaleniu podstawy wykorzystania; samo istnienie skanu w internecie nie wystarcza.
- Publiczne wycinki muszą być dostępne w statycznej karcie bez logowania. Prywatne materiały nie trafiają do publicznej ścieżki ani indeksu.
- Nowa wersja obrazu dostaje nową nazwę pliku, aby uniknąć pomyłek z cache.

Nie wprowadzamy osobnego rejestru assetów ani automatycznego przetwarzania materiałów użytkowników w MVP.1.

## 7. Zapis lokalizacji

Callable Function sprawdza Firebase Auth i App Check. Przyjmuje wyłącznie zmianę lokalizacji i `expectedLocationVersion`, a nie dowolną aktualizację dokumentu. Nie daje użytkownikowi uprawnień do zmiany opisów, referencji ani publikacji.

Transakcja porównuje oczekiwaną wersję, aktualizuje `location`, zwiększa `locationVersion` i ustawia `updatedAt` na czas serwera. Konflikt wersji wymaga ponownego sprawdzenia przez użytkownika. Zachowujemy tylko aktualne wartości — bez poprzedniej pozycji i bez autora zapisu w dokumencie.

Nie tworzymy `requestId`, rejestru żądań ani wpisów historii. Jeśli połączenie zostanie przerwane bez potwierdzenia wyniku, aplikacja ponownie odczytuje pozycję i wersję. Może stwierdzić, że bieżąca pozycja odpowiada wybranej przez użytkownika, ale nie przypisuje jej jego żądaniu. Przy różnicy pokazuje aktualny stan i pozwala ponowić zapis po sprawdzeniu. Nie nadpisuje go automatycznie.

`locationVersion` służy wyłącznie do ochrony przed równoczesnym nadpisaniem. Nie pozwala odtworzyć poprzednich pozycji. Publiczne odpowiedzi nie ujawniają danych kont.

## 8. Odczyt, wyszukiwanie i SSG

- Build pobiera publiczne miejsca z Firestore i generuje HTML kart, sitemapę oraz lekki indeks nazw, aliasów i adresów do wyszukiwania w przeglądarce.
- Dane wejściowe jednego builda zapisujemy jako lokalny plik w CI. Nie tworzymy kolekcji wydań ani serwisu publikacji w Firestore.
- Mapa pobiera aktualne pozycje przez Functions API. Poprawka współrzędnych nie wymaga builda ani deploymentu frontendu.
- Zmiana opisu, referencji lub sluga wymaga nowego builda i publikacji HTML. W MVP.1 właściciel przygotowuje treści przez walidowany import/skrypt i publikuje je razem z aplikacją.
- Slugi i ich poprzednie wartości walidujemy na całym małym katalogu przy imporcie i buildzie: bez duplikatów, kolizji i pętli. Przekierowania są konfiguracją Hosting generowaną z tych danych.
- Nowe miejsca publikujemy wraz z ich stronami. API mapy przyjmuje identyfikatory z katalogu dostarczonego z aplikacją i zwraca dane wyłącznie dla rekordów publicznych; stary frontend nie otrzyma znaczników nowych, jeszcze nieznanych mu kart.
- `published: false` odcina rekord od API i kolejnego builda, ale nie usuwa wcześniej opublikowanego HTML ani obrazów. Wycofanie wymaga także publikacji zmienionych plików Hosting i ewentualnego ograniczenia dostępu do plików Storage.

Bezpośredni zapis z przeglądarki do Firestore jest zamknięty. API zwraca tylko pola potrzebne danemu widokowi; do mapy nie pobieramy wszystkich opisów ani skanów. Publiczny HTML pozostaje dostępny bez Auth i App Check.

## 9. Granice MVP.1 i dalsze decyzje

Komentarze, zgłoszenia źródeł i zdjęcia użytkowników zaprojektujemy, gdy wejdą do zakresu prac. Zachowujemy ustaloną zasadę: przyszłe materiały użytkowników wymagają redaktora, a obecne poprawki lokalizacji są natychmiastowe. Teraz nie tworzymy dla tych przyszłych funkcji kolekcji ani paneli.

Edycja Firestore i region pozostają osobną decyzją infrastrukturalną. Model nie wymaga Enterprise ani funkcji zaawansowanego wyszukiwania. Nie utrzymujemy wcześniejszej rekomendacji Enterprise jako zatwierdzonego wyboru. Nie utworzono w tym kroku bazy ani Storage.

Pilnujemy rozmiaru dokumentu: limit Firestore Native wynosi 1 MiB. Przy imporcie sprawdzamy wielkość i odrzucamy zbyt duże rekordy; nie usuwamy danych po cichu. Jeżeli realne referencje zaczną zbliżać się do limitu, dopiero wtedy rozważymy ich wydzielenie do podkolekcji.

Źródła zasad technicznych: [model dokumentowy i limit rozmiaru](https://firebase.google.com/docs/firestore/data-model), [transakcje Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions). Są to odnośniki do uzasadnienia ograniczeń, nie dodatkowe wymagania funkcjonalne.
