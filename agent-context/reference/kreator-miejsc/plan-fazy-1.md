# Kreator miejsc — plan fazy 1

Status: plan, nie opis wdrożonej funkcji. Bazą pracy jest gałąź `codex/creator-requirements` z PR #33. Zakres i dalszą kolejność określa [podział prac](podzial-zadan.md).

## Cel i interfejs

- Administrator otwiera kreator z menu, wyszukuje miejsca po nazwie i widzi status: opublikowane, opublikowane z nieopublikowanymi zmianami albo nowy szkic.
- Może utworzyć i otworzyć szkic oraz usunąć nowy, nieopublikowany szkic. Nie może usunąć opublikowanego miejsca.
- Strona szkicu ma wspólny nagłówek oraz trzy sąsiadujące panele: AI, edycja ręczna i podgląd, wypełniające pozostałą wysokość okna. Szerokość zmienia się przez przeciąganie granic, jak na mapie, także z obsługą klawiatury. Formularz, podgląd i AI powstaną w kolejnych zadaniach.
- W mobilnym menu nie ma odnośnika do kreatora, ale bezpośredni adres działa również na telefonie; układ nie wymaga dostosowania do małego ekranu.
- Kreator jest aplikacją SPA renderowaną w przeglądarce. Trasy listy i szkicu muszą działać także przy bezpośrednim wejściu oraz odświeżeniu; serwer nie renderuje prywatnych danych szkicu.

## Dane i dostęp

- Szkice zapisujemy w kolekcji `placeDrafts` w rzeczywistej bazie Firebase `places-dev`, oddzielnie od opublikowanych rekordów w `places`. Szkic istniejącego miejsca ma ten sam identyfikator; nowy otrzymuje identyfikator używany później przy publikacji.
- Szkic zawiera pola merytoryczne aktualnego miejsca, lecz dopuszcza puste wymagane pola; pełna walidacja kontraktu obowiązuje przed publikacją. Czas utworzenia i zmiany nadaje serwer. Lista rozróżnia szkic identyczny z opublikowanym miejscem od faktycznych zmian, pomijając daty techniczne.
- Wspólny szkic istniejącego miejsca tworzymy transakcyjnie. Przy równoczesnych zapisach szkicu ostatni zapis wygrywa; nie wersjonujemy szkiców ani nie wykrywamy konfliktów edycji. Sprawdzenie, czy usuwany szkic nie dotyczy opublikowanego miejsca, jest transakcyjne.
- Operacje przechodzą przez backend z walidacją. Wdrożone API wymaga App Check, Google Auth i roli administratora; lokalny backend na localhost korzysta z wyjątku opisanego w SECURITY. Bezpośredni dostęp przeglądarki do Firestore pozostaje zablokowany. Rekordy publiczne nie zmieniają się wskutek zapisu szkicu.
- Osobne operacje callable listują miejsca i szkice, tworzą nowy szkic, otwierają lub tworzą wspólny szkic istniejącego miejsca oraz usuwają wyłącznie nowy szkic. Odpowiedzi i żądania mają współdzielone kontrakty; lista zwraca tylko dane potrzebne do jej wyświetlenia.

## Lokalne uruchomienie i odbiór

- Aplikacja i backend działają lokalnie i łączą się z rzeczywistą bazą Firebase `places-dev`. Do lokalnego odbioru nie używamy mocków, fikcyjnych danych ani emulatora Firestore. Zapisy są widoczne we współdzielonym dev.
- Lokalny backend działa wyłącznie na loopback, bez Auth i App Check, zgodnie z wyjątkiem w SECURITY. Dostęp do Firebase korzysta z uprawnionej lokalnej tożsamości, bez kluczy kont usług w repozytorium; wdrożone API zachowuje wszystkie zabezpieczenia.
- Przed późniejszym wdrożeniem Functions dobrać i zweryfikować minimalne IAM. Sam lokalny odbiór nie obejmuje deploymentu ani zmiany konfiguracji chmury.

## Weryfikacja i dokumentacja

- Sprawdzić utworzenie, wyszukanie, ponowne otwarcie i usunięcie szkicu, ochronę miejsc opublikowanych, wspólny szkic przy równoczesnym otwarciu oraz brak wpływu szkicu na publiczną kartę i API.
- Sprawdzić odmowę dostępu bez wymaganej tożsamości, roli lub App Check, błędne dane, regulację paneli i obsługę klawiaturą. Uruchomić odpowiednie testy i `npm run build`; nie usuwać ani nie nadpisywać cudzych danych dev w testach.
- Sprawdzić i zaktualizować dokumentację bieżących funkcji, architektury, uruchamiania i właściwe README; przy zmianie poleceń zaktualizować spis skryptów.
