# data

Dane wejściowe publikowanego katalogu i materiałów miejsc. Służą przygotowaniu oraz weryfikacji statycznej treści. Procedury importu i snapshotu są w `scripts/places/`; dane robocze agenta nie należą do tego katalogu.

`places.catalog.json` to pełny katalog dev (196 miejsc) z MVP.0. `places.test-data.json` pozostaje małym zestawem CI. Raport mapowania i ograniczenia publikacji: `agent-context/full-catalog/`.

source-rights.json jest indeksem weryfikacji praw: źródła i konkretne wydania, status, data, dowód oraz powiązane miejsca i referencje. Przed sprawdzeniem kolejnego materiału odczytaj indeks; korzystaj z decyzji tylko w zapisanym zakresie wydania. Brak wpisu lub status not-reviewed/unconfirmed nie zezwala na publikację kopii. W tym zadaniu dopuszczamy wyłącznie domenę publiczną potwierdzoną w metadanych źródła. Nie uznajemy całej biblioteki ani tytułu czasopisma za domenę publiczną.
