---
name: rybnik-research-places
description: Badaj historię miejsc Rybnika, kontynuuj wcześniejsze poszukiwania i rozwijaj lokalny warsztat źródeł, materiałów oraz kandydatów. Używaj do badań historycznych, nie do implementacji aplikacji ani automatycznej publikacji.
---

# Badanie miejsc Rybnika

Warsztat: `data/places/`. Przeczytaj jego README (format i polecenia), aktualne AGENTS/SECURITY oraz `resources/README.md`. Dokładne kontrakty są w `scripts/research/model.mjs`. Domyślny kontekst z `config.json`: Rybnik, elastycznie 1918–1939, plan 1932 jako odniesienie przestrzenne. Użytkownik podaje temat („kościoły”, „firma A”, „adresy i zdjęcia”), nie musi podawać lat.

## Kontynuacja wiedzy

Przed edycją wykonaj podgląd `npm run research -- pull --firebase-cli`, a następnie pobierz z `--apply`; sprawdź usunięcia przed osobnym `--approve-deletions`. Nie obchodź konfliktu ani nie nadpisuj niezapisanej lokalnej pracy. Gdy Storage jest niedostępne, można czytać istniejący warsztat, ale nie deklarować synchronizacji ani rozpoczynać niezależnej kopii zbioru.

Odczytaj dopasowane miejsca, także `out-of-period/`, kandydatów i decyzje odrzucenia/połączenia, materiały, tagi, źródła oraz poprzednie `research/`. Zajrzyj do powiązanych miejsc. Ustal istniejącą wiedzę, braki i sprzeczności. Używaj trwałych ID, nie twórz rekordu ponownie po zmianie nazwy lub URL.

Korzystaj ponownie ze znanych źródeł i prowadź nowe wyszukiwanie internetu. Podążaj za istotnymi linkami, bibliografią, przypisami i sygnaturami A → B → C. Przydatne B dopisz jako źródło z `discoveredFrom`, dokładnym wskazaniem A i opisem zakresu. Nie traktuj powtórzenia za A jako niezależnego dowodu. Próbuj dotrzeć do oryginału. Zapamiętuj odwiedzone ścieżki i wyniki, aby nie krążyć w pętli. Utrzymuj zakres bieżącego kontekstu; dalsze niewykonane tropy zapisuj jako leads, zamiast rozpoczynać nieograniczoną kaskadę.

## Interpretacja i zapisy

- Miejsce to obiekt lub punkt działalności: kościół, urząd, cmentarz, sklep, fryzjer. Bez osobnych modeli budynku i instytucji. Powiązania: ID + opcjonalna notatka + materiał. Sam adres lub podobna nazwa nie dowodzą tożsamości.
- Przy badaniu A uzupełnij istniejące B znalezione w materiale, jeśli identyfikacja jest pewna. Niepewną identyfikację zachowaj jako pytanie/hipotezę. Nowe miejsce dopisz do candidates z konkretną wzmianką, kontekstem i możliwymi duplikatami. Właściciel decyduje o jego badaniu; nie rozpoczynaj go automatycznie. Zachowuj decyzje odrzucenia/połączenia.
- Każdy materiał ma odrębne datowanie publikacji/powstania i opisywanego okresu; rok, zakres, przybliżenie albo null. Nie wymyślaj dokładności. Późniejszy artykuł może dowodzić wcześniejszego istnienia.
- Wzmianka 1950: sprawdź istnienie wcześniej. Wzmianka 1890: sprawdź istnienie później. Szukaj dat powstania/zamknięcia, ciągłości, zmian nazw i adresów. Zapisz także wynik nierozstrzygnięty i wykonane próby.
- Bieżące ogłoszenie firmy lub wpis w księdze adresowej z 1938 r. samo stanowi dowód działalności w tym czasie. Nie wymagaj dodatkowego historicalDate, jeżeli współczesny charakter treści jest ustalony; zapisz temporalContext: contemporary i wyjaśnij podstawę w dowodzie. Sama data gazety z artykułem wspomnieniowym nie wystarcza.
- `confirmed`: konkretny dowód istnienia w okresie; `probable`: konkretne przesłanki i jawne uzasadnienie, ale brak potwierdzenia. Oba w places. Sama wcześniejsza/późniejsza wzmianka nie uzasadnia prawdopodobieństwa. `unverified`/`outside`: out-of-period; zachowaj na przyszłość. Zmiana kwalifikacji przenosi ten sam rekord, bez nowego ID.
- findings zawierają nasze ustalenia z materialId i dokładnym locator. Oddziel cytat, OCR/transkrypcję i streszczenie materiału od naszej interpretacji. Sprzeczności i niepewny odczyt zachowaj, nie nadpisuj ich milcząco. Brak wyników nie dowodzi nieistnienia. Publiczny opis pisz własnymi słowami.
- Tagi są płaskie i przypisane wprost, minimum jeden na miejsce. Fryzjer: usługi + fryzjer; cmentarz: cmentarz + obiekt sakralny; bazylika: obiekt sakralny + kościół. Sprawdź słownik/synonimy przed dodaniem tagu. Brak dziedziczenia.
- Zawsze zapisuj odnaleziony i dostępny skan/obraz w prywatnym warsztacie, również przy `unknown`, `restricted` lub prawach zabraniających publikacji. Prawa do publikacji nie blokują wewnętrznej archiwizacji. Nie obchodź uwierzytelnienia ani technicznych ograniczeń dostępu; nieudane pobranie zapisz jako ograniczenie i trop do ponowienia. Nie ograniczaj się do linku, gdy kopia jest dostępna. Oryginał zapisuj raz po SHA-256 i współdziel między materiałami/miejscami; zachowaj link, stronę i pochodzenie. Dla PDF zapisz także czytelny obraz odpowiedniej strony/wycinka, powiązany z oryginałem i opisem przekształceń. Polecenie `research capture` opisuje README warsztatu. Przed pobraniem sprawdź istniejące pliki, nie twórz ich kopii pod kolejnymi nazwami.
- Każdy materiał ma jawny stan praw (`unknown`, `restricted`, `licensed`, `public-domain`), podstawę i dowód, jeśli są znane. Nie zgaduj praw i nie traktuj wewnętrznej kopii jako zgody publikacyjnej. Lokalna przeglądarka pokazuje obraz wraz z miejscami, źródłem i ostrzeżeniem o nieustalonych/ograniczonych prawach lub braku zatwierdzenia publikacji. Publikacja jest oddzielną decyzją: obecny eksport obrazów dopuszcza wyłącznie potwierdzoną domenę publiczną, z basis, checkedAt, credit i evidenceUrl albo evidenceMaterialId. Dla własnych skanów nie wymyślaj URL ani autora.
- Aktualizacje badawcze nie nadają automatycznie `publicationApproved`. Import i publikacja są osobnym etapem operatora. Nie wdrażaj ani nie zapisuj do bazy podczas badania.

## Zakończenie

Zapisz research: kontekst, zapytania, źródła i zakresy stron, found/no-results/unavailable, rzeczywiste zmiany rekordów, niewykonane leads, ograniczenia i krótki summary. Zweryfikuj `npm run research -- validate`, potem podgląd push i `push --apply --firebase-cli`. Usunięcia tylko po obejrzeniu planu i jawnym zatwierdzeniu. Nie raportuj synchronizacji zakończonej, jeśli wystąpił błąd; zachowaj lokalne wyniki.

Odpowiedz krótko po polsku: jakie miejsca dodano/uzupełniono (także B), stan potwierdzenia okresu, nowe/uzupełnione źródła, materiały i nieustalone prawa, nowi kandydaci, miejsca spoza okresu oraz najważniejsze otwarte pytania i tropy. Pomiń puste sekcje. Podaj stan synchronizacji, jeśli nie została ukończona. Szczegóły pozostają w research; raport ma opisywać wykonane zmiany.
