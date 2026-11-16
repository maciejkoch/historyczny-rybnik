# Aktualny schemat miejsca

Źródłem kontraktu są schematy Zod w `functions/src/contracts/places.mjs`. Wszystkie pola są wymagane; brak danych oznaczamy `null`, a brak elementów pustą tablicą. Rekord katalogowy jest projekcją Firestore, publiczny rekord nie zawiera `published` ani `createdAt`.

## Miejsce

`id`, `name`, `slug`, `description` (krótki opis), `tags` (pierwszy określa ikonę), `documentedPeriod`, `existsToday`, `historicalAddress`, `location`, `mentions`, `materials`, `published`, `createdAt`, `updatedAt`.

`documentedPeriod` wpisujemy ręcznie: `{from, to}` lub `null`; `to: null` oznacza nieznany koniec. `existsToday: null` oznacza brak wiedzy. Daty historyczne mają postać `YYYY`, `YYYY-MM` albo `YYYY-MM-DD`.

Lokalizacja to `{coordinates, precision, explanation}`. Współrzędne `{lat, lng}` mają precyzję `exact` lub `approximate`; nieznana lokalizacja ma współrzędne i precyzję `null`. Opcjonalne wyjaśnienie to tekst lub `null`. Zapis ma semantykę ostatniego zapisu bez wersji.

## Wzmianki i materiały

Wzmianka ma `id`, `title`, `description` (streszczenie źródła), `publicationDate`, `documentedDate`, `source`, `sourceUrl`, `sourceNote` i `materialIds`. Nieznane dane źródła i daty są `null`. `documentedDate` to `{from, to}` lub `null`; jej `to: null` oznacza pojedynczą datę. Każde ID wskazuje materiał miejsca.

Materiał ma `materialId`, `date`, `storagePath`, `thumbnailPath`, `width`, `height`, `alt`, `source`, `sourceUrl`, `sha256`, `thumbnailSha256` i `isPrimary`. Wymiary to dodatnie piksele pełnego obrazu; najwyżej jeden materiał jest główny. Wszystkie materiały miejsca tworzą galerię; wzmianki pokazują materiały przez ID. Osoba dodająca materiał odpowiada za prawo do jego udostępnienia.

## Prywatny warsztat

Warsztat zachowuje własne dane i dotychczasowy skill. Nie jest częścią aktualnego przepływu aplikacji; jego integracja z nowym schematem wymaga osobnego zadania.
