# Globalne menu daisyUI — 7 listopada 2026

Zadanie: https://github.com/users/maciejkoch/projects/1?pane=issue&itemId=296920189
Branch: `codex/daisyui-menu`; baza `65870a8c` z origin/main.

Menu zostało przeniesione do wspólnego układu aplikacji, aby standardowy Drawer daisyUI obejmował treść i panel. Checkbox `drawer-toggle` steruje bibliotekowymi przejściami otwierania i zamykania; nakładka używa `drawer-overlay`. `PortalMenuState` łączy przycisk nagłówka z menu. Angular obsługuje `inert`, fokus, Escape, nawigację oraz blokadę przewijania. Dropdown korzysta z Popover API i CSS Anchor Positioning zgodnie z przykładem daisyUI. Usunięto osobny plik CSS menu i własną animację.

## Weryfikacja lokalna

- `npm test`: kontrakty, 5 testów prywatności, 15 testów backendu — PASS.
- `npm run build`: prerender pięciu tras, 404, noindex, mapy i prywatność — PASS; ostrzeżenie budżetu początkowego pakietu około 520 kB wobec 500 kB.
- Chrome: 320×568 (mapa), 390×844 (wyszukiwanie), 768×1024 (prywatność), 390×250 (niski ekran) oraz 390×844 z ograniczonymi animacjami. Każdy scenariusz sprawdza wielokrotne otwarcie i zamknięcie, rzeczywiste położenie w kolejnych klatkach, brak poziomego przewijania, brak ruchu w przeciwną stronę, przycisk, Escape, tło oraz szybkie odwrócenie trwającego przejścia.
- Sprawdzono fokus i Tab/Shift+Tab, `inert` tła i zamkniętego panelu, powrót fokusu do hamburgera, przewijanie niskiego panelu, nawigację prywatność → mapa → wyszukiwanie, Wstecz/Dalej, kartę miejsca i zmianę rozmiaru okna.
- Ustawienia cookies otrzymują fokus po zamknięciu menu; po zamknięciu ustawień fokus wraca do hamburgera. Zweryfikowano mobile oraz desktop.
- Desktop 1440×900: wyrównanie do prawej krawędzi hamburgera i otwarcie poniżej niego, brak Szukaj, zamknięcie przez Escape, przycisk i kliknięcie poza menu.
- Testy dotyczą emulacji w Chrome. Nie wykonano odbioru na fizycznym telefonie ani Safari.

## Uruchomienie sprawdzenia przeglądarkowego

Uruchom aplikację przez `npm start -- --port 4300`. Skrypt nie dodaje zależności do aplikacji; korzysta z dostępnego Playwright i osobnego bezgłowego Chrome z tymczasowym profilem:

```sh
PLAYWRIGHT_MODULE=/absolutna/sciezka/do/playwright node agent-context/daisyui-menu/verify.cjs
```

`MENU_TEST_URL` zmienia adres (domyślnie `http://localhost:4300`). Bez `PLAYWRIGHT_MODULE` używany jest moduł `playwright` dostępny w środowisku uruchomienia.

## Dokumentacja

Sprawdzono README, TECHNICAL, CONTRIBUTING, SECURITY oraz README src i agent-context. Uaktualniono istniejący opis architektury w TECHNICAL i informację o integracji menu w opisie prywatności. Funkcjonalne README oraz zasady pracy i bezpieczeństwa nie wymagają zmian. Nie zmieniono skryptów utrzymania aplikacji ani komend npm.
