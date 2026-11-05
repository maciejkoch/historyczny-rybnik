# Zwijanie i szerokość panelu mapowego

Wdrożenie na dev: 5 listopada 2026. Gałąź `codex/resizable-sidebar`; PR oparty na `codex/mvp-phase-3`, aby obejmował wyłącznie panel.

Na desktopie przycisk w nagłówku zwija lewą kolumnę do 56 px i przywraca ostatnią szerokość. Treść panelu jest przewijana niezależnie, a nagłówek i stopka pozostają dostępne. Zwijanie zachowuje wybór, zapytanie oraz przewinięcie; kliknięcie znacznika rozwija kartę. Zmiana rozmiaru nie odtwarza komponentu MapLibre; istniejący ResizeObserver dopasowuje canvas.

Szerokość domyślna: 410 px; minimum: 320 px; maksimum: 60% dostępnej szerokości, dodatkowo ograniczone tak, aby mapa zachowała 320 px. Obliczenia uwzględniają faktyczną szerokość kontenera, w tym systemowy pasek przewijania. Uchwyt ma 8 px, pointer capture i obsługuje mysz/pióro/dotyk.

Uchwyt jest dostępny dla klawiatury jako pionowy separator z aktualną wartością i zakresem:

- strzałki lewo/prawo: 16 px, z Shift: 64 px;
- Home / End: minimum / maksimum;
- Enter: zwinięcie i przeniesienie fokusu do przycisku rozwijania;
- podwójne kliknięcie: domyślna szerokość;
- Escape lub anulowanie gestu: przywrócenie szerokości sprzed przeciągania.

Szerokość i stan zwinięcia są zapisane w przeglądarce pod `historyczny-rybnik.panel.v1`. Brak dostępu do localStorage oraz nieprawidłowa zapisana wartość nie blokują kontrolek. Odczyt ustawień następuje po hydratacji; statyczny HTML zawiera pełną treść miejsca.

Do 740 px pozostaje pionowy układ z fazy 3, bez separatora i przycisku zwijania. Zapamiętane zwinięcie desktopowe nie ukrywa treści telefonu. Nie dodano biblioteki komponentów: daisyUI styluje przycisk, a dyrektywa Angular obsługuje stan i gesty.

Kontrola lokalna: build i prerender PASS; przeciąganie 426 → 606 px, zmiana strzałką 410 → 426 px, pasek 56 px, przywrócenie zapytania i szerokości oraz odtworzenie zwinięcia po odświeżeniu PASS. Telefon 390 px: pełna treść, bez poziomego przepełnienia. Granica desktopu 741 px: panel 398 px, mapa 320 px, bez poziomego przepełnienia. Sprawdzono zgodność szerokości canvas z mapą.

Odbiór wdrożenia dev: minimum Home 320 px, Shift+strzałka 384 px, maksimum 759 px w kontenerze 1265 px; podwójne kliknięcie przywraca 410 px. Przewinięcie karty 541 px pozostaje po Enter i rozwinięciu przyciskiem. Znacznik otwiera zwiniętą kartę i przenosi fokus do jej nagłówka. Statyczne strony `/` i karta zwracają 200, nieznany slug 404; `noindex` pozostaje. `npm test` i build PASS. Build zgłasza nieblokujące ostrzeżenie budżetu stylu Atlas: 5,52 kB wobec progu ostrzeżenia 4 kB (limit błędu 8 kB); progów nie podnoszono.
