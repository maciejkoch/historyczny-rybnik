# Odbiór fazy 3

Data: 5 listopada 2026. Środowisko: stały dev, https://historyczny-rybnik-dev.web.app/. Gałąź `codex/mvp-phase-3`, PR do `codex/mvp-phase-2`. Commit aplikacji wdrożonej na dev: `3d3c930cea23476cef534b9a4314f89faf01fb57`. Późniejszy commit dokumentacji/testów nie zmienia artefaktów aplikacji.

## Zakres

Infrastruktura miejsc, kontrakt i walidacja, importer jednego kościoła, callable odczytu i zapisu, reguły dostępu, serwerowy snapshot builda, SSG, lokalne wyszukiwanie i karta. [Konfiguracja i decyzje właściciela](faza-3-infrastruktura.md).

Dokładnie jeden rekord w bazie i katalogu: `place_sw_antoni` / `/miejsca/bazylika-sw-antoniego-padewskiego`. Bazylika św. Antoniego, Mikołowska 4. Własny opis ze wskazaniem źródeł, bez kopiowania zdjęć i skanów. Orientacyjna pozycja 50.098064, 18.549650. Dane przykładowe usunięte z publikowanego katalogu.

## Wyniki

- `npm test`: 7 testów walidacji/SSG, w tym daty kalendarzowe, slugi, nieznane pola, DTO, draft, brak pozycji i brak skanu — PASS.
- `npm run test:emulator`: 7 testów API i reguł na Firestore/Storage — PASS. Brak App Check/Auth, inny provider, draft/brak dokumentu, niedozwolone pola i usuwanie są odrzucane. Z dwóch równoczesnych zapisów przechodzi jeden; drugi dostaje `aborted`. Reguły blokują bezpośredni odczyt/listę/zapis/usunięcie Firestore, także z Auth i deklaracją admina, osobno dla nazwanej bazy `places-dev`; prywatne pliki są niedostępne.
- Build Angular: trzy statyczne strony, bez WebGL na serwerze; kontrola surowego HTML karty, referencji, canonical, Open Graph, sitemap, 404, noindex, stylu mapy i 1045 kafelków — PASS.
- Wdrożenie usług: baza Standard `places-dev`, bucket dev, Functions w Warszawie; Google Auth, reCAPTCHA Enterprise App Check, osobne konta API/import/build. Serwerowy import i snapshot przez impersonację zatwierdzonych kont — PASS.
- Wdrożone callable: brak App Check i błędny token → 401; prawidłowy App Check → 200 i dokładnie jeden publiczny rekord; brak Auth przy zapisie → 401 — PASS.
- Właściciel wykonał test przez lokalny klient Google Auth + App Check. Logi `placesDevUpdate`: 5 listopada 2026, 12:12:33 UTC → 200; ponowienie ze starą wersją, 12:12:34 UTC → 409. Baza potwierdziła `locationVersion: 1`, `updatedAt: 2026-11-05T12:12:34.334Z`, niezmienione współrzędne. Brak autora i historii. Testowe tokeny App Check odwołano; nie trafiły do repo ani bundle.
- Rzeczywisty dev: `/` i bezpośrednia karta → HTTP 200, nieznane adresy i nieznany slug → HTTP 404, `/sitemap.xml` → 200. Wszystkie odpowiedzi zachowują `X-Robots-Tag: noindex, nofollow` — PASS.
- Przeglądarka: odczyt z rzeczywistym reCAPTCHA App Check, mapa i marker bez błędów konsoli; wyszukiwanie `srodmiescie` znajduje Śródmieście, karta otwiera URL, Wstecz zachowuje zapytanie i instancję mapy — PASS. Obsługa planu z fazy 2 zachowana.
- Rozliczenia: konto wskazane i zatwierdzone przez właściciela, alert 10 PLN/miesiąc na projekt, progi 50/90/100%; automatyczne sprzątanie obrazów Functions po 1 dniu. Alert nie jest limitem blokującym koszty.

Nie opublikowano produkcyjnego Hostingu. Produkcja w fazie 5 wymaga własnej bazy/bucketa/Functions i konfiguracji frontendowej; Authentication pozostaje wspólne zgodnie z decyzją właściciela. Interfejs logowania i edycji należy do fazy 4.
