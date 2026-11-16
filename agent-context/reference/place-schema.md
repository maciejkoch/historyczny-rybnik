# Aktualny schemat miejsca

Źródłem kontraktu są schematy Zod w `functions/src/contracts/places.mjs`. Wszystkie pola są wymagane; brak danych oznaczamy `null`, a brak elementów pustą tablicą. Rekord katalogowy jest projekcją Firestore, publiczny rekord nie zawiera `published` ani `createdAt`.

## Miejsce

`id`, `name`, `slug`, `description` (krótki opis), `tags` (pierwszy określa ikonę), `documentedPeriod`, `existsToday`, `historicalAddress`, `location`, `mentions`, `materials`, `published`, `createdAt`, `updatedAt`.

`documentedPeriod` wpisujemy ręcznie: `{from, to}` lub `null`; `to: null` oznacza nieznany koniec. `existsToday: null` oznacza brak wiedzy. Daty historyczne mają postać `YYYY`, `YYYY-MM` albo `YYYY-MM-DD`.

Lokalizacja to `{coordinates, precision, explanation}`. Współrzędne `{lat, lng}` mają precyzję `exact` lub `approximate`; nieznana lokalizacja ma współrzędne i precyzję `null`. Opcjonalne wyjaśnienie to tekst lub `null`. Zapis ma semantykę ostatniego zapisu bez wersji.

## Wzmianki i materiały

Wzmianka ma `id`, `title`, `description` (streszczenie źródła), `publicationDate`, `documentedDate`, `source`, `sourceUrl`, `sourceNote` i `materialIds`. Nieznane dane źródła i daty są `null`. `documentedDate` to `{from, to}` lub `null`; jej `to: null` oznacza pojedynczą datę. Każde ID wskazuje materiał miejsca.

`source` jest nazwą źródła (np. blog i tytuł artykułu), `sourceUrl` bezpośrednim linkiem do niego, a `sourceNote` opcjonalnym, krótkim doprecyzowaniem, gdzie znaleźć wzmiankę (np. strona PDF). Dla strony WWW `sourceNote` może być `null`. Uzasadnienia datowania, niepewności i dodatkowe źródła pozostają w lokalnym raporcie, nie w tym polu. W materiałach `source` i `sourceUrl` mają takie samo znaczenie; kontrakt materiału nie zawiera `sourceNote`.

Materiał ma `materialId`, `date`, `storagePath`, `thumbnailPath`, `width`, `height`, `alt`, `source`, `sourceUrl`, `sha256`, `thumbnailSha256` i `isPrimary`. Wymiary to dodatnie piksele pełnego obrazu; najwyżej jeden materiał jest główny. Wszystkie materiały miejsca tworzą galerię; wzmianki pokazują materiały przez ID. Osoba dodająca materiał odpowiada za prawo do jego udostępnienia.

## Pakiet pojedynczego miejsca

Nowy skill [rybnik-create-place](../../.agents/skills/rybnik-create-place/SKILL.md) przygotowuje bezpośrednio pełny rekord aktualnego kontraktu. `places:import-one` opakowuje go w pakiet z wersją, czasem oczekiwanego rekordu i katalogiem obrazów; [format i import](../../.agents/skills/rybnik-create-place/references/import.md). Ocena praw i dowody datowania pozostają w `review.md` przy lokalnym pakiecie, bez dodatkowych pól w rekordzie aplikacji. Skill nie zależy od starego warsztatu ani jego rejestrów i synchronizacji.

## Prywatny warsztat

Warsztat zachowuje własne dane i dotychczasowy skill. Nie jest częścią aktualnego przepływu aplikacji; jego integracja z nowym schematem wymaga osobnego zadania.
