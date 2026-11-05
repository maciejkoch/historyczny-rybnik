# Mapa współczesna i plan 1932 — źródła oraz przygotowanie

Weryfikacja: 5 listopada 2026.

## Podkład współczesny

Dostawca: [OpenFreeMap](https://openfreemap.org/), publiczna usługa, bez rejestracji i klucza API. Według opisu usługi brak opłat oraz limitów liczby wyświetleń/żądań. Usługa jest udostępniana „as is”, bez gwarancji ciągłej dostępności; [warunki](https://openfreemap.org/tos/). Nie implementujemy prefetchu ani pobierania offline.

Źródło wektorowe: `https://tiles.openfreemap.org/planet`, glify: `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`, Noto Sans Regular. Nie pobieramy zewnętrznych sprite'ów ani ikon. Kontrolki są lokalnym HTML/CSS. Nie ma klucza przeglądarkowego, więc ograniczanie domen klucza nie dotyczy tej konfiguracji.

Własny styl `public/maps/rybnik-style.json` używa [schematu OpenMapTiles](https://openmaptiles.org/docs/schema/), a nie kopii cudzego stylu. Spokojne tło, woda, zieleń, budynki i drogi odpowiadają zatwierdzonym tokenom. Atrybucja z TileJSON pozostaje widoczna: OpenFreeMap, OpenMapTiles oraz OpenStreetMap (link do praw/licencji ODbL). [Instrukcja integracji i własnych stylów](https://openfreemap.org/quick_start/).

Koszt dostawcy kafelków: obecnie 0. Lokalnie serwowany frontend i plan wykorzystują transfer/storage Firebase Hosting. Dokładny przyszły koszt zależy od ruchu i planu projektu; nie włączano rozliczeń ani nowych płatnych usług.

## Czy możemy publikować plan?

Punktem wyjścia był [MAPSTER, rekord 1755274](https://igrek.amzp.pl/1755274): Plan miasta Rybnika, 1932, skala 1:15 000, Miejski Urząd Budowlany, druk Książnica-Atlas, egzemplarz ze zbiorów Ryszarda Hubisza. Sam rekord nie jest licencją na współczesne opracowania ani usługi kafelków.

Znaleziono niezależny [rekord Mazowieckiej Biblioteki Cyfrowej, wydanie 113717](https://cyfrowemazowsze.pl/dlibra/publication/117267/edition/113717), identyfikator `oai:mbc.cyfrowemazowsze.pl:113717`, sygnatura Kart.BD-190. Biblioteka oznacza plan: **„Domena publiczna”** oraz **„Dla wszystkich bez ograniczeń”**. Autorstwo instytucjonalne: Miejski Urząd Budowlany i Księgarnia Polska Maksymiljana Basisty w Rybniku; druk Książnica-Atlas. Datowanie biblioteki: 1932/1933. Arkusz zawiera napis „Rybnik w 1932 r.” — tę datę stosujemy w interfejsie.

Decyzja implementacyjna: korzystamy ze skanu udostępnionego przez MBC i jego jawnego oznaczenia praw, zachowujemy informację o źródle i autorstwie. Nie opieramy publikacji wyłącznie na wieku mapy. Nie przypisujemy bibliotece zatwierdzenia naszego dopasowania. Jest to udokumentowana podstawa użycia konkretnego skanu, a nie ogólna opinia o statusie całego zbioru MAPSTER.

**Nie wykorzystujemy ani nie hotlinkujemy kafelków Stare Plany Miast.** Opis projektu nie zawierał potwierdzenia licencji na ich użycie w tej aplikacji. Nie publikujemy też pobranego do porównania skanu MAPSTER. Własna nakładka pochodzi wyłącznie z PDF MBC.

## Własna georeferencja i kafelki

Źródłowy PDF: [Plan miasta Rybnika, Kart.BD-190](https://cyfrowemazowsze.pl/Content/113717/00117267_Miejski-Urzad-Budowlany_Plan-miasta-Rybnika_Kart-BD-190.pdf). Trzecia strona zawiera arkusz w rozdzielczości 18 327 × 12 835. Wyodrębniono oryginalny JPEG, bez ponownego rasteryzowania PDF.

`scripts/maps/history-controls.json` zapisuje źródło, SHA-256 obrazu i pięć punktów kontrolnych odczytanych na skanie: kościół Matki Bożej Bolesnej, bazylika św. Antoniego, Stary Ratusz, Magistrat i Zamek. Współczesne współrzędne referencyjne pochodzą z konkretnych obiektów OSM wskazanych w pliku. Posłużyły wyłącznie przygotowaniu georeferencji; nie są importem katalogu miejsc do aplikacji.

`scripts/maps/prepare_history.py` dopasowuje metodą najmniejszych kwadratów transformację afiniczną do EPSG:3857, przelicza piksele na XYZ i zapisuje WebP 256 × 256 dla zoomów 10–16. Nie zmienia kolorów, nie usuwa oznaczeń i zachowuje cały arkusz. Wyższe zoomy skalują poziom 16. Ładowane są tylko kafelki widoczne w bieżącym kadrze. Gotowe zasoby są częścią statycznego builda i pochodzą z tej samej domeny co aplikacja.

Wynik: 943 kafelki, 7 066 002 bajty. Manifest zawiera SHA-256 każdego kafelka, macierz transformacji, zasięg oraz odchylenia na kontrolach. RMS dopasowania: 18,6 m, maksymalna reszta na kontrolach: 27,8 m. **To miara dopasowania na użytych kontrolach, nie niezależnie zmierzona dokładność mapy.** Punkty skupiają się w centrum; na obrzeżach zniekształcenia mogą być większe. Oryginalny plan nie służy do rozstrzygania granic posesji. Interfejs jawnie opisuje dopasowanie jako przybliżone.

Odtworzenie zasobów (po pobraniu źródłowego PDF):

```sh
python3 -m venv /tmp/rybnik-map-tools
/tmp/rybnik-map-tools/bin/pip install -r scripts/maps/requirements.txt
pdfimages -f 3 -l 3 -j source.pdf /tmp/rybnik-page
/tmp/rybnik-map-tools/bin/python scripts/maps/prepare_history.py /tmp/rybnik-page-000.jpg
```

Wymagany Poppler (`pdfimages`). Inna wersja pliku wejściowego jest odrzucana przez kontrolę SHA-256. Codzienny build npm korzysta z gotowych kafelków i nie wymaga Pythona ani pobierania źródła.
