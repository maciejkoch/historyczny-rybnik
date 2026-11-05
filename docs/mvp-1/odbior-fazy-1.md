# Odbiór fazy 1 — podstawa i marka

Data: 5 listopada 2026. Status: weryfikacja przed publikacją preview.

Angular 22.2.4, CLI/build/SSG 22.2.5; Node 22.23.2, TypeScript 6.0. Wersje zależności przypięte w package-lock.json. Stabilny tag Angulara i zakres Node sprawdzono w npm przy implementacji; [zgodność Angulara](https://angular.dev/reference/versions).

Zakres: szkielet CLI, routing i prerender do statycznego HTML, marka „Ryba na mapie”, lokalne Lora i Source Sans 3 z latin-ext oraz licencjami OFL, Tailwind 4 i daisyUI 5, jeden panel i mobilny układ, komunikaty mapy (przygotowanie, ładowanie, błąd), dostępny fokus i skip link. Brak mapy i usług danych zgodnie z fazą 1.

Hosting: projekt `historyczny-rybnik`, kanał preview `faza-1`. Brak backendu w bundle. Konto CLI służy tylko publikacji statycznych zasobów; nie provisionujemy Firestore/Auth/Storage/Functions. Nie ma rewrite do index.html. Własna strona 404 jest kopiowana z prerenderu. Preview ma noindex w HTML i nagłówku oraz robots.txt.

Adres i commit: do uzupełnienia po publikacji.

Wynik kontroli: do uzupełnienia po publikacji.
