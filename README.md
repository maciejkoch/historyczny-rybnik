# Historyczny Rybnik

Historyczne miejsca Rybnika na mapie, z opisami i materiałami źródłowymi.

Domena: `historyczny.rybnik.pl` — zarejestrowana w Hostido. [Konfiguracja DNS i Firebase Hosting](docs/mvp-1/domena-konfiguracja.md).

Firebase: [`historyczny-rybnik`](https://console.firebase.google.com/project/historyczny-rybnik/overview). Osobny projekt dla MVP.1; produkty nie są jeszcze skonfigurowane.

## Status

Implementacja MVP.1, budowanego od zera. Faza 1 dostarcza statyczny szkielet Angulara z marką i konfiguracją Hosting preview. Ustalono zakres, nazwę i domenę, kierunek UX/UI oraz architekturę SSG + Firebase Hosting + Functions. Przygotowano propozycję modelu danych do przeglądu.

- [Plan MVP.1](docs/mvp-1/README.md)
- [Nazwa i domena](docs/mvp-1/nazwa-i-domena.md)
- [UX/UI](docs/mvp-1/ux-ui.md)
- [Plan techniczny](docs/mvp-1/technika.md)
- [Model danych — propozycja](docs/mvp-1/model-danych.md)
- [Fazy wdrożenia MVP.1](docs/mvp-1/fazy-wdrozenia.md)
- [Plan implementacji](docs/mvp-1/plan-implementacji.md)
- [Logo — wybrany kierunek](docs/mvp-1/assets/logo/README.md)

## Uruchomienie

Wymagany Node zgodny z `.nvmrc` (22.23.2) oraz npm 12.0.2.

```sh
npm ci
npm start
npm run build
npm run emulate
```

Build generuje statyczne pliki w `dist/historyczny-rybnik/browser`. Nie wymaga procesu serwera ani usług danych. `npm run build` sprawdza też prerender strony głównej, 404 i blokadę indeksowania preview. Fonty Lora i Source Sans 3 (również latin-ext z polskimi znakami) są bundlowane lokalnie z pakietów Fontsource; ich licencje znajdują się w `public/fonts`.

## Publikacja preview

```sh
npx firebase login
npm run preview
```

Polecenie buduje aplikację i publikuje wyłącznie kanał `faza-1` w projekcie `historyczny-rybnik`, ważny 30 dni. Używa lokalnego logowania Firebase CLI; poświadczenia nie trafiają do repozytorium. Nie publikuje kanału live. Konfiguracja nie zawiera fallbacku SPA: nieznane URL-e zwracają HTTP 404 z własnym `404.html`. Preview blokuje indeksowanie przez meta robots, robots.txt i nagłówek X-Robots-Tag. Przed produkcją w fazie 5 potrzebna będzie osobna konfiguracja indeksowania.

CI wykonuje `npm ci`, build i zapisuje artefakt Hosting. Nie ma uprawnień do deploymentu. Na tym etapie frontend nie łączy się z żadnym backendem, więc nie korzysta z produkcyjnych danych; izolacja usług testowych zostaje decyzją fazy 3.

[Zapis odbioru fazy 1](docs/mvp-1/odbior-fazy-1.md).
