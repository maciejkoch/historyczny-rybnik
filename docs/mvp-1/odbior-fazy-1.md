# Odbiór fazy 1 — podstawa i marka

Data: 5 listopada 2026. Status: **odebrana — preview działa**.

Angular 22.2.4, CLI/build/SSG 22.2.5; Node 22.23.2, TypeScript 6.0. Wersje zależności przypięte w package-lock.json. Stabilny tag Angulara i zakres Node sprawdzono w npm przy implementacji; [zgodność Angulara](https://angular.dev/reference/versions).

Zakres: szkielet CLI, routing i prerender do statycznego HTML, marka „Ryba na mapie”, lokalne Lora i Source Sans 3 z latin-ext oraz licencjami OFL, Tailwind 4 i daisyUI 5, jeden panel i mobilny układ, komunikaty mapy (przygotowanie, ładowanie, błąd), dostępny fokus i skip link. Brak mapy i usług danych zgodnie z fazą 1.

Hosting: projekt `historyczny-rybnik`, kanał preview `faza-1`. Brak backendu w bundle. Konto CLI służy tylko publikacji statycznych zasobów; nie provisionujemy Firestore/Auth/Storage/Functions. Nie ma rewrite do index.html. Własna strona 404 jest kopiowana z prerenderu. Preview ma noindex w HTML i nagłówku oraz robots.txt.

Adres: https://historyczny-rybnik--faza-1-fxye6q7m.web.app/

Środowisko: Firebase Hosting preview `faza-1`, projekt `historyczny-rybnik`; bez backendu danych. Publikacja ważna do 5 grudnia 2026, godz. 10:05 czasu Europe/Warsaw. Wersja Hosting: `f5524ed15437aafc`.

Commit wdrożonego kodu: `82cd0fd` (implementacja bazowa: `f9df980`).

Wynik kontroli:

- `npm ci` oraz następujący po nim `npm run build`: sukces. Dwie prerenderowane trasy, statyczny artefakt; kontrola HTML, 404, marki i noindex przechodzi.
- HTTPS `/`: HTTP 200; działa również po odświeżeniu w przeglądarce.
- Nieznany `/nieistniejaca-strona`: HTTP 404 z własnym tekstem „Nie ma takiej strony”.
- Logo SVG, favicon SVG, robots.txt: HTTP 200; wszystkie 14 lokalnych plików WOFF2 z CSS: HTTP 200, w tym latin-ext. Przeglądarka potwierdziła załadowanie fontów; nagłówek używa Lory, tekst Source Sans 3.
- Nagłówek X-Robots-Tag zawiera noindex; HTML ma meta robots noindex/nofollow.
- Odbiór wizualny wdrożenia: desktop około 1252 × 959 oraz telefon 390 × 844. Jeden panel po lewej na desktopie; na telefonie nagłówek, obszar mapy i jeden panel poniżej. Brak poziomego przepełnienia. Poprawiono wykryty konflikt klasy `contents` z narzędziem Tailwind.
- Układ zawiera skip link, widoczny fokus, semantyczne odnośniki i przycisk ponawiania dla przyszłego błędu mapy. Stany loading/error są przygotowane w komponencie, ale bez symulowanej usługi na publicznej stronie. Nie przeprowadzono pełnego audytu czytnikiem ekranu.
- `npm audit --omit=dev`: zero zgłoszonych podatności. Pełny audit zgłasza 14 umiarkowanych problemów w narzędziach developmentu; nie są częścią publikowanego statycznego runtime. Bez wymuszania aktualizacji łamiących zgodność.

Otwarte usterki blokujące odbiór: brak.

Uwagi: CLI ostrzega o braku synchronizacji domeny preview z Firebase Auth — Auth nie jest jeszcze skonfigurowane ani używane i należy do fazy 3. Automatyczny test fokusu w przeglądarce zakończył się timeoutem narzędzia; nie zapisujemy go jako zaliczonego. Nie wykonywano testów jednostkowych odtwarzających CSS. CI dodano, ale nie uruchamiano go zdalnie; odpowiadające mu kroki npm ci i build przeszły lokalnie.
