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

**Nie publikujemy ani nie hotlinkujemy obrazów kafelków Stare Plany Miast w aplikacji.** Opis projektu nie zawierał potwierdzenia licencji na ich publikację. Na zlecenie właściciela pobrano próbki do porównania oraz użyto ich georeferencji jako odniesienia współrzędnych; szczegóły poniżej. Nie publikujemy też pobranego do porównania skanu MAPSTER. Własna nakładka pochodzi wyłącznie z PDF MBC.

## Własna georeferencja i kafelki

Źródłowy PDF: [Plan miasta Rybnika, Kart.BD-190](https://cyfrowemazowsze.pl/Content/113717/00117267_Miejski-Urzad-Budowlany_Plan-miasta-Rybnika_Kart-BD-190.pdf). Trzecia strona zawiera arkusz w rozdzielczości 18 327 × 12 835. Wyodrębniono oryginalny JPEG, bez ponownego rasteryzowania PDF.

### Korekta dopasowania po porównaniu ze Starymi Planami Miast

Pierwsza wersja opierała się na pięciu przybliżonych symbolach budynków skupionych w centrum. RMS 18,6 m opisywał reszty na tych samych punktach, nie dokładność całego arkusza. Porównanie ujawniło narastający błąd skali i przekoszenia. Te punkty zachowano w `previousCentralControls` jako zapis poprzedniej metody, ale nie sterują już generowaniem.

Punktem odniesienia jest georeferencja [planu ze Starych Planów Miast](https://stareplanymiast.pl/plan-miasta-rybnika-z-1932r/). Zgodne szczegóły obu skanów rozpoznano metodą SIFT/FLANN; RANSAC odrzucił niezgodne pary (2767 zgodnych z 2994 kandydatów). Użyto 319 lokalnie zapisanych kafelków odniesienia z poziomu 16. Ich adresy i sumy SHA-256 zapisano w `scripts/maps/history-reference.json`; nie są częścią publicznej nakładki. Skrypt audytowy `register_scans.py` odczytuje lokalne pliki, nie pobiera ani nie publikuje obrazów odniesienia. Ponowna detekcja cech może dać nieco inną selekcję zależnie od wersji OpenCV; wejściem reprodukowalnego generatora są zatwierdzone współrzędne w `history-controls.json`.

Aby las na wschodzie nie dominował dopasowania, podzielono skan na komórki 2000 × 2000 pikseli i wybrano najwyżej osiem rozłożonych punktów z każdej. Wybrano **189 punktów dopasowania i 68 punktów walidacyjnych w rozłącznych komórkach**. Szczegóły zajmują 36 komórek, od x≈2285 do 16660 i y≈1081 do 10708 pikseli. Marginesy bez rozpoznawalnych szczegółów pozostają ekstrapolacją.

Porównano transformację afiniczną i projekcyjną: na punktach walidacyjnych mediana rozbieżności względem odniesienia wynosiła odpowiednio 2,14 m i 1,67 m. Wybrano jedną transformację projekcyjną całego arkusza, bez lokalnego wyginania historycznych ulic do współczesnych dróg. Znormalizowane DLT wyznacza macierz piksele → EPSG:3857. Dla 68 punktów niewykorzystanych do dopasowania: **mediana 1,67 m, percentyl 90: 3,17 m, maksimum 4,51 m**. Poprzednia metoda na tych samych punktach miała medianę 86,96 m.

**To zgodność z georeferencją odniesienia, nie niezależnie zmierzona dokładność względem terenu.** Błędy Starych Planów Miast i oryginalnego planu mogą pozostać. Kontrola wizualna zachowanych osi ulic Gliwickiej, Raciborskiej i Mikołowskiej z OSM jest osobną kontrolą rozsądności; przebudowane skrzyżowania, m.in. Rudzkiej, nie są ścisłymi kontrolami metrycznymi. Plan nie służy do rozstrzygania granic posesji. Interfejs nadal opisuje dopasowanie jako przybliżone.

`scripts/maps/prepare_history.py` przelicza odwrotną transformacją projekcyjną piksele kafelków XYZ na skan MBC i zapisuje WebP 256 × 256 dla zoomów 10–18. Poziomy 10–16 korzystają z pomniejszenia skanu filtrem Lanczos dobranego do każdego zoomu, próbkowania z podwójną rozdzielczością i końcowego pomniejszenia Lanczos do 256 × 256 px (jakość WebP 85). Trzypikselowy zapas wokół kafelka pozwala filtrowi uwzględniać sąsiadujące piksele bez tworzenia szwów. Dzięki temu drobne kreskowanie uśrednia się zamiast tworzyć poszarpane wzory przy oddaleniu. Nowe poziomy 17–18 powstają z pełnego skanu 18 327 × 12 835 px, z jakością WebP 95; generator przetwarza lokalne wycinki z zapasem dla interpolacji bikubicznej. Nie zmienia kolorów, nie usuwa oznaczeń i zachowuje cały arkusz. Zoom 19 skaluje poziom 18. Tryb `--extend-high-zooms` weryfikuje źródło, georeferencję i sumy zachowywanych kafelków, a następnie generuje wyłącznie poziomy 17–18. Ładowane są tylko kafelki widoczne w bieżącym kadrze. Zasoby są częścią statycznego builda i pochodzą z tej samej domeny co aplikacja. Tryb `--refresh-low-zooms` regeneruje tylko poziomy 10–16, weryfikując i zachowując identyczne bajtowo poziomy 17–18. Pełny zestaw 10–18: 15 057 kafelków, 101 170 928 bajtów. Manifest zawiera macierz, zasięg, walidację i SHA-256 każdego kafelka; generator usuwa stare kafelki, które wyszły z nowego zasięgu.

Kontrola offline: `python -m unittest discover -s scripts/maps` sprawdza transformację projekcyjną i odwrotną, rozdzielenie przestrzenne kontroli, porównanie z poprzednią metodą odrzucenie błędnej walidacji oraz uśrednianie drobnego wzoru i spójność sąsiadujących kafelków po filtrowaniu. Generator blokuje publikację przy percentylu 90 powyżej 4 m lub maksimum powyżej 8 m względem odniesienia. Zwykły build npm sprawdza integralność całego zestawu.

Odtworzenie zasobów (po pobraniu źródłowego PDF):

```sh
python3 -m venv /tmp/rybnik-map-tools
/tmp/rybnik-map-tools/bin/pip install -r scripts/maps/requirements.txt
pdfimages -f 3 -l 3 -j source.pdf /tmp/rybnik-page
/tmp/rybnik-map-tools/bin/python scripts/maps/prepare_history.py /tmp/rybnik-page-000.jpg
```

Wymagany Poppler (`pdfimages`). Inna wersja pliku wejściowego jest odrzucana przez kontrolę SHA-256. Codzienny build npm korzysta z gotowych kafelków i nie wymaga Pythona ani pobierania źródła.

## Atrybucja na wąskim ekranie — 10 listopada 2026

[OpenStreetMap Foundation](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) wymaga wskazania OpenStreetMap i dostępu do informacji o licencji; dla map interaktywnych dopuszcza zwinięcie po interakcji z mapą, z możliwością ponownego wyświetlenia. [OpenFreeMap](https://openfreemap.org/) wymaga atrybucji OpenMapTiles i OpenStreetMap. [MapLibre](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/AttributionControlOptions/) opisuje standardowe responsywne zwijanie na wąskich mapach. Zachowujemy pełne dane źródeł, w tym planu MBC, i stosujemy standardową kontrolkę: początkowo rozwiniętą, a po przesunięciu mapy zwijaną na wąskim ekranie. Nie usuwamy atrybucji.
