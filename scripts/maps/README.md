# Przygotowanie planu Rybnika z 1932 r.

Ten katalog zachowuje narzędzia i dane, których użyto do dopasowania skanu
historycznego planu do współczesnej mapy oraz wygenerowania kafelków WebP.
Pozwala odtworzyć ten proces lub poprawić dopasowanie w przyszłości.

Gotowe kafelki są już zapisane w repozytorium w `public/maps/rybnik-1932/`.
Aplikacja i zwykły build frontendu korzystają z tych plików. Nie trzeba instalować
Pythona ani uruchamiać tych skryptów przy pracy nad interfejsem czy wdrożeniu.
Testy z tego katalogu uruchamia się lokalnie przy zmianach przygotowania mapy;
nie są częścią workflow `build.yml`.

## Pliki

| Plik | Przeznaczenie |
| --- | --- |
| `prepare_history.py` | Dopasowuje skan na podstawie punktów kontrolnych i generuje kafelki XYZ WebP dla zoomów 10–18, manifest z sumami SHA-256 i granice nakładki w `src/app/atlas-map/history-extent.ts`. |
| `history-controls.json` | Zweryfikowane punkty dopasowania i osobne punkty walidacyjne, parametry skanu oraz dane poprzedniego dopasowania do porównań. |
| `test_georeference.py` | Sprawdza transformację i jej odwrotność, zgodność z punktami walidacyjnymi oraz odrzucanie błędnych danych. |
| `register_scans.py` | Opcjonalne narzędzie pomocnicze: porównuje skan z lokalnymi kafelkami odniesienia i zapisuje kandydatów na punkty kontrolne do przeglądu. Nie pobiera ani nie publikuje obrazów odniesienia. |
| `history-reference.json` | Adres wzorca kafelków odniesienia i ich sumy SHA-256 dokumentujące materiał użyty do porównania. |
| `requirements.txt` | Wersje NumPy i Pillow potrzebne do przygotowania kafelków i testów. Opcjonalny `register_scans.py` wymaga dodatkowo OpenCV wskazanego w jego opisie. |

## Odtworzenie kafelków

Polecenia uruchamiaj z głównego katalogu repozytorium, w osobnym środowisku
Pythona (przy przygotowaniu używano Pythona 3.12):

```sh
python3 -m venv /tmp/historyczny-rybnik-maps-venv
. /tmp/historyczny-rybnik-maps-venv/bin/activate
python -m pip install -r scripts/maps/requirements.txt
python -m unittest discover -s scripts/maps
python scripts/maps/prepare_history.py /sciezka/do/skanu-strony-3.jpg
```

Wejściem jest oryginalny obraz wyodrębniony z trzeciej strony PDF Mazowieckiej
Biblioteki Cyfrowej, np. poleceniem `pdfimages -f 3 -l 3 -j source.pdf page`
(narzędzie Poppler). Skrypt sprawdza sumę SHA-256 i wymiary obrazu względem
`history-controls.json`, więc przypadkowy lub przeskalowany skan zostanie odrzucony.

Generowanie zastępuje dotychczasowe kafelki WebP w `public/maps/rybnik-1932/`
i aktualizuje manifest oraz plik granic nakładki. Przed zapisaniem zmian należy
przejrzeć różnice i sprawdzić dopasowanie w aplikacji.

Zoomy 10–16 korzystają z osobnego pomniejszenia skanu dla każdego poziomu
(filtr Lanczos), próbkowania z podwójną rozdzielczością i końcowego pomniejszenia
Lanczos do 256 × 256 px. Zapas trzech pikseli wokół kafelka zapobiega szwom
przy filtrowaniu. Zapis WebP ma jakość 85. Zoomy 17–18 korzystają z pełnego skanu 18 327 × 12 835 px
i WebP quality=95. Powyżej poziomu 18 aplikacja powiększa kafelki poziomu 18.
Aby dodać lub odtworzyć wyłącznie nowe poziomy, bez zapisywania kafelków 10–16:

```sh
python scripts/maps/prepare_history.py /sciezka/do/skanu-strony-3.jpg --extend-high-zooms
```

Aby odświeżyć wyłącznie poziomy 10–16, zachowując ostre kafelki 17–18:

```sh
python scripts/maps/prepare_history.py /sciezka/do/skanu-strony-3.jpg --refresh-low-zooms
```

Oba tryby przed generowaniem sprawdzają zgodność źródła, georeferencji i sum
SHA-256 zachowywanych kafelków. Flagi wykluczają się wzajemnie.

## Źródło i dokładność

Publikowane kafelki pochodzą ze skanu MBC oznaczonego jako domena publiczna.
Obrazy ze Starych Planów Miast służyły wyłącznie jako odniesienie do dopasowania;
aplikacja ich nie publikuje ani nie pobiera podczas działania.

Testy mierzą zgodność z tym odniesieniem, a nie niezależnie potwierdzoną dokładność
terenową. Szczegóły źródeł i metody są w
[dokumentacji map](../../agent-context/reference/mvp-1/mapy-zrodla.md).
