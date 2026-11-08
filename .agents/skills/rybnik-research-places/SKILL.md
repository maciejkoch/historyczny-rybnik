---
name: rybnik-research-places
description: Badaj historię miejsc Rybnika, kontynuuj wcześniejsze poszukiwania i zapisuj datowane wzmianki oraz materiały z właściwej epoki. Używaj do badań historycznych, nie do implementacji ani automatycznej publikacji.
---

# Badanie miejsc Rybnika

Warsztat `data/places/`, kontrakt `scripts/research/model.mjs`. Przeczytaj README warsztatu, AGENTS, SECURITY i resources/README. Domyślnie Rybnik 1918–1939, elastycznie, plan 1932. Użytkownik podaje temat, nie musi podawać lat. Zachowuj także wcześniejsze/późniejsze dowody.

## Kontynuowanie poszukiwań

Zacznij od podglądu `research pull --firebase-cli`, potem `--apply`; obejrzyj usunięcia przed `--approve-deletions`. Nie nadpisuj konfliktów. Gdy Storage jest niedostępne, nie twórz niezależnej kopii zbioru ani nie deklaruj synchronizacji.

Czytaj istniejące miejsca, wzmianki, dokumenty, materiały, źródła, kandydatów z decyzjami oraz research. Zachowuj trwałe ID. Korzystaj ze znanych źródeł i szukaj dalej w internecie. Podążaj za istotnymi linkami, bibliografią i sygnaturami A → B → C. Nowe przydatne źródło zapisuj z discoveredFrom i dokładną ścieżką odkrycia. Powtórzenie za A nie jest niezależnym potwierdzeniem. Zapisuj także brak wyników, niedostępność i niewykonane tropy, bez nieograniczonej kaskady.

## Miejsce → wzmianki → materiały

- Miejsce to obiekt/punkt działalności, np. kościół, sklep, fryzjer. Opis jest naszym tekstem redakcyjnym, nie dowodem datowania. Tagi są płaskie, minimum jeden; fryzjer: usługi + fryzjer, cmentarz: cmentarz + obiekt sakralny. Powiązania miejsc są proste, nie zakładaj tożsamości po adresie/nazwie.
- `documents` to konkretne dokumenty źródłowe: strona, artykuł, numer gazety, wpis archiwalny, PDF lub strona z fotografią. Zapisuj publikację, autora, dokładny fragment, odczyt i źródło. Zbiór stron/archiwum pozostaje w sources.
- `mentions` to konkretna informacja o jednym miejscu, z evidence: documentId + locator, własnym documentedDate i weryfikacją. `verified` wymaga sprawdzonej treści i tożsamości, daty/roku lub uzasadnionego zakresu oraz verifiedAt. Bez tego `draft`; sprzeczności `conflicting`. Nie podnoś pewności przy migracji ani nie wymyślaj daty, żeby przejść walidację.
- Udokumentowane daty miejsca wynikają wyłącznie ze zweryfikowanych wzmianek. Dowody 1920, 1928, 1945 to trzy punkty; nie tworzą ciągłego zakresu 1920–1945. Zachowuj dokładność: rok, miesiąc, dzień, zakres, przybliżenie. Data publikacji źródła i data opisywanego faktu są odrębne. Artykuł 2008 o roku 1935 daje wzmiankę dotyczącą 1935.
- Współczesne ogłoszenie lub wpis adresowy z 1938 potwierdza działalność w dacie wydania, o ile ustalono jego charakter. Sama data artykułu wspomnieniowego nie wystarcza. Gdy znajdziesz 1890, szukaj późniejszych świadectw; przy 1950 szukaj wcześniejszych. Brak wyników nie dowodzi nieistnienia.
- `materials` to obrazy: historyczne reklamy, skany gazet/dokumentów archiwalnych, pocztówki, dawne zdjęcia i mapy. Każdy ma źródłowy dokument, własne datowanie i uzasadnienie. Współczesny skan gazety 1935 jest materiałem z 1935. Fotografia budynku z 2023 ani skan artykułu z 2008 o roku 1935 nie są ilustracjami wzmianki 1935.
- Przypisuj materiał do wzmianki tylko po ustaleniu związku ze źródłem i zgodności dat. Materiał nie może być późniejszy od okresu wzmianki ani mieć nieustalonej daty. Szerokie datowanie obrazu nie potwierdza konkretnego dnia/roku. Walidator wymaga, żeby datowanie materiału mieściło się w datowaniu wzmianki i wskazywał on dokument użyty jako dowód.
- Klasyfikacja obrazów: `historical` — rozpoznany historyczny materiał; `source-copy` — kopia późniejszego opracowania; `unidentified` — brak daty/tożsamości; `outside-period` — ilustracja innego okresu. Tylko historical, powiązane z datowaną verified wzmianką, trafiają do galerii historycznej i mogą być rozważane do publikacji. Samo stare zdjęcie bez zweryfikowanej wzmianki pozostaje do przypisania.
- Przy A uzupełnij znalezione istniejące B, jeśli identyfikacja jest pewna. Niepewną identyfikację zachowaj jako pytanie. Nowe uboczne miejsca wpisz do candidates z dowodem i możliwymi duplikatami; właściciel decyduje o ich pełnym badaniu. Zachowuj decyzje odrzucenia i połączenia.

## Archiwizacja i prawa

Zawsze zapisuj dostępny skan/obraz prywatnie, także przy prawach unknown/restricted. Nie obchodź ograniczeń dostępu; nieudane pobranie zapisz do ponowienia. Oryginał przechowuj raz po SHA-256, współdziel ścieżkę i zachowuj źródło, stronę oraz pochodzenie wycinków. Kopie późniejszych źródeł zapisuj w documents; nie przypinaj ich jako historycznych ilustracji wzmianki. `research capture --collection=documents|materials` opisuje README.

Status praw, podstawa, dowód, checkedAt i credit dotyczą konkretnego materiału. Nie zgaduj praw ani nie przenoś zgody z wycinka na całą stronę lub inne zdjęcie. Nieznane dane pozostają null. Lokalny podgląd wyraźnie ostrzega o nieustalonych/ograniczonych prawach i braku zatwierdzenia. Zapis prywatny nie nadaje zgody publikacyjnej. Eksport dopuszcza tylko zatwierdzone historyczne materiały z udokumentowaną domeną publiczną, we właściwej zweryfikowanej wzmiance. Import do bazy i publikacja są odrębną operacją operatora — nie wykonuj ich w ramach badania.

## Zakończenie

Zapisz research: kontekst, zapytania, zakresy źródeł, wyniki, zmiany, ograniczenia i dalsze leads. Wykonaj validate, podgląd push i push --apply --firebase-cli; usunięcia zatwierdzaj dopiero po obejrzeniu planu. Krótko podsumuj po polsku: miejsca i wzmianki, nowe udokumentowane daty, materiały historyczne i kopie źródeł, prawa, kandydaci, niepewności i stan synchronizacji. Nie raportuj ukończenia czynności, których nie wykonałeś.
