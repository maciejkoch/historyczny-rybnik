# data

Dane wejściowe publikowanego katalogu i materiałów miejsc. Służą przygotowaniu oraz weryfikacji statycznej treści. Procedury importu i snapshotu są w `scripts/places/`; ulotne notatki agenta nie należą do tego katalogu. `places/` jest prywatnym, trwałym warsztatem badawczym projektu (poza Git), opisanym w [README](places/README.md).

`places.catalog.json` to pełny katalog dev (196 miejsc) z MVP.0. `places.test-data.json` pozostaje małym zestawem CI. Raport mapowania i ograniczenia publikacji: `agent-context/full-catalog/`.

source-rights.json jest indeksem weryfikacji praw: źródła i konkretne wydania, status, data, dowód oraz powiązane miejsca i referencje. Przed sprawdzeniem kolejnego materiału odczytaj indeks; korzystaj z decyzji tylko w zapisanym zakresie wydania. Brak wpisu lub status not-reviewed/unconfirmed nie zezwala na publikację kopii. W tym zadaniu dopuszczamy wyłącznie domenę publiczną potwierdzoną w metadanych źródła. Nie uznajemy całej biblioteki ani tytułu czasopisma za domenę publiczną.

Nowe badania przechowują źródła, materiały i decyzje praw w warsztacie. `source-rights.json` pozostaje wejściem migracji wcześniejszych publikacji; nie jest równoległym rejestrem nowych badań. Publiczne rekordy używają płaskich `tags` oraz jawnego `period`, zamiast pojedynczego `category`.
